/**
 * modules/fortune/logic/visionSystem.ts — 望气术视野系统
 *
 * 纯函数模块：计算视野范围、可见格子、方向感应提示。
 * 视野受玩家属性（悟性+灵识）和所在地形影响。
 */

import type {
  FortuneMap,
  FortuneCell,
  GridPosition,
  SenseLevel,
  VisibleCell,
  SenseHint,
  TerrainType,
} from '../types';
import { getVisionModifier } from './terrainSystem';
import { manhattanDistance } from './mapGenerator';

// ============================================
// 视野计算
// ============================================

/**
 * 根据玩家属性计算望气术等级
 *
 * @param wuxing - 悟性值
 * @param lingshi - 灵识值（灵根相关属性）
 * @returns 望气术等级 0-3
 */
export function calculateSenseLevel(wuxing: number, lingshi: number): SenseLevel {
  const score = wuxing * 0.6 + lingshi * 0.4;

  if (score >= 60) return 3;
  if (score >= 30) return 2;
  if (score >= 10) return 1;
  return 0;
}

/**
 * 获取有效视野范围（考虑地形修正）
 *
 * @param senseLevel - 望气术等级
 * @param terrain - 玩家当前所在地形
 * @returns 有效视野格子数（曼哈顿距离）
 */
export function getEffectiveVision(senseLevel: SenseLevel, terrain: TerrainType): number {
  const baseVision = senseLevel + 1; // Lv0=1格, Lv1=2格, Lv2=3格, Lv3=4格
  const modifier = getVisionModifier(terrain);

  // 洞窟特殊处理：视野强制=1
  if (modifier <= -99) return 1;

  return Math.max(1, Math.min(4, baseVision + modifier));
}

/**
 * 获取可见格子列表
 *
 * @param map - 当前机缘地图
 * @param position - 玩家位置
 * @param senseLevel - 望气术等级
 * @returns 可见格子信息列表
 */
export function getVisibleCells(
  map: FortuneMap,
  position: GridPosition,
  senseLevel: SenseLevel
): VisibleCell[] {
  const terrain = map.grid[position.row]?.[position.col]?.terrain || 'plain';
  const vision = getEffectiveVision(senseLevel, terrain);

  const result: VisibleCell[] = [];

  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      const dist = manhattanDistance(position, { row: r, col: c });
      if (dist > vision) continue;

      const cell = map.grid[r][c];
      const node = cell.node;

      // 隐藏节点：只有 senseLevel >= 3 才可见
      const canSeeHidden = senseLevel >= 3;
      const isVisible = !node?.isHidden || canSeeHidden;

      result.push({
        position: { row: r, col: c },
        terrain: cell.terrain,
        nodeType: isVisible ? (node?.type || null) : null,
        nodeCategory: isVisible ? (node?.category || null) : null,
        hint: generateHint(node, senseLevel, dist, isVisible),
        isFullyVisible: isVisible && senseLevel >= 1,
        isCleared: node?.isCleared || false,
        isVisited: cell.isVisited,
        isHidden: node?.isHidden || false,
      });
    }
  }

  return result;
}

/**
 * 生成节点感应提示文本
 */
function generateHint(
  node: FortuneCell['node'],
  senseLevel: SenseLevel,
  distance: number,
  isVisible: boolean
): string {
  if (!node) return '';

  if (!isVisible) {
    return '迷雾笼罩，无法感知……';
  }

  if (distance === 0) return '';

  // 战斗类节点提示
  if (node.type === 'enemy' || node.type === 'elite' || node.type === 'miniboss' || node.type === 'guardian') {
    if (senseLevel >= 2) {
      const tierNames: Record<string, string> = {
        enemy: '普通敌人',
        elite: '精英敌人',
        miniboss: '小头目',
        guardian: '守卫',
      };
      return `前方有${tierNames[node.type] || '敌人'}的气息`;
    }
    return '前方有危险的气息……';
  }

  // 资源类节点提示
  if (node.type === 'treasure' || node.type === 'mineral_vein') {
    if (senseLevel >= 2) return '隐约有宝物的光芒';
    return '前方似乎有东西……';
  }

  if (node.type === 'herb') {
    return '空气中飘来淡淡的药香……';
  }

  if (node.type === 'scroll_fragment') {
    return '感到一股古老的灵气波动……';
  }

  // 交互类
  if (node.type === 'event') {
    return '前方笼罩着神秘的气息……';
  }

  if (node.type === 'merchant') {
    return '隐约听到叫卖声……';
  }

  if (node.type === 'altar') {
    return '前方传来庄严的灵力波动……';
  }

  if (node.type === 'challenge') {
    return '感到一股凌厉的意志……';
  }

  // 特殊类
  if (node.type === 'portal') {
    return '空间似乎在波动……';
  }

  if (node.type === 'trap') {
    if (senseLevel >= 2) return '隐约有不祥的预感……';
    return '';
  }

  if (node.type === 'fog') {
    return '无法感知前方的情况……';
  }

  return '';
}

/**
 * 获取视野外各方向的模糊感应提示
 *
 * @param map - 机缘地图
 * @param position - 玩家位置
 * @param senseLevel - 望气术等级
 * @returns 方向感应提示列表
 */
export function senseDirections(
  map: FortuneMap,
  position: GridPosition,
  senseLevel: SenseLevel
): SenseHint[] {
  if (senseLevel < 1) return [];

  const terrain = map.grid[position.row]?.[position.col]?.terrain || 'plain';
  const vision = getEffectiveVision(senseLevel, terrain);
  const hints: SenseHint[] = [];

  // 扫描四个方向的视野外区域（距离 vision+1 到 vision+3）
  const directions: Array<{ dir: SenseHint['direction']; dr: number; dc: number }> = [
    { dir: 'up', dr: -1, dc: 0 },
    { dir: 'down', dr: 1, dc: 0 },
    { dir: 'left', dr: 0, dc: -1 },
    { dir: 'right', dr: 0, dc: 1 },
  ];

  for (const { dir, dr, dc } of directions) {
    // 沿方向查找最近的非空格子
    for (let dist = vision + 1; dist <= vision + 3; dist++) {
      const r = position.row + dr * dist;
      const c = position.col + dc * dist;

      if (r < 0 || r >= map.rows || c < 0 || c >= map.cols) break;

      const cell = map.grid[r][c];
      if (cell?.node && !cell.node.isCleared) {
        const hintType = nodeToHintType(cell.node.type);
        const confidence: SenseHint['confidence'] =
          senseLevel >= 3 ? 'precise' : senseLevel >= 2 ? 'clear' : 'vague';

        hints.push({
          direction: dir,
          distance: dist,
          hintType,
          text: generateDirectionHint(hintType, confidence),
          confidence,
        });
        break;
      }
    }
  }

  return hints;
}

/** 节点类型映射到提示类型 */
function nodeToHintType(nodeType: string): SenseHint['hintType'] {
  switch (nodeType) {
    case 'enemy':
    case 'elite':
    case 'miniboss':
    case 'guardian':
    case 'challenge':
      return 'danger';
    case 'treasure':
    case 'mineral_vein':
    case 'herb':
    case 'scroll_fragment':
      return 'treasure';
    case 'event':
    case 'fog':
      return 'mystery';
    case 'rest':
    case 'spring':
    case 'merchant':
    case 'altar':
      return 'safe';
    default:
      return 'mystery';
  }
}

/** 生成方向提示文本 */
function generateDirectionHint(
  hintType: SenseHint['hintType'],
  confidence: SenseHint['confidence']
): string {
  const texts: Record<string, Record<string, string[]>> = {
    danger: {
      vague: ['远处隐约有危险的气息……'],
      clear: ['那个方向传来战斗的波动', '隐约感到一股杀意……'],
      precise: ['前方有强敌的气息，大致是精英级别的对手', '远处传来令人心悸的压迫感……'],
    },
    treasure: {
      vague: ['似乎有东西在发光……'],
      clear: ['那个方向有宝物的灵气波动', '空气中有一丝灵石的气息……'],
      precise: ['前方有宝物的强烈灵气反应', '那个方向传来浓郁的灵石气息……'],
    },
    mystery: {
      vague: ['那个方向笼罩着迷雾……'],
      clear: ['远方有些不对劲……'],
      precise: ['前方有异常的空间波动……'],
    },
    safe: {
      vague: ['那个方向似乎很平静……'],
      clear: ['远方有一片安宁的区域'],
      precise: ['前方有灵泉或休息点的气息……'],
    },
  };

  const pool = texts[hintType]?.[confidence] || texts.mystery.vague;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 检查某位置是否在视野内
 */
export function isInVision(
  position: GridPosition,
  playerPosition: GridPosition,
  map: FortuneMap,
  senseLevel: SenseLevel
): boolean {
  const terrain = map.grid[playerPosition.row]?.[playerPosition.col]?.terrain || 'plain';
  const vision = getEffectiveVision(senseLevel, terrain);
  return manhattanDistance(position, playerPosition) <= vision;
}
