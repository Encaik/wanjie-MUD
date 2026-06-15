/**
 * useAdventure — 机缘探索领域 Hook
 *
 * 从 GameStore 自取状态，调用 useGameAdventure 模块 Hook，
 * 对外暴露开始/移动/退出机缘、扫荡、历练事件等 action。
 */

'use client';

import { useCallback } from 'react';

import type { MessageRecord } from '@/core/types';
import { useGameAdventure } from '@/modules/exploration/hooks/useAdventure';

import { useGameStore } from '../state/GameStore';

export function useAdventure() {
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

  const adventureHook = useGameAdventure({
    gameState,
    setGameState,
    addMessageInternal,
  });

  return {
    startExperience: adventureHook.startExperience,
    handleEventChoice: adventureHook.handleEventChoice,
    startAdventure: adventureHook.startAdventure,
    quickSweep: adventureHook.quickSweep,
    moveInAdventure: adventureHook.moveInAdventure,
    exitAdventure: adventureHook.exitAdventure,
    clearLastResult: adventureHook.clearLastResult,
    handleBattleEnd: adventureHook.handleBattleEnd,
    toggleAutoBattle: adventureHook.toggleAutoBattle,
    getAvailableDifficulties: adventureHook.getDifficulties,
  };
}
