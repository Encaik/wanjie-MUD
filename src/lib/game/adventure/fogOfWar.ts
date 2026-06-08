/**
 * 迷雾系统与路径提示
 *
 * 纯函数模块：管理探索地图的可见性计算和路径方向提示。
 * 迷雾状态与地图数据分离存储，不污染 AdventureCell 结构。
 */

import type { AdventureCell, CellType } from '../types';
import type { FogCell, FogCellState, PathHint, PathHintType, PathRiskType, RevealedMap, BossWarningState } from './types';
import { PATH_HINT_TEXTS, PATH_CONFIGS, BOSS_WARNING_TEXTS } from './types';
import { getAdjacentCells } from './adventure';

// ============================================
// 迷雾计算
// ============================================

/**
 * 创建初始化的探索状态
 *
 * @param rows - 地图行数
 * @param cols - 地图列数
 * @param startPos - 起始位置（通常是第一行中间）
 * @returns 初始化后的探索状态
 */
export function createRevealedMap(
  rows: number,
  cols: number,
  startPos: { row: number; col: number }
): RevealedMap {
  const revealedCells = new Set<string>();
  // 起始格和四邻可见
  revealedCells.add(`${startPos.row},${startPos.col}`);
  const adjacent = getAdjacentCellsSimple(startPos, rows, cols);
  for (const pos of adjacent) {
    revealedCells.add(`${pos.row},${pos.col}`);
  }
  return {
    revealedCells,
    playerPosition: startPos,
    totalRows: rows,
    totalCols: cols,
  };
}

/** 简易邻接计算（不依赖 AdventureCell 网格） */
function getAdjacentCellsSimple(
  pos: { row: number; col: number },
  rows: number,
  cols: number
): { row: number; col: number }[] {
  const result: { row: number; col: number }[] = [];
  if (pos.row > 0) result.push({ row: pos.row - 1, col: pos.col });
  if (pos.row < rows - 1) result.push({ row: pos.row + 1, col: pos.col });
  if (pos.col > 0) result.push({ row: pos.row, col: pos.col - 1 });
  if (pos.col < cols - 1) result.push({ row: pos.row, col: pos.col + 1 });
  return result;
}

/**
 * 玩家移动后更新探索状态
 *
 * @param map - 当前探索状态
 * @param newPos - 新位置
 * @param grid - 完整地图网格
 * @returns 更新后的探索状态
 */
export function updateRevealedMap(
  map: RevealedMap,
  newPos: { row: number; col: number }
): RevealedMap {
  const revealedCells = new Set(map.revealedCells);
  // 新位置揭示
  revealedCells.add(`${newPos.row},${newPos.col}`);
  // 四邻揭示
  const adjacent = getAdjacentCellsSimple(newPos, map.totalRows, map.totalCols);
  for (const pos of adjacent) {
    revealedCells.add(`${pos.row},${pos.col}`);
  }
  return {
    ...map,
    revealedCells,
    playerPosition: newPos,
  };
}

/**
 * 获取某个格子的迷雾状态
 *
 * @param row - 行
 * @param col - 列
 * @param map - 探索状态
 * @param cell - 该格的实际内容（可能为 undefined 表示未探索）
 * @returns 迷雾状态
 */
export function getFogState(
  row: number,
  col: number,
  map: RevealedMap,
  cell?: AdventureCell
): FogCellState {
  const key = `${row},${col}`;
  const isPlayerPos = map.playerPosition.row === row && map.playerPosition.col === col;

  if (isPlayerPos) return 'visible';
  if (map.revealedCells.has(key)) {
    return cell?.visited ? 'visited' : 'visible';
  }
  return 'hidden';
}

/**
 * 构建当前可见的迷雾单元格列表
 *
 * @param grid - 完整地图网格
 * @param map - 当前探索状态
 * @returns 每个格子的迷雾渲染信息
 */
export function calculateVisibility(
  grid: AdventureCell[][],
  map: RevealedMap
): FogCell[][] {
  return grid.map((row, r) =>
    row.map((cell, c) => {
      const fogState = getFogState(r, c, map, cell);
      return {
        row: r,
        col: c,
        fogState,
        cellType: fogState === 'hidden' ? undefined : cell.type,
        hint: fogState === 'hidden' ? undefined : undefined,
        cleared: cell.cleared,
      };
    })
  );
}

// ============================================
// 路径提示
// ============================================

/**
 * 获取从指定位置出发的各方向模糊提示
 *
 * @param grid - 地图网格
 * @param position - 当前位置
 * @param map - 探索状态
 * @returns 各方向的路径提示（仅对未探索方向）
 */
export function generatePathHints(
  grid: AdventureCell[][],
  position: { row: number; col: number },
  map: RevealedMap
): PathHint[] {
  const hints: PathHint[] = [];
  const adjacent = getAdjacentCellsSimple(position, map.totalRows, map.totalCols);

  for (const pos of adjacent) {
    const key = `${pos.row},${pos.col}`;
    // 已揭示的格子不生成提示
    if (map.revealedCells.has(key)) continue;

    const cell = grid[pos.row]?.[pos.col];
    if (!cell) continue;

    const direction = getDirection(position, pos);
    const pathType = inferPathType(cell);
    const hintType = cellTypeToHintType(cell.type);

    const texts = PATH_HINT_TEXTS[hintType];
    const text = texts[Math.floor(Math.random() * texts.length)];

    hints.push({
      direction,
      targetPosition: pos,
      hintType,
      text,
      pathType,
    });
  }
  return hints;
}

/** 推断格子的路径风险类型 */
function inferPathType(cell: AdventureCell): PathRiskType {
  switch (cell.type) {
    case 'elite':
    case 'miniboss':
    case 'boss':
      return 'high_risk';
    case 'rest':
    case 'treasure':
      return 'safe';
    case 'enemy':
      return 'neutral';
    default:
      return 'unknown';
  }
}

/** 格子类型到提示类型的映射 */
function cellTypeToHintType(cellType: CellType): PathHintType {
  switch (cellType) {
    case 'boss':
      return 'boss';
    case 'elite':
    case 'miniboss':
    case 'enemy':
      return 'danger';
    case 'treasure':
      return 'treasure';
    case 'rest':
      return 'rest';
    case 'event':
      return 'mystery';
    case 'empty':
      return 'safe';
    default:
      return 'mystery';
  }
}

/** 计算方向 */
function getDirection(
  from: { row: number; col: number },
  to: { row: number; col: number }
): 'up' | 'down' | 'left' | 'right' {
  if (to.row < from.row) return 'up';
  if (to.row > from.row) return 'down';
  if (to.col < from.col) return 'left';
  return 'right';
}

// ============================================
// Boss 预警
// ============================================

/**
 * 计算 Boss 预警状态
 *
 * @param bossPos - Boss 位置
 * @param playerPos - 玩家当前位置
 * @returns 预警状态
 */
export function calculateBossWarning(
  bossPos: { row: number; col: number },
  playerPos: { row: number; col: number }
): BossWarningState {
  const distance = Math.abs(bossPos.row - playerPos.row) + Math.abs(bossPos.col - playerPos.col);
  let warningLevel: BossWarningState['warningLevel'];

  if (distance <= 2) {
    warningLevel = 'imminent';
  } else if (distance <= 4) {
    warningLevel = 'near';
  } else if (distance <= 6) {
    warningLevel = 'far';
  } else {
    warningLevel = 'none';
  }

  return {
    bossPosition: bossPos,
    isDiscovered: distance <= 6,
    distanceToPlayer: distance,
    warningLevel,
  };
}

/**
 * 获取 Boss 预警文本
 *
 * @param warning - Boss 预警状态
 * @returns 预警描述文本
 */
export function getBossWarningText(warning: BossWarningState): string {
  return BOSS_WARNING_TEXTS[warning.warningLevel] || '';
}

// ============================================
// Boss 随机放置
// ============================================

/**
 * 为 Boss 选择一个随机边缘位置
 *
 * @param rows - 地图行数
 * @param cols - 地图列数
 * @param startPos - 玩家起始位置
 * @param minEdgeDist - 距离边缘最小距离
 * @param minStartDist - 距离起始位置最小距离
 * @returns Boss 位置 { row, col }
 */
export function chooseBossPosition(
  rows: number,
  cols: number,
  startPos: { row: number; col: number },
  minEdgeDist: number = 1,
  minStartDist: number = 3
): { row: number; col: number } {
  // 收集边缘区域候选位置（距离边缘 minEdgeDist 内）
  const candidates: { row: number; col: number }[] = [];
  for (let r = minEdgeDist; r < rows - minEdgeDist; r++) {
    for (let c = 0; c < cols; c++) {
      const isEdge = r <= minEdgeDist || r >= rows - 1 - minEdgeDist;
      const distFromStart = Math.abs(r - startPos.row) + Math.abs(c - startPos.col);
      if (isEdge && distFromStart >= minStartDist) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  if (candidates.length === 0) {
    // 无候选时回退到底行中间
    return { row: rows - 1, col: Math.floor(cols / 2) };
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ============================================
// 路径配置应用
// ============================================

/**
 * 根据路径类型调整格子生成概率
 *
 * @param baseProbabilities - 基础概率
 * @param pathType - 路径类型
 * @returns 调整后的概率
 */
export function applyPathConfig(
  baseProbabilities: Record<CellType, number>,
  pathType: PathRiskType
): Record<CellType, number> {
  const config = PATH_CONFIGS[pathType];
  if (!config) return baseProbabilities;

  const adjusted = { ...baseProbabilities };
  adjusted.enemy = Math.max(0, (adjusted.enemy || 0) + config.enemyProbOffset);
  adjusted.elite = Math.max(0, (adjusted.elite || 0) + config.eliteProbOffset);
  adjusted.rest = Math.max(0, (adjusted.rest || 0) + config.restProbOffset);
  // 奖励倍率通过配置存储，在结算时使用
  adjusted.empty = 1 - adjusted.enemy - adjusted.elite - adjusted.rest
    - (adjusted.treasure || 0) - (adjusted.event || 0) - (adjusted.boss || 0)
    - (adjusted.miniboss || 0) - (adjusted.portal || 0);
  adjusted.empty = Math.max(0.15, adjusted.empty); // 最少15%空格

  return adjusted;
}
