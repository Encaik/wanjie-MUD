/**
 * 修炼系统 Hook
 * 管理修炼、休养、自动修炼等功能
 */

'use client';

import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import { calcPlayerMaxHp, calcPlayerMaxMp } from '@/core/calculation';
import { executeCultivation, getMaxExperience } from '@/modules/progression/logic/cultivation';
import { executeCultivationWithStrategy } from '@/modules/progression/logic/cultivationStrategy';
import type { CultivationStrategy } from '@/modules/progression/logic/types';
import { applyMentalChange } from '@/core/engine';
import { updateTaskProgress } from '@/core/engine';
import { processExperienceGain, calculateBreakthroughTransfer } from '@/modules/progression/logic/experienceSystem';
import { gameSystems } from '@/core/engine';
import { getRealmName } from '@/modules/identity/logic/generators';
import { applyGrowthStatChanges, getGrowthStatCap } from '@/modules/progression/logic/realmSystem';
import { gameClock, cooldown } from '@/core/time';
import { 
  GameState, 
  MessageRecord, 
  InventoryItem,
  ActiveEffect,
  GrowthStats,
} from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION, MentalState } from '@/core/types';

import { removeFromInventory } from '@/modules/equipment/hooks/inventoryUtils';

/**
 * 处理策略修炼结果并返回新的 GameState
 * 独立于 Hook，减少回调内代码量
 */
function handleStrategyCultivationImpl(
  prev: GameState,
  strategy: CultivationStrategy,
  addMessageInternal: UseGameCultivationProps['addMessageInternal'],
  updateActiveEffects: UseGameCultivationProps['updateActiveEffects']
): GameState {
  if (!prev.protagonist) return prev;

  const result = executeCultivationWithStrategy(prev.protagonist, strategy);

  if (!result.success && result.spiritStonesSpent === 0) {
    return {
      ...prev,
      lastActionResult: { success: false, message: result.message } as GameState['lastActionResult'],
      messages: addMessageInternal(prev.messages, 'warning', '修炼', result.message),
    };
  }

  let newInventory = [...(prev.protagonist.inventory || [])];
  const stoneItem = newInventory.find(i => i.definition.id === 'spirit_stone');
  if (stoneItem && result.spiritStonesSpent > 0) {
    const actualCost = result.spiritStonesSpent - result.spiritStonesRefunded;
    stoneItem.quantity = Math.max(0, stoneItem.quantity - actualCost);
    if (stoneItem.quantity <= 0) {
      newInventory = newInventory.filter(i => i.definition.id !== 'spirit_stone');
    }
  }

  const newActiveEffects = result.success
    ? updateActiveEffects(prev.protagonist.activeEffects)
    : prev.protagonist.activeEffects;

  const newInsightMarks = (prev.protagonist.insightMarks ?? 0) + (result.insightMarkGained ? 1 : 0);

  // 经验处理
  let newExp = prev.protagonist.experience;
  let newOverflowExp = prev.protagonist.overflowExperience;
  const maxExp = getMaxExperience(prev.protagonist.level);
  const expGain = result.experienceGain;
  const expResult = processExperienceGain(newExp, expGain, maxExp, newOverflowExp);
  newExp = expResult.newExp;
  newOverflowExp = expResult.newOverflow;

  // 统计
  const newStatistics = {
    ...prev.statistics,
    totalCultivations: prev.statistics.totalCultivations + 1,
  };

  // 流派经验
  let newPathExp = prev.protagonist.pathExp ?? 0;
  let newPathLevel = prev.protagonist.pathLevel ?? 1;
  if (prev.protagonist.cultivationPath && result.success) {
    const pathConfig = CULTIVATION_PATHS[prev.protagonist.cultivationPath];
    newPathExp += Math.floor(5 * (1 + pathConfig.cultivationBonus / 100));
    if (newPathExp >= newPathLevel * 100) {
      newPathExp -= newPathLevel * 100;
      newPathLevel += 1;
    }
  }

  // 时间消耗 + 冷却
  let newTime = prev.time ? gameClock.advance(prev.time, 'cultivate') : prev.time;
  if (result.cooldownUntil > 0) {
    newTime = cooldown.set(newTime, 'cultivate', Math.max(0, result.cooldownUntil - Date.now()), Date.now());
  }

  // 构建奖励消息
  const rewards: MessageRecord['rewards'] = {};
  if (Object.keys(result.statChanges).length > 0) {
    rewards.stats = result.statChanges as Partial<GrowthStats>;
  }
  if (result.experienceGain > 0) {
    rewards.experience = result.experienceGain;
  }

  // 冷却提示
  let extraMsg = '';
  if (result.cooldownUntil > 0) {
    const mins = Math.ceil((result.cooldownUntil - Date.now()) / 60000);
    extraMsg = `\n进入 ${mins} 分钟冥想冷却。`;
  }
  if (result.insightMarkGained) {
    extraMsg += `\n获得一枚顿悟印记！（当前 ${newInsightMarks} 枚）`;
  }
  if (result.critEvent) {
    extraMsg += '\n触发修炼暴击！请在弹窗中选择奖励。';
  }

  return {
    ...prev,
    protagonist: {
      ...prev.protagonist,
      inventory: newInventory,
      activeEffects: newActiveEffects,
      experience: newExp,
      overflowExperience: newOverflowExp,
      insightMarks: newInsightMarks,
      pathExp: newPathExp,
      pathLevel: newPathLevel,
    },
    statistics: newStatistics,
    time: newTime,
    lastActionResult: { success: result.success, message: result.message + extraMsg } as GameState['lastActionResult'],
    messages: addMessageInternal(
      prev.messages,
      result.success ? 'success' : 'info',
      strategy === 'insight' ? '顿悟修炼' : strategy === 'aggressive' ? '激进修炼' : '稳健修炼',
      result.message + extraMsg,
      undefined,
      rewards
    ),
  };
}


export interface UseGameCultivationProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addMessageInternal: (
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => MessageRecord[];
  updateActiveEffects: (effects: ActiveEffect[]) => ActiveEffect[];
}

export interface UseGameCultivationReturn {
  performCultivation: (strategy?: CultivationStrategy) => void;
  performRest: () => void;
  toggleAutoCultivation: () => void;
}

/**
 * 修炼系统 Hook
 */
export function useGameCultivation({
  gameState,
  setGameState,
  addMessageInternal,
  updateActiveEffects,
}: UseGameCultivationProps): UseGameCultivationReturn {
  
  // 执行修炼
  const performCultivation = useCallback((strategy?: CultivationStrategy) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;

      // 检查冷却
      if (strategy && cooldown.isActive(prev.time, 'cultivate', Date.now())) {
        const remaining = Math.ceil(cooldown.remaining(prev.time, 'cultivate', Date.now()) / 1000);
        return {
          ...prev,
          lastActionResult: { success: false, message: `冥想冷却中，剩余 ${remaining} 秒` },
          messages: addMessageInternal(prev.messages, 'warning', '修炼冷却', `冥想冷却中，剩余 ${remaining} 秒`),
        };
      }

      // 策略修炼：使用新路径
      if (strategy) {
        return handleStrategyCultivationImpl(prev, strategy, addMessageInternal, updateActiveEffects);
      }

      // 传统修炼：使用旧路径
      const result = executeCultivation(prev.protagonist);

      if (result.canAfford === false) {
        return {
          ...prev,
          lastActionResult: result,
          messages: addMessageInternal(prev.messages, 'warning', '修炼失败', result.message),
        };
      }
      
      let newMentalStateForReturn: MentalState | undefined;
      let mentalChangeMessage: string = '';
      
      let newInventory = [...(prev.protagonist.inventory || [])];
      let newStats = prev.protagonist.stats;
      let newLevel = prev.protagonist.level;
      const newStatCapBonuses = prev.protagonist.statCapBonuses;

      // 处理 itemsCost
      if (result.itemsCost) {
        for (const cost of result.itemsCost) {
          newInventory = removeFromInventory(newInventory, cost.definition.id, cost.quantity);
        }
      }
      
      // 【重构】突破时属性增长设计
      // 1. 不再所有属性都增长，而是随机选择 1-2 个属性
      // 2. 增长值更合理（1-3点），符合游戏平衡
      // 3. 记录实际应用的值，用于消息显示
      const actualStatGains: Partial<GrowthStats> = {};
      
      if (result.breakthroughSuccess) {
        const growthCap = newLevel * 2;
        
        // 随机选择 1-2 个属性进行增长
        const allStats = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
        const numStatsToGrow = Math.random() < 0.3 ? 2 : 1; // 30% 概率增长2个属性
        const shuffled = [...allStats].sort(() => Math.random() - 0.5);
        const statsToGrow = shuffled.slice(0, numStatsToGrow);
        
        // 每个属性增长 1-3 点
        for (const stat of statsToGrow) {
          const gain = Math.floor(Math.random() * 3) + 1; // 1-3 点
          actualStatGains[stat] = gain;
        }
        
        newStats = applyGrowthStatChanges(
          prev.protagonist.stats,
          actualStatGains,
          growthCap
        );
        
        // 更新 result.statChanges 以便消息显示正确
        result.statChanges = actualStatGains;
      }
      
      const costDetails: string[] = [];
      if (result.itemsCost) {
        for (const cost of result.itemsCost) {
          costDetails.push(`${cost.definition.name} x${cost.quantity}`);
          newInventory = removeFromInventory(newInventory, cost.definition.id, cost.quantity);
        }
      }
      
      const newActiveEffects = result.success 
        ? updateActiveEffects(prev.protagonist.activeEffects)
        : prev.protagonist.activeEffects;
      
      let newRealm = prev.protagonist.realm;
      let newExp = prev.protagonist.experience;
      let newOverflowExp = prev.protagonist.overflowExperience;
      let messageType: MessageRecord['type'] = 'info';
      let messageTitle = '修炼';
      
      if (result.breakthroughSuccess) {
        newLevel += 1;
        newRealm = getRealmName(prev.protagonist.world.realmSystem, newLevel);
        const nextMaxExp = getMaxExperience(newLevel);
        newExp = calculateBreakthroughTransfer(newOverflowExp, nextMaxExp);
        newOverflowExp = 0;
        messageType = 'success';
        messageTitle = '境界突破';
        
        const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        const { newState: newMentalState } = applyMentalChange(currentMentalState, 'breakthrough_success');
        newMentalStateForReturn = newMentalState;
      } else if (result.breakthroughAttempt) {
        const levelBonus = Math.floor(newLevel / 10) * 5;
        const baseExpGain = result.success ? 20 : 5;
        const expGain = baseExpGain + levelBonus;
        const maxExp = getMaxExperience(newLevel);
        const expResult = processExperienceGain(newExp, expGain, maxExp, newOverflowExp);
        newExp = expResult.newExp;
        newOverflowExp = expResult.newOverflow;
        messageType = 'failure';
        messageTitle = '突破失败';
        
        const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        const { newState: newMentalState, message: mentalMsg } = applyMentalChange(currentMentalState, 'breakthrough_fail');
        newMentalStateForReturn = newMentalState;
        mentalChangeMessage = mentalMsg;
      } else {
        const maxExp = getMaxExperience(newLevel);
        const expGain = result.experienceGain ?? (() => {
          const levelBonus = Math.floor(newLevel / 10) * 5;
          const baseExpGain = result.success ? 20 : 5;
          return baseExpGain + levelBonus;
        })();
        const expResult = processExperienceGain(newExp, expGain, maxExp, newOverflowExp);
        newExp = expResult.newExp;
        newOverflowExp = expResult.newOverflow;
        messageType = result.success ? 'success' : 'info';
      }
      
      const rewards: MessageRecord['rewards'] = {};
      if (result.statChanges && Object.keys(result.statChanges).length > 0) {
        rewards.stats = result.statChanges;
        // 检查 baseGains 和 boostGains 是否有实际内容
        const hasBaseGains = result.baseGains && Object.values(result.baseGains).some(v => v !== 0);
        const hasBoostGains = result.boostGains && Object.values(result.boostGains).some(v => v !== 0);
        
        if (hasBaseGains || hasBoostGains) {
          // 有丹药加成的情况，显示详细的 base+boost
          rewards.statDetails = Object.keys(result.statChanges).map(stat => ({
            stat,
            base: result.baseGains![stat as keyof typeof result.baseGains] || 0,
            boost: result.boostGains![stat as keyof typeof result.boostGains] || 0,
          }));
        }
        // 突破成功时，statChanges 就是 actualStatGains，不需要 statDetails
        // MessagePanel 会直接显示 stats 的值
      }
      if (result.breakthroughSuccess) {
        rewards.experience = newExp;
      } else if (!result.breakthroughAttempt) {
        rewards.experience = result.experienceGain ?? (() => {
          const levelBonus = Math.floor(newLevel / 10) * 5;
          return (result.success ? 20 : 5) + levelBonus;
        })();
        if (result.experienceBoost && result.experienceBoost > 0) {
          rewards.experienceBoost = result.experienceBoost;
        }
      }
      
      const details = costDetails.length > 0 ? `消耗: ${costDetails.join(', ')}` : undefined;
      
      let newStatistics = prev.statistics;
      newStatistics = {
        ...newStatistics,
        totalCultivations: newStatistics.totalCultivations + 1,
      };
      if (result.breakthroughSuccess) {
        newStatistics = {
          ...newStatistics,
          totalBreakthroughs: newStatistics.totalBreakthroughs + 1,
        };
      }
      if (newLevel > newStatistics.maxLevel) {
        newStatistics = {
          ...newStatistics,
          maxLevel: newLevel,
        };
      }
      
      // 将 statChanges 转换为 Record<string, number> 格式
      const statGains: Record<string, number> = {};
      if (result.statChanges) {
        if ('growth' in result.statChanges && result.statChanges.growth) {
          Object.assign(statGains, result.statChanges.growth);
        }
      }
      gameSystems.triggerCultivationDone(
        statGains,
        !!result.breakthroughAttempt,
        !!result.breakthroughSuccess
      );
      if (newLevel > prev.protagonist.level) {
        gameSystems.triggerLevelUp(prev.protagonist.level, newLevel);
      }
      
      let newFactionProgress = prev.protagonist.factionProgress;
      if (prev.protagonist.factionId && newFactionProgress && result.success) {
        newFactionProgress = updateTaskProgress(
          newFactionProgress,
          'cultivate',
          'any',
          1
        );
      }
      
      let newPathExp = prev.protagonist.pathExp ?? 0;
      let newPathLevel = prev.protagonist.pathLevel ?? 1;
      const cultivationPath = prev.protagonist.cultivationPath;
      
      if (cultivationPath && result.success) {
        const pathConfig = CULTIVATION_PATHS[cultivationPath];
        const baseExpGain = 5;
        const pathExpGain = Math.floor(baseExpGain * (1 + pathConfig.cultivationBonus / 100));
        
        newPathExp += pathExpGain;
        const expNeeded = newPathLevel * 100;
        if (newPathExp >= expNeeded) {
          newPathExp -= expNeeded;
          newPathLevel += 1;
        }
      }
      
      const newTime = prev.time ? gameClock.advance(prev.time, 'cultivate') : prev.time;
      
      // 突破成功时重新计算 maxHp 和 maxMp
      let newMaxHp = prev.protagonist.maxHp;
      let newMaxMp = prev.protagonist.maxMp;
      let newCurrentHp = prev.protagonist.currentHp;
      let newCurrentMp = prev.protagonist.currentMp;
      
      if (result.breakthroughSuccess) {
        // 根据新属性和新等级重新计算最大血量和法力
        newMaxHp = calcPlayerMaxHp(newStats.base.体质, newLevel, prev.protagonist.world.worldStats);
        newMaxMp = calcPlayerMaxMp(newStats.base.灵根, newLevel);
        // 突破成功时恢复满血满蓝
        newCurrentHp = newMaxHp;
        newCurrentMp = newMaxMp;
      }
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          stats: newStats,
          inventory: newInventory,
          activeEffects: newActiveEffects,
          level: newLevel,
          realm: newRealm,
          experience: newExp,
          overflowExperience: newOverflowExp,
          statCapBonuses: newStatCapBonuses,
          maxHp: newMaxHp,
          maxMp: newMaxMp,
          currentHp: newCurrentHp,
          currentMp: newCurrentMp,
          factionProgress: newFactionProgress,
          pathExp: newPathExp,
          pathLevel: newPathLevel,
          ...(newMentalStateForReturn ? { mentalState: newMentalStateForReturn } : {}),
        },
        statistics: newStatistics,
        factionProgress: newFactionProgress,
        time: newTime,
        lastActionResult: result,
        messages: addMessageInternal(prev.messages, messageType, messageTitle, result.message + (mentalChangeMessage ? ` ${mentalChangeMessage}` : ''), details, rewards),
      };
    });
  }, [updateActiveEffects, addMessageInternal, setGameState]);

  // 休生养息
  const performRest = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const spiritStones = prev.protagonist.inventory.find(
        i => i.definition.id === 'spirit_stone'
      )?.quantity || 0;
      
      if (spiritStones < 5) {
        return {
          ...prev,
          lastActionResult: {
            success: false,
            message: '灵石不足！休生养息需要5灵石。',
            statChanges: {},
          },
        };
      }
      
      const { currentHp, maxHp, currentMp, maxMp } = prev.protagonist;
      if (currentHp >= maxHp && currentMp >= maxMp) {
        return {
          ...prev,
          lastActionResult: {
            success: false,
            message: '状态已满，无需休养。',
            statChanges: {},
          },
        };
      }
      
      const hpRestore = Math.floor(maxHp * 0.3);
      const mpRestore = Math.floor(maxMp * 0.2);
      
      const newHp = Math.min(maxHp, currentHp + hpRestore);
      const newMp = Math.min(maxMp, currentMp + mpRestore);
      
      const newInventory = prev.protagonist.inventory.map(item => {
        if (item.definition.id === 'spirit_stone') {
          return { ...item, quantity: item.quantity - 5 };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          currentHp: newHp,
          currentMp: newMp,
          inventory: newInventory,
        },
        lastActionResult: {
          success: true,
          message: `休养生息，恢复了 ${hpRestore} 生命和 ${mpRestore} 法力。`,
          statChanges: {},
        },
        messages: addMessageInternal(
          prev.messages, 
          'success', 
          '休生养息', 
          `消耗5灵石，恢复了 ${hpRestore} 生命和 ${mpRestore} 法力。当前状态：${newHp}/${maxHp} HP，${newMp}/${maxMp} MP。`
        ),
      };
    });
  }, [addMessageInternal, setGameState]);

  // 切换自动修炼
  const toggleAutoCultivation = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.autoCultivating && prev.adventureGrid) {
        return prev;
      }
      return {
        ...prev,
        autoCultivating: !prev.autoCultivating,
      };
    });
  }, [setGameState]);

  // 自动修炼逻辑
  useEffect(() => {
    if (!gameState.autoCultivating) return;

    const AUTO_CULTIVATION_INTERVAL = 3000;
    let timeoutId: NodeJS.Timeout | null = null;
    let isRunning = false;

    const runCultivation = () => {
      if (isRunning) return;
      isRunning = true;
      
      setGameState((prev: GameState) => {
        if (!prev.protagonist || !prev.autoCultivating) {
          isRunning = false;
          return prev;
        }
        
        const spiritStone = prev.protagonist.inventory.find(item => item.definition.type === '灵石');
        const hasResources = spiritStone && spiritStone.quantity >= 10;

        if (!hasResources) {
          isRunning = false;
          return {
            ...prev,
            autoCultivating: false,
            messages: addMessageInternal(prev.messages, 'warning', '自动修炼停止', '资源不足，自动修炼已停止。'),
          };
        }

        const result = executeCultivation(prev.protagonist);
        
        if (result.canAfford === false) {
          isRunning = false;
          return {
            ...prev,
            autoCultivating: false,
            lastActionResult: result,
            messages: addMessageInternal(prev.messages, 'warning', '自动修炼停止', '资源不足，自动修炼已停止。'),
          };
        }

        let newInventory = [...(prev.protagonist.inventory || [])];
        let newStats = prev.protagonist.stats;
        let newLevel = prev.protagonist.level;
        
        // 自动修炼不再直接增加属性，只有突破时才增加
        if (result.breakthroughSuccess) {
          const growthGain = Math.floor(Math.random() * 5) + 2; // 2~6点
          const growthCap = newLevel * 2;
          newStats = applyGrowthStatChanges(
            prev.protagonist.stats,
            {
              体质: growthGain,
              灵根: growthGain,
              悟性: growthGain,
              幸运: growthGain,
              意志: growthGain,
            },
            growthCap
          );
        }

        if (result.itemsCost) {
          for (const cost of result.itemsCost) {
            newInventory = removeFromInventory(newInventory, cost.definition.id, cost.quantity);
          }
        }

        const newActiveEffects = result.success 
          ? updateActiveEffects(prev.protagonist.activeEffects)
          : prev.protagonist.activeEffects;

        let newRealm = prev.protagonist.realm;
        let newExp = prev.protagonist.experience;
        let newOverflowExp = prev.protagonist.overflowExperience;

        if (result.breakthroughSuccess) {
          newLevel += 1;
          newRealm = getRealmName(prev.protagonist.world.realmSystem, newLevel);
          const nextMaxExp = getMaxExperience(newLevel);
          newExp = calculateBreakthroughTransfer(newOverflowExp, nextMaxExp);
          newOverflowExp = 0;
        } else if (result.breakthroughAttempt) {
          const expGain = result.success ? 20 : 5;
          const maxExp = getMaxExperience(newLevel);
          const expResult = processExperienceGain(newExp, expGain, maxExp, newOverflowExp);
          newExp = expResult.newExp;
          newOverflowExp = expResult.newOverflow;
        } else {
          const maxExp = getMaxExperience(newLevel);
          const expGain = result.success ? 20 : 5;
          const expResult = processExperienceGain(newExp, expGain, maxExp, newOverflowExp);
          newExp = expResult.newExp;
          newOverflowExp = expResult.newOverflow;
        }

        isRunning = false;
        
        let messageType: MessageRecord['type'] = 'info';
        let messageTitle = '自动修炼';
        const messageContent = result.message;
        
        if (result.breakthroughSuccess) {
          messageType = 'success';
          messageTitle = '境界突破';
        } else if (result.success) {
          messageType = 'success';
        }
        
        const rewards: MessageRecord['rewards'] = {};
        if (result.statChanges && Object.keys(result.statChanges).length > 0) {
          rewards.stats = result.statChanges;
        }
        if (result.breakthroughSuccess) {
          rewards.experience = newExp;
        } else if (!result.breakthroughAttempt) {
          rewards.experience = result.success ? 20 : 5;
        }
        
        let newStatistics = prev.statistics;
        newStatistics = {
          ...newStatistics,
          totalCultivations: newStatistics.totalCultivations + 1,
        };
        if (result.breakthroughSuccess) {
          newStatistics = {
            ...newStatistics,
            totalBreakthroughs: newStatistics.totalBreakthroughs + 1,
          };
        }
        if (newLevel > newStatistics.maxLevel) {
          newStatistics = {
            ...newStatistics,
            maxLevel: newLevel,
          };
        }
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            stats: newStats,
            inventory: newInventory,
            activeEffects: newActiveEffects,
            level: newLevel,
            realm: newRealm,
            experience: newExp,
            overflowExperience: newOverflowExp,
            statCapBonuses: prev.protagonist.statCapBonuses,
          },
          statistics: newStatistics,
          lastActionResult: result,
          messages: addMessageInternal(prev.messages, messageType, messageTitle, messageContent, undefined, rewards),
        };
      });
    };

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        runCultivation();
        if (gameState.autoCultivating) {
          scheduleNext();
        }
      }, AUTO_CULTIVATION_INTERVAL);
    };

    scheduleNext();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [gameState.autoCultivating, updateActiveEffects, addMessageInternal, setGameState]);

  return {
    performCultivation,
    performRest,
    toggleAutoCultivation,
  };
}
