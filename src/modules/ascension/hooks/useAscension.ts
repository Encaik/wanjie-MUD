/**
 * useGameAscension - 飞升系统 Hook
 * 管理渡劫、飞升、挑战守卫、传承选择等功能
 */

'use client';

import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { 
  checkAscensionRequirements, 
  calculateBattleReward, 
  generateNewWorld, 
  calculateInheritance,
  getOrCreateAscensionMark,
  updateAscensionMark
} from '@/modules/ascension/logic/ascensionLogic';
import { calculatePlayerMaxHp, calculatePlayerMaxMp } from '@/modules/progression/logic/balanceConfig';
import { 
  GameState, 
  MessageRecord, 
  InventoryItem,
  World,
  CharacterStats,
  GrowthStats,
  Equipment,
  Technique,
  createInventoryItem,
} from '@/shared/lib/types';
import { DEFAULT_PROTAGONIST_EXTENSION, InheritanceChoice, NewWorldInfo, DiscoveredWorld, GuardianBattleState } from '@/shared/lib/typesExtension';
import { DEFAULT_ASCENSION_FLOW_STATE, DEFAULT_GUARDIAN_BATTLE_STATE } from '@/shared/lib/typesExtension';

interface UseGameAscensionProps {
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
}

export interface UseGameAscensionReturn {
  handleTribulation: () => { success: boolean; message: string };
  recoverStamina: () => void;
  clearOfflineResult: () => void;
  challengeGuardian: () => void;
  onAscensionBattleEnd: (result: {
    victory: boolean;
    turnsUsed: number;
    remainingHpPercent: number;
    phasesCleared: number;
  }) => void;
  onInheritanceConfirm: (choice: InheritanceChoice) => void;
  onInheritanceSkip: () => void;
  onWorldConfirm: (externalNewWorld?: NewWorldInfo) => void;
  onWorldReroll: () => void;
}

/**
 * 飞升系统 Hook
 */
export function useGameAscension({
  gameState,
  setGameState,
  addMessageInternal,
}: UseGameAscensionProps): UseGameAscensionReturn {
  
  // 渡劫
  const handleTribulation = useCallback((): { success: boolean; message: string } => {
    let result = { success: false, message: '未知错误' };
    
    setGameState((prev: GameState) => {
      if (!prev.protagonist) {
        result = { success: false, message: '角色不存在' };
        return prev;
      }
      
      const level = prev.protagonist.level;
      const stats = prev.protagonist.stats;
      
      const { getNextTribulationLevel } = require('@/modules/ascension/data/tribulationData');
      const { startTribulation, executeTribulationPhase, calculateTribulationReward, calculateTribulationPenalty } = require('@/shared/lib/expansionLogic');
      
      const nextTribLevel = getNextTribulationLevel(level);
      if (!nextTribLevel || level < nextTribLevel) {
        result = { success: false, message: '当前无需渡劫' };
        return prev;
      }
      
      const tribulationState = startTribulation(level, stats);
      
      if (!tribulationState.inProgress || !tribulationState.config) {
        result = { success: false, message: '渡劫配置错误' };
        return prev;
      }
      
      let currentState = tribulationState;
      const logs: string[] = [];
      
      for (let phase = 0; phase < currentState.totalPhases; phase++) {
        const phaseResult = executeTribulationPhase(currentState, stats);
        logs.push(phaseResult.message);
        currentState = phaseResult.state;
        
        if (!phaseResult.success && phase === currentState.totalPhases - 1) {
          const penalty = calculateTribulationPenalty(currentState);
          
          const newHp = Math.max(1, Math.floor(prev.protagonist.maxHp * (1 - penalty.hpLoss)));
          const newGrowth = { ...stats.growth };
          for (const [stat, loss] of Object.entries(penalty.statLoss)) {
            const key = stat as keyof GrowthStats;
            if (key in newGrowth) {
              newGrowth[key] = Math.max(0, (newGrowth[key] || 0) - (loss as number));
            }
          }
          
          result = { success: false, message: `渡劫失败！${logs.join('\n')}` };
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              currentHp: newHp,
              stats: { base: stats.base, growth: newGrowth },
            },
            messages: addMessageInternal(prev.messages, 'failure', '渡劫失败', result.message),
          };
        }
        
        if (currentState.currentPhase >= currentState.totalPhases) {
          const reward = calculateTribulationReward(currentState);
          
          const newGrowth = { ...stats.growth };
          for (const [stat, bonus] of Object.entries(reward.stats)) {
            const key = stat as keyof GrowthStats;
            if (key in newGrowth) {
              newGrowth[key] = (newGrowth[key] || 0) + (bonus as number);
            }
          }
          
          result = { success: true, message: `渡劫成功！${reward.specialEffect || ''}${reward.title ? ` 获得「${reward.title}」称号` : ''}` };
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              stats: { base: stats.base, growth: newGrowth },
            },
            messages: addMessageInternal(prev.messages, 'success', '渡劫成功', result.message),
          };
        }
      }
      
      result = { success: false, message: '渡劫过程异常' };
      return prev;
    });
    
    return result;
  }, [setGameState, addMessageInternal]);

  // 恢复体力
  const recoverStamina = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const now = Date.now();
      const lastRecover = prev.protagonist.lastStaminaRecover ?? now;
      const maxStamina = prev.protagonist.maxStamina ?? 100;
      const currentStamina = prev.protagonist.stamina ?? 100;
      
      if (currentStamina >= maxStamina) {
        return { ...prev, protagonist: { ...prev.protagonist, lastStaminaRecover: now } };
      }
      
      const RECOVERY_INTERVAL = 5 * 60 * 1000;
      const timePassed = now - lastRecover;
      const staminaToRecover = Math.floor(timePassed / RECOVERY_INTERVAL);
      
      if (staminaToRecover > 0) {
        const newStamina = Math.min(maxStamina, currentStamina + staminaToRecover);
        return { ...prev, protagonist: { ...prev.protagonist, stamina: newStamina, lastStaminaRecover: now } };
      }
      
      return prev;
    });
  }, [setGameState]);

  // 清除离线收益结果
  const clearOfflineResult = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.offlineResult) return prev;
      return { ...prev, offlineOfflineResult: null };
    });
  }, [setGameState]);

  // 挑战天道
  const challengeGuardian = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const { canChallenge, reasons } = checkAscensionRequirements(prev.protagonist);
      if (!canChallenge) {
        return { ...prev, messages: addMessageInternal(prev.messages, 'warning', '无法挑战', reasons.join('；')) };
      }
      
      return {
        ...prev,
        ascensionFlow: {
          ...DEFAULT_ASCENSION_FLOW_STATE,
          ...prev.ascensionFlow,
          phase: 'battle',
          discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
        },
        protagonist: {
          ...prev.protagonist,
          guardianBattle: {
            ...DEFAULT_GUARDIAN_BATTLE_STATE,
            cooldownUntil: prev.protagonist.guardianBattle?.cooldownUntil ?? null,
            consecutiveFailures: prev.protagonist.guardianBattle?.consecutiveFailures ?? 0,
          },
        },
      };
    });
  }, [setGameState, addMessageInternal]);

  // 守卫战斗结束
  const onAscensionBattleEnd = useCallback((result: {
    victory: boolean;
    turnsUsed: number;
    remainingHpPercent: number;
    phasesCleared: number;
  }) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const ascensionCount = prev.protagonist.ascensionMark?.count ?? 0;
      const battleResult = calculateBattleReward(
        result.victory,
        result.turnsUsed,
        result.remainingHpPercent,
        result.phasesCleared,
        ascensionCount
      );
      
      if (!result.victory) {
        const penalty = battleResult.penalty!;
        
        let newMentalState = prev.protagonist.mentalState || DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        if (penalty.mentalDrop > 0) {
          newMentalState = {
            ...newMentalState,
            stability: Math.max(0, newMentalState.stability - penalty.mentalDrop),
            demonChance: Math.min(100, newMentalState.demonChance + penalty.demonChanceAdd),
            lastChangeTime: Date.now(),
          };
        }
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentHp: Math.max(1, Math.floor(prev.protagonist.maxHp * (1 - penalty.hpLoss))),
            currentMp: Math.max(0, Math.floor(prev.protagonist.maxMp * (1 - penalty.mpLoss))),
            mentalState: newMentalState,
            guardianBattle: {
              ...DEFAULT_GUARDIAN_BATTLE_STATE,
              cooldownUntil: Date.now() + penalty.cooldownHours * 60 * 60 * 1000,
              consecutiveFailures: (prev.protagonist.guardianBattle?.consecutiveFailures ?? 0) + 1,
            },
          },
          ascensionFlow: DEFAULT_ASCENSION_FLOW_STATE,
          messages: addMessageInternal(
            prev.messages,
            'failure',
            '飞升失败',
            '你被天道击败了...需要恢复后再次挑战',
            `HP损失 ${Math.floor(penalty.hpLoss * 100)}%，冷却 ${penalty.cooldownHours} 小时`
          ),
        };
      }
      
      const newWorld = generateNewWorld(ascensionCount, prev.protagonist.world.type);
      
      return {
        ...prev,
        ascensionFlow: {
          ...DEFAULT_ASCENSION_FLOW_STATE,
          phase: 'inheritance',
          battleResult: {
            success: true,
            victory: true,
            turnsUsed: result.turnsUsed,
            remainingHpPercent: result.remainingHpPercent,
            phasesCleared: result.phasesCleared,
            reward: battleResult.reward,
          },
          newWorld,
          discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
        },
        messages: addMessageInternal(
          prev.messages,
          'success',
          '挑战成功！',
          '你击败了天道！准备飞升...',
          `战斗回合: ${result.turnsUsed}, 剩余HP: ${(result.remainingHpPercent * 100).toFixed(1)}%`
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  // 确认传承选择
  const onInheritanceConfirm = useCallback((choice: InheritanceChoice) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const ascensionFlow = prev.ascensionFlow;
      if (!ascensionFlow || ascensionFlow.phase !== 'inheritance') {
        console.error('[onInheritanceConfirm] Invalid ascensionFlow state');
        return prev;
      }
      
      const newWorld = ascensionFlow.newWorld;
      if (!newWorld) {
        console.error('[onInheritanceConfirm] No newWorld in ascensionFlow');
        return prev;
      }
      
      const ascensionCount = prev.protagonist.ascensionMark?.count ?? 0;
      const inheritance = calculateInheritance(prev.protagonist, choice, ascensionCount);
      
      return {
        ...prev,
        ascensionFlow: {
          ...ascensionFlow,
          phase: 'world_reveal',
          inheritanceChoice: choice,
          inheritance,
        },
        messages: addMessageInternal(
          prev.messages,
          'info',
          '传承选择',
          '已选择传承物品，准备前往新世界...'
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  // 跳过传承
  const onInheritanceSkip = useCallback(() => {
    onInheritanceConfirm({
      techniqueId: null,
      equipmentId: null,
      spiritStonesPercent: 0,
    });
  }, [onInheritanceConfirm]);

  // 确认前往新世界
  const onWorldConfirm = useCallback((externalNewWorld?: NewWorldInfo) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const ascensionFlow = prev.ascensionFlow;
      if (!ascensionFlow || ascensionFlow.phase !== 'world_reveal') {
        console.error('[onWorldConfirm] Invalid ascensionFlow state:', ascensionFlow?.phase);
        return prev;
      }
      
      const newWorld = externalNewWorld || ascensionFlow.newWorld;
      if (!newWorld) {
        console.error('[onWorldConfirm] No newWorld available');
        return prev;
      }
      
      const inheritance = ascensionFlow.inheritanceChoice;
      const oldMark = getOrCreateAscensionMark(prev.protagonist);
      const newMark = updateAscensionMark(oldMark, ascensionFlow.battleResult?.reward?.statBonus || {});
      
      const newWorldObj: World = {
        ...prev.protagonist.world,
        id: Date.now(),
        name: newWorld.name,
        type: newWorld.type,
        description: newWorld.description,
      };
      
      const baseStats = { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 };
      const baseGrowthStats = { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 };
      const newStats: CharacterStats = {
        base: {
          体质: baseStats.体质 + (newMark.totalStatBonus.体质 || 0),
          灵根: baseStats.灵根 + (newMark.totalStatBonus.灵根 || 0),
          悟性: baseStats.悟性 + (newMark.totalStatBonus.悟性 || 0),
          幸运: baseStats.幸运 + (newMark.totalStatBonus.幸运 || 0),
          意志: baseStats.意志 + (newMark.totalStatBonus.意志 || 0),
        },
        growth: baseGrowthStats,
      };
      
      const newMaxHp = calculatePlayerMaxHp(newStats.base.体质, 1, newWorld.type);
      const newMaxMp = calculatePlayerMaxMp(newStats.base.灵根, 1, newWorld.type);
      
      const currentSpiritStones = prev.protagonist.inventory.find(
        item => item.definition.id === 'spirit_stone'
      )?.quantity ?? 0;
      const carriedStones = Math.floor(currentSpiritStones * (inheritance?.spiritStonesPercent || 0));
      
      const newInventory: InventoryItem[] = [];
      if (carriedStones > 0) {
        const spiritStoneDef = prev.protagonist.inventory.find(
          item => item.definition.id === 'spirit_stone'
        )?.definition;
        if (spiritStoneDef) {
          newInventory.push(createInventoryItem(spiritStoneDef, carriedStones));
        }
      }
      
      const discoveredWorld: DiscoveredWorld = {
        id: `world_${Date.now()}`,
        info: newWorld,
        discoveredAt: Date.now(),
        visited: true,
        ascensionCount: newMark.count,
      };
      
      const existingWorlds = ascensionFlow.discoveredWorlds || [];
      const updatedDiscoveredWorlds = [...existingWorlds, discoveredWorld];
      
      const inheritedTechniques = inheritance?.techniqueId 
        ? prev.protagonist.techniques.filter((t: Technique) => t.id === inheritance.techniqueId)
        : [];
      const inheritedEquipments = inheritance?.equipmentId
        ? prev.protagonist.equipments.filter((e: Equipment) => e.id === inheritance.equipmentId)
        : [];
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          world: newWorldObj,
          level: 1,
          experience: 0,
          stats: newStats,
          currentHp: newMaxHp,
          maxHp: newMaxHp,
          currentMp: newMaxMp,
          maxMp: newMaxMp,
          inventory: newInventory,
          techniques: inheritedTechniques,
          equipments: inheritedEquipments,
          equippedMelee: inheritedEquipments.find((e: Equipment) => e.slot === 'melee') || null,
          equippedRanged: inheritedEquipments.find((e: Equipment) => e.slot === 'ranged') || null,
          equippedHead: inheritedEquipments.find((e: Equipment) => e.slot === 'head') || null,
          equippedBody: inheritedEquipments.find((e: Equipment) => e.slot === 'body') || null,
          equippedLegs: inheritedEquipments.find((e: Equipment) => e.slot === 'legs') || null,
          equippedFeet: inheritedEquipments.find((e: Equipment) => e.slot === 'feet') || null,
          equippedAttackTechniques: [inheritedTechniques.find((t: Technique) => t.type === 'attack') || null, null, null],
          equippedDefenseTechniques: [inheritedTechniques.find((t: Technique) => t.type === 'defense') || null, null, null],
          ascensionMark: newMark,
          guardianBattle: undefined,
          cultivationPath: undefined,
          pathLevel: 1,
          pathExp: 0,
        },
        ascensionFlow: DEFAULT_ASCENSION_FLOW_STATE,
        messages: addMessageInternal(
          prev.messages,
          'success',
          '飞升成功！',
          `你成功飞升到了${newWorld.name}！`
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  // 重新随机世界
  const onWorldReroll = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const ascensionFlow = prev.ascensionFlow;
      if (!ascensionFlow || ascensionFlow.phase !== 'world_reveal') {
        console.error('[onWorldReroll] Invalid ascensionFlow state:', ascensionFlow?.phase);
        return prev;
      }
      
      const ascensionCount = prev.protagonist.ascensionMark?.count ?? 0;
      const newWorld = generateNewWorld(ascensionCount, prev.protagonist.world.type);
      
      return {
        ...prev,
        ascensionFlow: {
          ...ascensionFlow,
          newWorld,
        },
        messages: addMessageInternal(prev.messages, 'info', '重新随机', `新的世界：${newWorld.name}`),
      };
    });
  }, [setGameState, addMessageInternal]);

  return {
    handleTribulation,
    recoverStamina,
    clearOfflineResult,
    challengeGuardian,
    onAscensionBattleEnd,
    onInheritanceConfirm,
    onInheritanceSkip,
    onWorldConfirm,
    onWorldReroll,
  };
}
