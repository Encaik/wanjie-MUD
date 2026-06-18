/**
 * modules/fortune/logic/mapGenerator.ts — 机缘地图生成器
 *
 * 使用种子驱动的区域生长算法生成包含地形区块和节点的机缘地图。
 * 生成过程确定性：相同 seed + fortuneType + depth → 相同地图。
 */

import type {
  FortuneTypeId,
  TerrainType,
  NodeType,
  NodeCategory,
  FortuneNode,
  FortuneCell,
  FortuneMap,
  GridPosition,
  NodeContent,
  EnemyContent,
} from '../types';
import { getFortuneTypeConfig } from '../data/fortuneTypeConfig';
import { getTerrainConfig } from '../data/terrainConfig';
import { getNodeTypeConfig } from '../data/nodeTypeConfig';
import type { FortuneTypeConfigEntry } from '../data/fortuneTypeConfig';

// ============================================
// 种子随机数生成器
// ============================================

/** 简单的种子随机数生成器（mulberry32） */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 在范围内随机整数 */
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** 从加权表中随机选择键 */
function weightedSelect<T extends string>(rng: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

/** 打乱数组 */
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================
// 地图生成
// ============================================

/**
 * 生成一层机缘地图
 *
 * @param fortuneType - 机缘主题 ID
 * @param depth - 当前楼层（1-based）
 * @param playerLevel - 玩家等级
 * @param seed - 生成种子
 * @returns 完整机缘地图
 */
export function generateFortuneMap(
  fortuneType: FortuneTypeId,
  depth: number,
  playerLevel: number,
  seed: number
): FortuneMap {
  const rng = createRng(seed + depth * 1000);
  const themeConfig = getFortuneTypeConfig(fortuneType);

  if (!themeConfig) {
    throw new Error(`未找到机缘主题配置: ${fortuneType}`);
  }

  // 1. 计算网格大小
  const gridSize = 5 + depth * 2;
  const rows = gridSize;
  const cols = gridSize;

  // 2. 生成地形
  const terrainGrid = generateTerrain(rng, rows, cols, themeConfig);

  // 3. 确定起点和出口
  const playerStart: GridPosition = { row: Math.floor(rows / 2), col: 0 };
  const floorExit: GridPosition = {
    row: randInt(rng, 1, rows - 2),
    col: cols - 1,
  };

  // 4. 放置节点
  const nodeGrid = placeNodes(rng, rows, cols, terrainGrid, themeConfig, depth, playerStart, floorExit, playerLevel);

  // 5. 构建 FortuneCell 网格
  const grid: FortuneCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: FortuneCell[] = [];
    for (let c = 0; c < cols; c++) {
      const isStart = r === playerStart.row && c === playerStart.col;
      row.push({
        terrain: terrainGrid[r][c],
        node: nodeGrid[r][c],
        isRevealed: isStart,
        isVisited: false,
      });
    }
    grid.push(row);
  }

  // 标记起点已访问
  grid[playerStart.row][playerStart.col].isVisited = true;

  // 计算奖励倍率
  const rewardMultiplier = 1.0 + (depth - 1) * 0.3;

  return {
    id: `fortune_${fortuneType}_${depth}_${seed}`,
    fortuneType,
    depth,
    maxDepth: themeConfig.maxDepth,
    grid,
    playerStart,
    floorExit,
    rewardMultiplier,
    seed,
    rows,
    cols,
  };
}

// ============================================
// 地形生成（区域生长算法）
// ============================================

/**
 * 使用区域生长算法生成地形网格
 *
 * 算法：
 * 1. 在网格中随机撒种子点
 * 2. 每个种子分配一种地形（按主题权重）
 * 3. 多个种子向四邻扩张直到所有格子被覆盖
 */
function generateTerrain(
  rng: () => number,
  rows: number,
  cols: number,
  themeConfig: FortuneTypeConfigEntry
): TerrainType[][] {
  const terrainWeights = themeConfig.terrainDistribution;

  // 初始化网格为 null
  const grid: (TerrainType | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  // 撒种子点（约每 9 格一个种子）
  const seedCount = Math.max(3, Math.floor((rows * cols) / 9));
  const seeds: Array<{ row: number; col: number; terrain: TerrainType }> = [];

  for (let i = 0; i < seedCount; i++) {
    const row = randInt(rng, 0, rows - 1);
    const col = randInt(rng, 0, cols - 1);
    const terrain = weightedSelect(rng, terrainWeights as Record<string, number>) as TerrainType;
    seeds.push({ row, col, terrain });
    grid[row][col] = terrain;
  }

  // 区域生长：使用 BFS 队列
  const queue = shuffle(rng, [...seeds]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // 向四邻扩张
    const neighbors = getNeighbors(current.row, current.col, rows, cols);
    const shuffledNeighbors = shuffle(rng, neighbors);

    for (const n of shuffledNeighbors) {
      if (grid[n.row][n.col] === null) {
        grid[n.row][n.col] = current.terrain;
        queue.push({ row: n.row, col: n.col, terrain: current.terrain });
      }
    }
  }

  // 填充剩余的 null（理论上不会出现，但做兜底）
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = 'plain';
      }
    }
  }

  return grid as TerrainType[][];
}

// ============================================
// 节点放置
// ============================================

/**
 * 在地形网格上按权重放置节点
 */
function placeNodes(
  rng: () => number,
  rows: number,
  cols: number,
  terrainGrid: TerrainType[][],
  themeConfig: FortuneTypeConfigEntry,
  depth: number,
  playerStart: GridPosition,
  floorExit: GridPosition,
  _playerLevel: number
): (FortuneNode | null)[][] {
  const nodeGrid: (FortuneNode | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  // 收集候选格子（排除起点、出口、已占用的特殊格子）
  const candidates: GridPosition[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === playerStart.row && c === playerStart.col) continue;
      if (r === floorExit.row && c === floorExit.col) continue;
      candidates.push({ row: r, col: c });
    }
  }

  const shuffled = shuffle(rng, candidates);

  // 计算每种地形修正后的节点权重
  const baseWeights = themeConfig.nodeTypeWeights;
  const nodeTypes = Object.keys(baseWeights) as NodeType[];

  // 根据深度过滤（某些节点只在特定深度出现）
  const availableTypes = nodeTypes.filter(t => {
    const config = getNodeTypeConfig(t);
    if (depth < config.minDepth) return false;
    if (config.maxDepth !== undefined && depth > config.maxDepth) return false;
    return true;
  });

  // 约 60% 的格子放置节点
  const targetNodeCount = Math.floor(shuffled.length * 0.6);

  for (let i = 0; i < Math.min(targetNodeCount, shuffled.length); i++) {
    const pos = shuffled[i];
    const terrain = terrainGrid[pos.row][pos.col];
    const terrainCfg = getTerrainConfig(terrain);

    // 合并基础权重和地形修正
    const effectiveWeights: Record<string, number> = {};
    for (const type of availableTypes) {
      let weight = baseWeights[type] || 1;
      // 应用地形节点权重修正
      const modifier = terrainCfg.nodeWeightModifiers[type];
      if (modifier !== undefined) {
        weight *= modifier;
      }
      effectiveWeights[type] = Math.max(0.1, weight);
    }

    const nodeType = weightedSelect(rng, effectiveWeights) as NodeType;
    const nodeConfig = getNodeTypeConfig(nodeType);

    // 构建节点内容
    const content = generateNodeContent(rng, nodeType, depth);

    // 检查是否为隐藏节点（约 10% 概率，深度越高越多）
    const hideChance = 0.08 + depth * 0.02;
    const isHidden = rng() < hideChance;

    nodeGrid[pos.row][pos.col] = {
      type: nodeType,
      category: nodeConfig.category,
      difficulty: depth + (nodeType === 'elite' ? 2 : nodeType === 'miniboss' ? 4 : nodeType === 'guardian' ? 5 : 0),
      rewardMultiplier: 1.0 + (nodeType === 'elite' ? 0.5 : nodeType === 'miniboss' ? 1.0 : nodeType === 'guardian' ? 1.5 : 0),
      content,
      isCleared: false,
      isHidden,
    };
  }

  // 保证出口有守卫节点
  nodeGrid[floorExit.row][floorExit.col] = {
    type: 'guardian',
    category: 'combat',
    difficulty: depth + 5,
    rewardMultiplier: 1.5,
    content: generateEnemyContent('boss', depth),
    isCleared: false,
    isHidden: false,
  };

  // 保证传送阵成对出现
  ensurePortalPairs(rng, nodeGrid, rows, cols);

  return nodeGrid;
}

/**
 * 生成节点内容
 */
function generateNodeContent(
  rng: () => number,
  nodeType: NodeType,
  depth: number
): NodeContent {
  switch (nodeType) {
    case 'enemy':
      return generateEnemyContent('normal', depth);
    case 'elite':
      return generateEnemyContent('elite', depth);
    case 'miniboss':
      return generateEnemyContent('miniboss', depth);
    case 'guardian':
      return generateEnemyContent('boss', depth);
    case 'challenge':
      return generateEnemyContent('elite', depth); // 试炼碑也是精英级战斗
    default:
      return {};
  }
}

/**
 * 生成敌人内容
 */
function generateEnemyContent(
  tier: 'normal' | 'elite' | 'miniboss' | 'boss',
  depth: number
): EnemyContent {
  const tierLevelBonus: Record<string, number> = {
    normal: 0,
    elite: 3,
    miniboss: 6,
    boss: 10,
  };

  const enemyNames: Record<string, string[]> = {
    normal: ['妖兽', '流浪修士', '邪修', '山贼', '野兽'],
    elite: ['精英妖兽', '魔道修士', '剑客', '妖将'],
    miniboss: ['妖兽统领', '魔将', '散修高手', '兽王'],
    boss: ['镇守者', '古兽', '魔君', '守护灵'],
  };

  const names = enemyNames[tier] || enemyNames.normal;
  const level = 3 + depth * 3 + (tierLevelBonus[tier] || 0);

  return {
    name: names[Math.floor(Math.random() * names.length)],
    level,
    tier,
  };
}

/**
 * 保证传送阵成对出现
 */
function ensurePortalPairs(
  rng: () => number,
  nodeGrid: (FortuneNode | null)[][],
  rows: number,
  cols: number
): void {
  // 收集所有传送阵位置
  const portalPositions: GridPosition[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (nodeGrid[r][c]?.type === 'portal') {
        portalPositions.push({ row: r, col: c });
      }
    }
  }

  // 如果是奇数，移除一个或添加一个
  if (portalPositions.length % 2 !== 0) {
    if (portalPositions.length > 1) {
      // 移除最后一个
      const last = portalPositions.pop()!;
      nodeGrid[last.row][last.col] = null;
    } else {
      // 找到空位添加一个
      const emptyCells: GridPosition[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (nodeGrid[r][c] === null) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
      if (emptyCells.length > 0) {
        const pos = emptyCells[randInt(rng, 0, emptyCells.length - 1)];
        nodeGrid[pos.row][pos.col] = {
          type: 'portal',
          category: 'special',
          difficulty: 0,
          rewardMultiplier: 1.0,
          content: {},
          isCleared: false,
          isHidden: false,
        };
        portalPositions.push(pos);
      }
    }
  }
}

// ============================================
// 工具函数
// ============================================

/** 获取四邻坐标 */
function getNeighbors(row: number, col: number, rows: number, cols: number): GridPosition[] {
  const result: GridPosition[] = [];
  if (row > 0) result.push({ row: row - 1, col });
  if (row < rows - 1) result.push({ row: row + 1, col });
  if (col > 0) result.push({ row, col: col - 1 });
  if (col < cols - 1) result.push({ row, col: col + 1 });
  return result;
}

/** 曼哈顿距离 */
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
