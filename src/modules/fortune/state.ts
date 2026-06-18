/**
 * modules/fortune/state.ts — 机缘状态 Slice
 *
 * 定义 fortuneSlice 的初始状态和不可变更新函数。
 * 所有更新函数返回新的 slice 对象（不可变更新模式）。
 */

import type { FortuneSlice, FortuneSession } from './types';

// ============================================
// 初始状态
// ============================================

/** 机缘 Slice 初始状态 */
export const INITIAL_FORTUNE_SLICE: FortuneSlice = {
  session: null,
  phase: 'hub',
  lastNodeResult: null,
  floorTransition: null,
  settlement: null,
  pendingBattle: null,
};

// ============================================
// 更新函数
// ============================================

/**
 * 设置探索会话（开始新机缘）
 */
export function setFortuneSession(session: FortuneSession): Partial<FortuneSlice> {
  return {
    session,
    phase: 'exploring',
    lastNodeResult: null,
    floorTransition: null,
    settlement: null,
  };
}

/**
 * 更新玩家位置
 */
export function updatePlayerPosition(
  slice: FortuneSlice,
  row: number,
  col: number
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  return {
    session: {
      ...slice.session,
      playerPosition: { row, col },
    },
  };
}

/**
 * 更新节点处理结果
 */
export function setNodeResult(
  slice: FortuneSlice,
  result: typeof slice.lastNodeResult
): Partial<FortuneSlice> {
  return { lastNodeResult: result };
}

/**
 * 更新体力
 */
export function updateStamina(
  slice: FortuneSlice,
  newStamina: number
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  return {
    session: {
      ...slice.session,
      stamina: Math.max(0, Math.min(newStamina, slice.session.maxStamina)),
    },
  };
}

/**
 * 标记节点清理
 */
export function markNodeCleared(
  slice: FortuneSlice,
  row: number,
  col: number
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  const grid = slice.session.currentMap.grid;
  const cell = grid[row]?.[col];
  if (!cell?.node) return {};

  const newGrid = grid.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { ...c, isVisited: true, node: c.node ? { ...c.node, isCleared: true } : null }
        : c
    )
  );

  return {
    session: {
      ...slice.session,
      currentMap: {
        ...slice.session.currentMap,
        grid: newGrid,
      },
      nodesVisited: slice.session.nodesVisited + 1,
    },
  };
}

/**
 * 揭示格子（进入视野）
 */
export function revealCells(
  slice: FortuneSlice,
  positions: Array<{ row: number; col: number }>
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  const grid = slice.session.currentMap.grid;
  const newGrid = grid.map((r, ri) =>
    r.map((c, ci) => {
      const isRevealed = positions.some(p => p.row === ri && p.col === ci);
      return isRevealed ? { ...c, isRevealed: true } : c;
    })
  );

  return {
    session: {
      ...slice.session,
      currentMap: {
        ...slice.session.currentMap,
        grid: newGrid,
      },
    },
  };
}

/**
 * 累加收获
 */
export function accumulateLoot(
  slice: FortuneSlice,
  loot: Partial<FortuneSlice['session'] extends infer S ? S extends FortuneSession ? FortuneSession['accumulatedLoot'] : never : never>
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  const prev = slice.session.accumulatedLoot;
  return {
    session: {
      ...slice.session,
      accumulatedLoot: {
        spiritStones: prev.spiritStones + (loot.spiritStones || 0),
        items: [...prev.items, ...(loot.items || [])],
        fragments: [...prev.fragments, ...(loot.fragments || [])],
        experience: prev.experience + (loot.experience || 0),
      },
    },
  };
}

/**
 * 进入楼层过渡阶段
 */
export function enterFloorTransition(
  slice: FortuneSlice,
  transition: NonNullable<FortuneSlice['floorTransition']>
): Partial<FortuneSlice> {
  return {
    phase: 'floor_transition',
    floorTransition: transition,
  };
}

/**
 * 继续下一层
 */
export function continueToNextFloor(
  slice: FortuneSlice,
  newMap: FortuneSession['currentMap']
): Partial<FortuneSlice> {
  if (!slice.session) return {};
  return {
    session: {
      ...slice.session,
      currentDepth: slice.session.currentDepth + 1,
      currentMap: newMap,
      playerPosition: newMap.playerStart,
      depthLoots: [...slice.session.depthLoots, { ...slice.session.accumulatedLoot }],
    },
    phase: 'exploring',
    floorTransition: null,
  };
}

/**
 * 撤退 — 结束机缘
 */
export function retreatFortune(
  _slice: FortuneSlice,
  settlement: NonNullable<FortuneSlice['settlement']>
): Partial<FortuneSlice> {
  return {
    session: null,
    phase: 'result',
    floorTransition: null,
    settlement,
    lastNodeResult: null,
  };
}

/**
 * 设置待处理战斗
 */
export function setPendingBattle(
  battle: NonNullable<FortuneSlice['pendingBattle']>
): Partial<FortuneSlice> {
  return { pendingBattle: battle, lastNodeResult: null };
}

/**
 * 清除待处理战斗
 */
export function clearPendingBattle(): Partial<FortuneSlice> {
  return { pendingBattle: null };
}

/**
 * 回到大厅
 */
export function returnToHub(): Partial<FortuneSlice> {
  return {
    ...INITIAL_FORTUNE_SLICE,
  };
}
