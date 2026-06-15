/**
 * useFaction — 势力领域 Hook
 *
 * 从 GameStore 自取状态，调用 useGameFaction 模块 Hook，
 * 对外暴露加入/离开势力、任务、捐献、晋升等 action。
 */

'use client';

import { useCallback } from 'react';

import type { MessageRecord } from '@/core/types';
import { addToInventory } from '@/modules/equipment/hooks/inventoryUtils';
import { useGameFaction } from '@/modules/faction/hooks/useFaction';

import { useGameStore } from '../GameStore';


export function useFaction() {
  const { gameState, dispatch: setGameState } = useGameStore();

  const addMessageInternal = useCallback((
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards'],
  ): MessageRecord[] => {
    const newMessage: MessageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      title,
      content,
      details,
      rewards,
    };
    return [newMessage, ...messages].slice(0, 100);
  }, []);

  const factionHook = useGameFaction({
    setGameState,
    addMessageInternal,
    addToInventory,
  });

  return {
    joinFaction: factionHook.joinFaction,
    leaveFaction: factionHook.leaveFaction,
    claimAchievementReward: factionHook.claimAchievementReward,
    selectCultivationPath: factionHook.handleSelectCultivationPath,
    claimTaskReward: factionHook.handleClaimTaskReward,
    claimDailySalary: factionHook.handleClaimDailySalary,
    acceptTask: factionHook.acceptTask,
    submitTask: factionHook.submitTask,
    refreshTasks: factionHook.checkAndResetRounds,
    donate: factionHook.handleDonate,
    promoteRank: factionHook.handlePromoteRank,
  };
}
