/**
 * modules/fortune/data/terrainConfig.ts — 地形配置表
 *
 * 定义 7 种地形的移动消耗、视野修正、进入效果和节点概率修正。
 */

import type { TerrainType, NodeType } from '../types';

/** 地形配置 */
export interface TerrainConfigEntry {
  /** 地形类型 */
  type: TerrainType;
  /** 中文名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 移动体力消耗 */
  moveCost: number;
  /** 视野修正值 */
  visionModifier: number;
  /** 进入时 HP 变化比例（正=回血，负=扣血） */
  hpChangeRatio: number;
  /** 进入时 MP 变化比例 */
  mpChangeRatio: number;
  /** 节点出现概率修正（相对默认权重） */
  nodeWeightModifiers: Partial<Record<NodeType, number>>;
  /** 图标 emoji */
  icon: string;
}

/** 地形配置表 */
export const TERRAIN_CONFIG: Record<TerrainType, TerrainConfigEntry> = {
  plain: {
    type: 'plain',
    name: '平地',
    description: '开阔平坦的地面，视野良好',
    moveCost: 1,
    visionModifier: 0,
    hpChangeRatio: 0,
    mpChangeRatio: 0,
    nodeWeightModifiers: {},
    icon: '░',
  },
  forest: {
    type: 'forest',
    name: '密林',
    description: '茂密的树林，可能藏有宝物，但阻挡视线',
    moveCost: 1,
    visionModifier: -1,
    hpChangeRatio: 0,
    mpChangeRatio: 0,
    nodeWeightModifiers: {
      treasure: 2.0,    // 宝箱概率×2
      herb: 1.5,        // 药草概率+50%
      event: 1.2,       // 事件概率+20%
    },
    icon: '🌿',
  },
  cave: {
    type: 'cave',
    name: '洞窟',
    description: '阴暗的洞穴，视线严重受限，但深处藏有重宝',
    moveCost: 1,
    visionModifier: -99, // 强制视野=1（在 visionSystem 中特殊处理）
    hpChangeRatio: 0,
    mpChangeRatio: 0,
    nodeWeightModifiers: {
      mineral_vein: 2.5, // 矿脉概率×2.5
      elite: 1.5,        // 精英概率+50%
      treasure: 1.5,     // 宝箱概率+50%
      scroll_fragment: 1.5,
    },
    icon: '🕳️',
  },
  cliff: {
    type: 'cliff',
    name: '山崖',
    description: '陡峭的山崖，移动费力但视野开阔',
    moveCost: 2,
    visionModifier: 1,
    hpChangeRatio: 0,
    mpChangeRatio: 0,
    nodeWeightModifiers: {
      challenge: 2.0,   // 试炼碑概率×2
      altar: 1.5,       // 祭坛概率+50%
      scroll_fragment: 1.3,
    },
    icon: '⛰️',
  },
  swamp: {
    type: 'swamp',
    name: '毒沼',
    description: '弥漫毒雾的沼泽，每步都在消耗生命，但出产稀有材料',
    moveCost: 1,
    visionModifier: 0,
    hpChangeRatio: -0.02, // 每步扣 2% HP
    mpChangeRatio: 0,
    nodeWeightModifiers: {
      herb: 3.0,        // 药草概率×3
      mineral_vein: 1.5,
      trap: 2.0,        // 陷阱概率×2
      elite: 1.2,
    },
    icon: '☠️',
  },
  spring: {
    type: 'spring',
    name: '灵泉',
    description: '灵气汇聚的泉眼，可以恢复伤势',
    moveCost: 0,        // 不消耗体力
    visionModifier: 0,
    hpChangeRatio: 0.30, // 恢复 30% HP
    mpChangeRatio: 0.30, // 恢复 30% MP
    nodeWeightModifiers: {
      altar: 2.0,
      event: 1.3,
    },
    icon: '💧',
  },
  ruins: {
    type: 'ruins',
    name: '遗迹',
    description: '远古修炼者留下的遗迹，充满试炼与机缘',
    moveCost: 1,
    visionModifier: 0,
    hpChangeRatio: 0,
    mpChangeRatio: 0,
    nodeWeightModifiers: {
      challenge: 3.0,   // 试炼碑概率×3
      altar: 2.0,       // 祭坛概率×2
      scroll_fragment: 2.0,
      elite: 1.3,
      guardian: 1.2,
    },
    icon: '🏛️',
  },
};

/** 获取地形配置 */
export function getTerrainConfig(terrain: TerrainType): TerrainConfigEntry {
  return TERRAIN_CONFIG[terrain];
}

/** 地形中文名列表（用于 UI 展示） */
export const TERRAIN_NAMES: Record<TerrainType, string> = Object.fromEntries(
  Object.entries(TERRAIN_CONFIG).map(([k, v]) => [k, v.name])
) as Record<TerrainType, string>;

/** 地形图标列表 */
export const TERRAIN_ICONS: Record<TerrainType, string> = Object.fromEntries(
  Object.entries(TERRAIN_CONFIG).map(([k, v]) => [k, v.icon])
) as Record<TerrainType, string>;
