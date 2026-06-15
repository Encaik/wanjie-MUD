/**
 * useGameActions — 杂项游戏 action Hook
 *
 * 对外暴露清除弹窗、死亡状态等 action。
 */

'use client';

import { useCallback } from 'react';

import { useGameStore, useGameDispatch } from '../GameStore';

export function useGameActions() {
  const dispatch = useGameDispatch();

  const clearNoviceCompletionDialog = useCallback(() => {
    dispatch(prev => ({ ...prev, showNoviceCompletionDialog: false }));
  }, [dispatch]);

  const clearTutorialCompletionDialog = useCallback(() => {
    dispatch(prev => ({ ...prev, showTutorialCompletionDialog: false }));
  }, [dispatch]);

  const clearDeathState = useCallback(() => {
    dispatch(prev => {
      if (!prev.deathState?.isDead) return prev;
      const recoveryHp = prev.deathState.recoveryHp || Math.floor((prev.protagonist?.maxHp || 100) * 0.3);
      return {
        ...prev,
        deathState: undefined,
        protagonist: prev.protagonist ? { ...prev.protagonist, currentHp: recoveryHp } : null,
      };
    });
  }, [dispatch]);

  const clearOfflineResult = useCallback(() => {
    // 新系统中离线结果内嵌于登录流程，保留兼容签名
  }, []);

  const applyOfflineRewards = useCallback(() => {
    // 新系统中离线奖励自动应用，保留兼容签名
  }, []);

  return { clearNoviceCompletionDialog, clearTutorialCompletionDialog, clearDeathState, clearOfflineResult, applyOfflineRewards };
}
