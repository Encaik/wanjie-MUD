/**
 * useAscension — 飞升/渡劫领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露渡劫、挑战守卫、飞升流程各阶段 action。
 * 飞升流程状态机由本 Hook 管理。
 */

'use client';

import { useCallback } from 'react';

import { DEFAULT_ASCENSION_FLOW_STATE } from '@/core/types';
import type { InheritanceChoice, NewWorldInfo } from '@/core/types';

import { useGameStore } from '../state/GameStore';
import { createAddMessageInternal } from './helpers';

export function useAscension() {
  const { dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  // 渡劫
  const performTribulation = useCallback(() => {
    dispatch(prev => ({
      ...prev,
      messages: addMsgInt(prev.messages, 'info', '渡劫', '准备渡劫...'),
    }));
  }, [dispatch]);

  // 挑战天道守卫
  const challengeGuardian = useCallback(() => {
    dispatch(prev => ({
      ...prev,
      ascensionFlow: { ...DEFAULT_ASCENSION_FLOW_STATE, phase: 'battle' as const },
    }));
  }, [dispatch]);

  // 守卫战斗结束
  const onAscensionBattleEnd = useCallback((result: { victory: boolean; turnsUsed: number; remainingHpPercent: number; phasesCleared: number }) => {
    dispatch(prev => ({
      ...prev,
      ascensionFlow: {
        ...(prev.ascensionFlow || DEFAULT_ASCENSION_FLOW_STATE),
        phase: result.victory ? 'inheritance' : 'complete',
        discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
      },
    }));
  }, [dispatch]);

  // 确认传承
  const onInheritanceConfirm = useCallback((choice: InheritanceChoice) => {
    dispatch(prev => ({
      ...prev,
      ascensionFlow: {
        ...(prev.ascensionFlow || DEFAULT_ASCENSION_FLOW_STATE),
        phase: 'world_reveal' as const,
        inheritanceChoice: choice,
        discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
      },
    }));
  }, [dispatch]);

  // 跳过传承
  const onInheritanceSkip = useCallback(() => {
    onInheritanceConfirm({ techniqueId: null, equipmentId: null, spiritStonesPercent: 0 });
  }, [onInheritanceConfirm]);

  // 确认新世界
  const onWorldConfirm = useCallback((_newWorld?: NewWorldInfo) => {
    dispatch(prev => ({ ...prev, ascensionFlow: DEFAULT_ASCENSION_FLOW_STATE }));
  }, [dispatch]);

  // 重新随机世界
  const onWorldReroll = useCallback(() => {
    // 后续对接世界重新生成 API
  }, []);

  return { performTribulation, challengeGuardian, onAscensionBattleEnd, onInheritanceConfirm, onInheritanceSkip, onWorldConfirm, onWorldReroll };
}
