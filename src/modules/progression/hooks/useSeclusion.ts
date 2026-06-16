// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * 闭关修炼 Hook
 * 管理闭关修炼的状态和操作
 */

'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { CULTIVATION_PATHS } from '@/modules/progression/data/cultivationPathData';
import { getMaxExperience, getMaxLevel } from '@/modules/progression/logic/cultivation';
import { applyMentalChange, updateTaskProgress } from '@/core/engine';
import { processExperienceGain, calculateBreakthroughTransfer } from '@/modules/progression/logic/experienceSystem';
import { gameSystems } from '@/core/engine';
import { getRealmName } from '@/modules/progression/data/realmCore';
import { applyGrowthStatChanges } from '@/modules/progression/logic/realmSystem';
import {
  SeclusionType,
  SeclusionOutcome,
  executeSeclusion,
  getSeclusionCost,
  isSeclusionUnlocked,
  getUnlockedSeclusions,
  getOutcomeColor,
  getOutcomeBgColor,
  SECLUSION_CONFIGS,
  SECLUSION_OUTCOMES,
} from '@/modules/progression/logic/seclusion';
import { gameClock, ACTION_TIME_COST } from '@/core/time';
import { processStatisticsEvents } from '@/core/statistics';
import { GameState, MessageRecord, ActiveEffect } from '@/core/types';
import { DEFAULT_PROTAGONIST_EXTENSION, MentalState } from '@/core/types';

// TODO: 统一物品系统迁移 — 暂代
function removeFromInventory(inventory: Record<string, unknown>[], itemId: string, quantity: number): Record<string, unknown>[] {
  const idx = inventory.findIndex((i: Record<string, unknown>) => (i as { definition?: { id?: string } }).definition?.id === itemId);
  if (idx < 0) return inventory;
  const item = inventory[idx] as { quantity: number };
  if (item.quantity <= quantity) return inventory.filter((_, i: number) => i !== idx);
  return inventory.map((i: Record<string, unknown>, ix: number) => ix === idx ? { ...i, quantity: item.quantity - quantity } : i);
}



export interface UseSeclusionProps {
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

export interface UseSeclusionReturn {
  performSeclusion: (type: SeclusionType) => void;
  isSeclusionUnlocked: (type: SeclusionType) => boolean;
  getUnlockedSeclusions: () => { type: SeclusionType; name: string; multiplier: number; cost: number; unlockLevel: number; description: string }[];
  getSeclusionCost: (type: SeclusionType) => number;
  getOutcomeInfo: (outcome: SeclusionOutcome) => { name: string; description: string; color: string; bgColor: string };
}

/**
 * 闭关修炼 Hook
 */
export function useSeclusion({
  gameState,
  setGameState,
  addMessageInternal,
  updateActiveEffects,
}: UseSeclusionProps): UseSeclusionReturn {
  
  // 执行闭关
  const performSeclusion = useCallback((type: SeclusionType) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const result = executeSeclusion(prev.protagonist, type);
      
      // 无法负担或等级不足
      if (!result.canAfford || !result.success) {
        return {
          ...prev,
          lastActionResult: {
            success: false,
            message: result.message,
            statChanges: {},
          },
          messages: addMessageInternal(
            prev.messages,
            'warning',
            '闭关失败',
            result.message
          ),
        };
      }
      
      // 处理结果
      let newInventory = [...(prev.protagonist.inventory || [])];
      let newStats = prev.protagonist.stats;
      let newLevel = prev.protagonist.level;
      let newRealm = prev.protagonist.realm;
      let newExp = prev.protagonist.experience;
      let newOverflowExp = prev.protagonist.overflowExperience;
      
      // 扣除消耗
      if (result.itemsCost) {
        for (const cost of result.itemsCost) {
          newInventory = removeFromInventory(newInventory, cost.definition.id, cost.quantity);
        }
      }
      
      // 更新经验和等级
      if (result.breakthroughSuccess && result.newLevel) {
        newLevel = result.newLevel;
        newRealm = result.newRealm || getRealmName(prev.protagonist.world.realmSystem, newLevel);
        const nextMaxExp = getMaxExperience(newLevel);
        newExp = calculateBreakthroughTransfer(newOverflowExp, nextMaxExp);
        newOverflowExp = 0;
        
        // 突破成功时增加可成长属性
        const growthGain = Math.floor(Math.random() * 8) + 3; // 3~10点
        const growthStats = {
          体质: growthGain,
          灵根: growthGain,
          悟性: growthGain,
          幸运: growthGain,
          意志: growthGain,
        };
        
        // 应用属性增长
        const growthCap = newLevel * 2;
        newStats = {
          base: { ...newStats.base },
          growth: {
            体质: Math.min(newStats.growth.体质 + growthStats.体质, growthCap),
            灵根: Math.min(newStats.growth.灵根 + growthStats.灵根, growthCap),
            悟性: Math.min(newStats.growth.悟性 + growthStats.悟性, growthCap),
            幸运: Math.min(newStats.growth.幸运 + growthStats.幸运, growthCap),
            意志: Math.min(newStats.growth.意志 + growthStats.意志, growthCap),
          },
        };
      } else {
        const maxExp = getMaxExperience(newLevel);
        const expResult = processExperienceGain(newExp, result.experienceGain, maxExp, newOverflowExp);
        newExp = expResult.newExp;
        newOverflowExp = expResult.newOverflow;
      }
      
      // 更新效果
      const newActiveEffects = result.success
        ? updateActiveEffects(prev.protagonist.activeEffects)
        : prev.protagonist.activeEffects;
      
      // 心理状态变化
      let newMentalStateForReturn: MentalState | undefined;
      let mentalChangeMessage: string = '';
      
      if (result.success) {
        const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        let mentalChangeType: string;
        
        if (result.outcome === 'harmony') {
          mentalChangeType = 'seclusion_harmony';
        } else if (result.outcome === 'enlightenment') {
          mentalChangeType = 'seclusion_enlightenment';
        } else if (result.outcome === 'deviation') {
          mentalChangeType = 'seclusion_deviation';
        } else if (result.breakthroughSuccess) {
          mentalChangeType = 'breakthrough_success';
        } else {
          mentalChangeType = 'seclusion_normal';
        }
        
        const { newState: newMentalState, message: mentalMsg } = applyMentalChange(
          currentMentalState,
          mentalChangeType as any
        );
        newMentalStateForReturn = newMentalState;
        mentalChangeMessage = mentalMsg;
      }
      
      // 构建奖励信息
      const rewards: MessageRecord['rewards'] = {
        experience: result.experienceGain,
      };
      
      if (result.breakthroughSuccess) {
        rewards.experience = newExp;
      }
      
      // 统计信息
      const now = Date.now();
      const statsEvents = [
        { type: 'cultivation:performed' as const, payload: { count: 1 }, timestamp: now },
      ];
      if (result.breakthroughSuccess) {
        statsEvents.push({ type: 'cultivation:breakthrough' as const, payload: { count: 1 }, timestamp: now });
      }
      if (newLevel > prev.statistics.maxLevel) {
        statsEvents.push({ type: 'player:level_up' as const, payload: { newLevel }, timestamp: now });
      }
      const newStatistics = processStatisticsEvents(prev.statistics, statsEvents);
      
      // 触发游戏系统事件
      gameSystems.triggerCultivationDone(
        {},
        !!result.breakthroughAttempt,
        !!result.breakthroughSuccess
      );
      
      if (newLevel > prev.protagonist.level) {
        gameSystems.triggerLevelUp(prev.protagonist.level, newLevel);
      }
      
      // 更新势力任务进度
      let newFactionProgress = prev.protagonist.factionProgress;
      if (prev.protagonist.factionId && newFactionProgress && result.success) {
        newFactionProgress = updateTaskProgress(
          newFactionProgress,
          'cultivate',
          'any',
          1
        );
      }
      
      // 更新道途经验
      let newPathExp = prev.protagonist.pathExp ?? 0;
      let newPathLevel = prev.protagonist.pathLevel ?? 1;
      const cultivationPath = prev.protagonist.cultivationPath;
      
      if (cultivationPath && result.success) {
        const pathConfig = CULTIVATION_PATHS[cultivationPath];
        const baseExpGain = 5 * result.actualMultiplier;
        const pathExpGain = Math.floor(baseExpGain * (1 + pathConfig.cultivationBonus / 100));
        
        newPathExp += pathExpGain;
        const expNeeded = newPathLevel * 100;
        if (newPathExp >= expNeeded) {
          newPathExp -= expNeeded;
          newPathLevel += 1;
        }
      }
      
      // 消耗游戏时间
      const timeCost = type === 'legendary' ? ACTION_TIME_COST.cultivate * 7 : 
                       type === 'major' ? ACTION_TIME_COST.cultivate * 3 : 
                       ACTION_TIME_COST.cultivate;
      
      const newTime = prev.time ? gameClock.advanceBySeconds(prev.time, timeCost) : prev.time;
      
      // 消息类型
      let messageType: MessageRecord['type'] = 'info';
      let messageTitle = SECLUSION_CONFIGS[type].name;
      
      if (result.breakthroughSuccess) {
        messageType = 'success';
        messageTitle = '境界突破';
      } else if (result.outcome === 'harmony') {
        messageType = 'success';
      } else if (result.outcome === 'deviation') {
        messageType = 'failure';
      }
      
      // 构建详情
      const details = `闭关效果: ${result.outcomeName} | 实际倍数: ${result.actualMultiplier.toFixed(1)}倍 | 消耗: ${result.cost}`;
      
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
          factionProgress: newFactionProgress,
          pathExp: newPathExp,
          pathLevel: newPathLevel,
          ...(newMentalStateForReturn ? { mentalState: newMentalStateForReturn } : {}),
        },
        statistics: newStatistics,
        factionProgress: newFactionProgress,
        time: newTime,
        lastActionResult: {
          success: true,
          message: result.message + (mentalChangeMessage ? ` ${mentalChangeMessage}` : ''),
          statChanges: result.statChanges,
        },
        messages: addMessageInternal(
          prev.messages,
          messageType,
          messageTitle,
          result.message + (mentalChangeMessage ? ` ${mentalChangeMessage}` : ''),
          details,
          rewards
        ),
      };
    });
  }, [setGameState, addMessageInternal, updateActiveEffects]);
  
  // 检查闭关是否解锁
  const checkUnlocked = useCallback((type: SeclusionType) => {
    if (!gameState.protagonist) return false;
    return isSeclusionUnlocked(type, gameState.protagonist.level);
  }, [gameState.protagonist]);
  
  // 获取已解锁的闭关类型
  const getUnlockedList = useCallback(() => {
    if (!gameState.protagonist) return [];
    const configs = getUnlockedSeclusions(gameState.protagonist.level);
    return configs.map(config => ({
      type: config.type,
      name: config.name,
      multiplier: config.multiplier,
      cost: getSeclusionCost(config.type),
      unlockLevel: config.unlockLevel,
      description: config.description,
    }));
  }, [gameState.protagonist]);
  
  // 获取消耗
  const getCost = useCallback((type: SeclusionType) => {
    return getSeclusionCost(type);
  }, []);
  
  // 获取效果信息
  const getOutcomeInfo = useCallback((outcome: SeclusionOutcome) => {
    const outcomeConfig = SECLUSION_OUTCOMES.find(o => o.outcome === outcome);
    return {
      name: outcomeConfig?.name || '未知',
      description: outcomeConfig?.description || '',
      color: getOutcomeColor(outcome),
      bgColor: getOutcomeBgColor(outcome),
    };
  }, []);
  
  return {
    performSeclusion,
    isSeclusionUnlocked: checkUnlocked,
    getUnlockedSeclusions: getUnlockedList,
    getSeclusionCost: getCost,
    getOutcomeInfo,
  };
}
