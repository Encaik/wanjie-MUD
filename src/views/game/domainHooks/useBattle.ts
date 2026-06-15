/**
 * useBattle — 战斗/试炼领域 Hook
 *
 * 从 GameStore 自取状态，对外暴露爬塔挑战 action。
 * 交互式战斗由 useGameAdventure 模块 Hook 处理（handleBattleEnd, toggleAutoBattle）。
 */

'use client';

import { useCallback } from 'react';

import type { ActiveBattleState } from '@/core/types';
import { createDefaultTowerProgress } from '@/modules/tower/logic/types';
import type { TowerEnemy } from '@/modules/tower/logic/types';

import { useGameStore } from '../GameStore';
import { createAddMessageInternal } from './helpers';

export function useBattle() {
  const { dispatch } = useGameStore();
  const addMsgInt = createAddMessageInternal();

  // 挑战爬塔
  const challengeTower = useCallback((floor: number, enemy: TowerEnemy) => {
    dispatch(prev => {
      if (!prev.protagonist) return prev;
      const towerProgress = prev.protagonist.towerProgress ?? createDefaultTowerProgress();
      const nextFloor = towerProgress.maxClearedFloor + 1;
      if (floor !== nextFloor) {
        return {
          ...prev,
          messages: addMsgInt(prev.messages, 'warning', '无法挑战', `只能按顺序挑战第${nextFloor}层`),
        };
      }
      const activeBattle: ActiveBattleState = {
        cellType: 'enemy',
        enemyName: enemy.name,
        enemyLevel: enemy.level,
        cellPosition: { row: 0, col: floor },
        isActive: true,
        source: 'tower',
        towerFloor: floor,
        towerEnemy: enemy,
      };
      return {
        ...prev,
        activeBattle,
        messages: addMsgInt(prev.messages, 'info', '试炼挑战', `开始挑战第${floor}层 - ${enemy.name}(Lv.${enemy.level})！`),
      };
    });
  }, [dispatch]);

  return { challengeTower };
}
