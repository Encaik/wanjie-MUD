/**
 * useSaveLoad — 存档领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露导入/导出/重置游戏 action。
 */

'use client';

import { useCallback } from 'react';

import { createLogger } from '@/core/logger';

import { useGameStore } from '../GameStore';
import { createInitialGameState } from '../initialState';

const log = createLogger('SaveLoad');

export function useSaveLoad() {
  const { gameState, dispatch } = useGameStore();

  // 导出存档
  const exportSave = useCallback(() => {
    return JSON.stringify(gameState);
  }, [gameState]);

  // 导入存档
  const importSave = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      dispatch(() => imported);
    } catch (e) {
      log.error('Failed to import save:', e);
    }
  }, [dispatch]);

  // 重置游戏
  const resetGame = useCallback(() => {
    dispatch(() => createInitialGameState());
    localStorage.removeItem('gameState');
    localStorage.removeItem('shop_daily_sale');
    localStorage.removeItem('shop_favorites');
    localStorage.removeItem('shop_persist_data');
    localStorage.removeItem('shop_level_data');
    localStorage.removeItem('shop_task_state');
  }, [dispatch]);

  return { exportSave, importSave, resetGame };
}
