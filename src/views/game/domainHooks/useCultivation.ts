/**
 * useCultivation — 修炼领域 Hook
 *
 * 从 GameStore 自取状态，调用 useGameCultivation 模块 Hook，
 * 对外暴露修炼、休养、自动修炼、闭关等 action。
 */

'use client';

import { useCallback } from 'react';

import type { ActionTab, ActiveEffect, GameState, MessageRecord } from '@/core/types';
import { useGameCultivation } from '@/modules/progression/hooks/useCultivation';
import { useSeclusion } from '@/modules/progression/hooks/useSeclusion';
import type { SeclusionType } from '@/modules/progression/logic/seclusion';

import { useGameStore } from '../state/GameStore';

export function useCultivation() {
  // 从 GameStore 获取 gameState 和 dispatch（类型兼容 React.Dispatch<SetStateAction<GameState>>）
  const { gameState, dispatch: setGameState } = useGameStore();

  // 活跃效果更新辅助函数
  const updateActiveEffects = useCallback((effects: ActiveEffect[]): ActiveEffect[] => {
    return effects
      .map(effect => {
        if (effect.type === 'cultivation_boost' || effect.type === 'breakthrough_boost') {
          return { ...effect, remainingCount: effect.remainingCount - 1 };
        }
        return effect;
      })
      .filter(effect => effect.remainingCount > 0);
  }, []);

  // 消息内部添加函数
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

  const cultivationHook = useGameCultivation({
    gameState,
    setGameState,
    addMessageInternal,
    updateActiveEffects,
  });

  const seclusionHook = useSeclusion({
    gameState,
    setGameState,
    addMessageInternal,
    updateActiveEffects,
  });

  return {
    performCultivation: cultivationHook.performCultivation,
    performRest: cultivationHook.performRest,
    toggleAutoCultivation: cultivationHook.toggleAutoCultivation,
    performSeclusion: seclusionHook.performSeclusion,
    autoCultivating: gameState.autoCultivating,
  };
}
