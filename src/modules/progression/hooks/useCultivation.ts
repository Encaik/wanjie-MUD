// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * 修炼系统 Hook
 * 管理修炼、休养、自动修炼等功能
 */

'use client';

import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import { calcPlayerMaxHp, calcPlayerMaxMp } from '@/core/calculation';
import { executeCultivation, getMaxExperience, executeBreakthrough } from '@/modules/progression/logic/cultivation';
import { executeCultivationWithStrategy } from '@/modules/progression/logic/cultivationStrategy';
import type { CultivationStrategy } from '@/modules/progression/logic/types';
import type { StrategyChoice } from '@/modules/progression/logic/demonBreakthrough';
import { updateTaskProgress } from '@/core/engine';
import { processExperienceGain, calculateBreakthroughTransfer } from '@/modules/progression/logic/experienceSystem';
import { gameSystems } from '@/core/engine';
import { getRealmName } from '@/modules/progression/data/realmCore';
import { applyGrowthStatChanges, getGrowthStatCap } from '@/modules/progression/logic/realmSystem';
import { gameClock, cooldown } from '@/core/time';
import {
  emitCultivationBreakthrough,
  emitCultivationPerformed,
  emitPlayerLevelUp,
} from '@/core/statistics';
import {
  GameState,
  MessageRecord,
  ActiveEffect,
  GrowthStats,
} from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION, MentalState } from '@/core/types';
import { removeItem, getCurrencyAmount } from '@/modules/item/logic';
import { getTemplate } from '@/modules/item/data';
import { getWorldviewCurrencyItemId } from '@/modules/reward-pool/logic/poolEngine';
import type { ItemInstance } from '@/modules/item/types';

/** 获取当前世界观货币 templateId */
function getCultivationCurrencyId(worldviewId?: string): string {
  return getWorldviewCurrencyItemId(worldviewId ?? '');
}

/** 按模板 ID 从物品列表中扣除数量（不可变） */
function deductByTemplate(items: ItemInstance[], templateId: string, quantity: number): ItemInstance[] {
  const target = items.find(i => i.templateId === templateId);
  if (!target) return items;
  return removeItem(items, target.instanceId, quantity);
}

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

  let newItems = [...(prev.protagonist.items || [])];
  if (result.spiritStonesSpent > 0) {
    const actualCost = result.spiritStonesSpent - result.spiritStonesRefunded;
    const currencyId = getCultivationCurrencyId(prev.protagonist.world.worldviewId);
    const stoneItem = newItems.find(i => i.templateId === currencyId);
    if (stoneItem) {
      newItems = removeItem(newItems, stoneItem.instanceId, actualCost);
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

  // 统计更新统一由事件总线处理，此处不再直接更新

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

  // 通过事件总线发出修炼事件（新手引导、统计系统等监听）
  emitCultivationPerformed(1);

  return {
    ...prev,
    protagonist: {
      ...prev.protagonist,
      items: newItems,
      activeEffects: newActiveEffects,
      experience: newExp,
      overflowExperience: newOverflowExp,
      insightMarks: newInsightMarks,
      pathExp: newPathExp,
      pathLevel: newPathLevel,
    },
    statistics: prev.statistics,
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
  performBreakthrough: (phase2Choice: StrategyChoice | null) => void;
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
      
      let newItems = [...(prev.protagonist.items || [])];
      let newStats = prev.protagonist.stats;
      let newLevel = prev.protagonist.level;
      const newStatCapBonuses = prev.protagonist.statCapBonuses;

      // 修炼不再自动触发突破——经验满时标记 breakthroughReady，
      // 实际突破通过 performBreakthrough() 手动调用 executeBreakthrough()

      const costDetails: string[] = [];
      if (result.itemsCost) {
        for (const cost of result.itemsCost) {
          costDetails.push(`${getTemplate(cost.templateId).name} x${cost.quantity}`);
          newItems = deductByTemplate(newItems, cost.templateId, cost.quantity);
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

      // 普通修炼：处理经验获取
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

      // 修炼成功时增加心境护盾
      let newMindShield = prev.protagonist.mentalState?.mindShield ?? 0;
      if (result.success) {
        newMindShield = Math.min(20, newMindShield + 1);
      }

      // 经验满可突破时的提示
      if (result.breakthroughReady) {
        messageTitle = '修炼（可突破）';
        result.message += `\n\n⚡ 修为已满！点击"冲击境界"挑战心魔突破。`;
      }

      const rewards: MessageRecord['rewards'] = {};
      if (result.statChanges && Object.keys(result.statChanges).length > 0) {
        rewards.stats = result.statChanges;
        const hasBaseGains = result.baseGains && Object.values(result.baseGains).some(v => v !== 0);
        const hasBoostGains = result.boostGains && Object.values(result.boostGains).some(v => v !== 0);

        if (hasBaseGains || hasBoostGains) {
          rewards.statDetails = Object.keys(result.statChanges).map(stat => ({
            stat,
            base: result.baseGains![stat as keyof typeof result.baseGains] || 0,
            boost: result.boostGains![stat as keyof typeof result.boostGains] || 0,
          }));
        }
      }
      rewards.experience = result.experienceGain ?? (() => {
        const levelBonus = Math.floor(newLevel / 10) * 5;
        return (result.success ? 20 : 5) + levelBonus;
      })();
      if (result.experienceBoost && result.experienceBoost > 0) {
        rewards.experienceBoost = result.experienceBoost;
      }
      
      const details = costDetails.length > 0 ? `消耗: ${costDetails.join(', ')}` : undefined;

      const newStatistics = prev.statistics;

      const statGains: Record<string, number> = {};
      if (result.statChanges) {
        Object.assign(statGains, result.statChanges);
      }
      gameSystems.triggerCultivationDone(statGains, false, false);
      
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
      
      // 突破不再在修炼流程中处理，由 performBreakthrough 单独处理

      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          stats: newStats,
          items: newItems,
          activeEffects: newActiveEffects,
          level: newLevel,
          realm: newRealm,
          experience: newExp,
          overflowExperience: newOverflowExp,
          statCapBonuses: newStatCapBonuses,
          factionProgress: newFactionProgress,
          pathExp: newPathExp,
          pathLevel: newPathLevel,
          mentalState: {
            ...(prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState),
            mindShield: newMindShield,
          },
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
      
      const currencyId = getCultivationCurrencyId(prev.protagonist.world.worldviewId);
      const spiritStones = getCurrencyAmount(prev.protagonist.items, currencyId);

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

      const stoneItem = prev.protagonist.items.find(i => i.templateId === currencyId);
      let newItems = prev.protagonist.items;
      if (stoneItem) {
        newItems = removeItem(newItems, stoneItem.instanceId, 5);
      }
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          currentHp: newHp,
          currentMp: newMp,
          items: newItems,
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

  // 执行心魔突破战
  const performBreakthrough = useCallback((phase2Choice: StrategyChoice | null) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;

      const result = executeBreakthrough(prev.protagonist, phase2Choice);

      if (!phase2Choice) {
        return {
          ...prev,
          lastActionResult: {
            success: true,
            message: `心魔突破流程已启动：${result.phaseResults.phase1.totalMindDamage > 0 ? `心境受创 -${result.phaseResults.phase1.totalMindDamage}` : '全属性压制！'}`,
            statChanges: {},
          },
        };
      }

      let newLevel = prev.protagonist.level;
      let newRealm = prev.protagonist.realm;
      let newStats = prev.protagonist.stats;
      let newExp = prev.protagonist.experience;
      let newOverflowExp = prev.protagonist.overflowExperience;

      if (result.success && result.levelUp) {
        newLevel += 1;
        newRealm = getRealmName(prev.protagonist.world.realmSystem, newLevel);
        const nextMaxExp = getMaxExperience(newLevel);
        newExp = calculateBreakthroughTransfer(newOverflowExp, nextMaxExp);
        newOverflowExp = 0;

        if (Object.keys(result.statGains).length > 0) {
          newStats = applyGrowthStatChanges(
            prev.protagonist.stats,
            result.statGains,
            newLevel * 2,
          );
        }
      }

      const currentMental = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
      const newStability = Math.max(0, Math.min(100,
        currentMental.stability + (result.stabilityChange ?? 0)
      ));
      const newDemonChance = Math.max(0, Math.min(1,
        (currentMental.demonChance ?? 0) + (result.phaseResults.phase2.demonChanceChange ?? 0)
      ));
      const newMindShield = Math.max(0,
        (currentMental.mindShield ?? 0) + (result.mindShieldChange ?? 0)
      );

      const newMentalState = {
        ...currentMental,
        stability: newStability,
        demonChance: newDemonChance,
        mindShield: newMindShield,
        demonCodex: result.demonMemory
          ? [
              ...(currentMental.demonCodex ?? []).filter(
                m => m.demonType !== result.demonMemory.demonType,
              ),
              result.demonMemory,
            ]
          : currentMental.demonCodex ?? [],
        lastDemonTime: Date.now(),
      };

      const msgType = result.success ? 'success' : 'failure';
      const msgTitle = result.success ? '境界突破成功！' : '突破失败';

      if (result.success) {
        emitCultivationBreakthrough(prev.protagonist.realm, newRealm, 1);
        if (newLevel > prev.protagonist.level) {
          emitPlayerLevelUp(prev.protagonist.level, newLevel);
        }
      }

      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          level: newLevel,
          realm: newRealm,
          stats: newStats,
          experience: newExp,
          overflowExperience: newOverflowExp,
          mentalState: newMentalState,
        },
        statistics: prev.statistics,
        messages: addMessageInternal(
          prev.messages,
          msgType,
          msgTitle,
          result.messages.join('\n'),
          undefined,
          result.success && Object.keys(result.statGains).length > 0
            ? { stats: result.statGains }
            : undefined,
        ),
      };
    });
  }, [addMessageInternal, setGameState]);

  // 切换自动修炼
  const toggleAutoCultivation = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.autoCultivating && prev.fortuneSlice.session) {
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
        
        const currencyId = getCultivationCurrencyId(prev.protagonist.world.worldviewId);
        const hasResources = getCurrencyAmount(prev.protagonist.items, currencyId) >= 20;

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

        let newItems = [...(prev.protagonist.items || [])];

        if (result.itemsCost) {
          for (const cost of result.itemsCost) {
            newItems = deductByTemplate(newItems, cost.templateId, cost.quantity);
          }
        }

        const newActiveEffects = result.success
          ? updateActiveEffects(prev.protagonist.activeEffects)
          : prev.protagonist.activeEffects;

        if (result.breakthroughReady) {
          // 自动修炼时经验满了不自动突破，停止自动修炼让玩家手动操作
          isRunning = false;
          return {
            ...prev,
            autoCultivating: false,
            protagonist: {
              ...prev.protagonist,
              items: newItems,
              activeEffects: newActiveEffects,
              experience: getMaxExperience(prev.protagonist.level), // 满经验
            },
            messages: addMessageInternal(
              prev.messages,
              'success',
              '自动修炼暂停',
              '修为已满，可尝试冲击境界突破！自动修炼已暂停。',
            ),
          };
        }

        const newExp = prev.protagonist.experience;
        const newOverflowExp = prev.protagonist.overflowExperience;

        const maxExp2 = getMaxExperience(prev.protagonist.level);
        const expGain2 = result.success ? 20 : 5;
        const expResult2 = processExperienceGain(newExp, expGain2, maxExp2, newOverflowExp);
        const finalExp = expResult2.newExp;
        const finalOverflow = expResult2.newOverflow;

        isRunning = false;

        const messageType: MessageRecord['type'] = result.success ? 'success' : 'info';
        const messageTitle = '自动修炼';
        const messageContent = result.message;

        const rewards: MessageRecord['rewards'] = {};
        if (result.statChanges && Object.keys(result.statChanges).length > 0) {
          rewards.stats = result.statChanges;
        }
        rewards.experience = result.success ? 20 : 5;

        // 通过事件总线发出修炼事件（新手引导、统计系统等监听）
        emitCultivationPerformed(1);

        // 修炼成功时增加心境护盾
        let newMindShield2 = prev.protagonist.mentalState?.mindShield ?? 0;
        if (result.success) {
          newMindShield2 = Math.min(20, newMindShield2 + 1);
        }

        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            items: newItems,
            activeEffects: newActiveEffects,
            experience: finalExp,
            overflowExperience: finalOverflow,
            mentalState: {
              ...(prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState),
              mindShield: newMindShield2,
            },
          },
          statistics: prev.statistics,
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
    performBreakthrough,
    toggleAutoCultivation,
  };
}
