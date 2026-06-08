/**
 * 品质掉落系统
 * 
 * 核心设计：
 * 1. 品质上限由内容等级决定（机缘等级/敌人等级）
 * 2. 玩家属性只影响权重分布和数量，不影响品质上限
 * 3. 完全隔离品质上限与玩家属性
 */

import { getOpportunityRarityRange, getOpportunityRarityWeights } from './opportunityConfig';
import { ItemRarity } from '../game/types';

// ============================================
// 类型定义
// ============================================

/** 品质来源类型 */
export type RaritySource = 'opportunity' | 'enemy' | 'boss';

/** 品质范围配置 */
export interface RarityRangeConfig {
  /** 来源类型 */
  sourceType: RaritySource;
  /** 来源等级 */
  level: number;
  /** 允许的品质范围 */
  rarityRange: ItemRarity[];
  /** 基础权重 */
  baseWeights: Record<string, number>;
}

/** 掉落结果 */
export interface DropResult {
  /** 品质 */
  rarity: ItemRarity;
  /** 物品等级 */
  level: number;
  /** 数量 */
  quantity: number;
  /** 来源类型 */
  sourceType: RaritySource;
  /** 来源等级 */
  sourceLevel: number;
}

// ============================================
// 常量定义
// ============================================

/** 有效品质列表 */
export const VALID_RARITIES: ItemRarity[] = ['普通', '稀有', '史诗', '传说', '神话'];

/** 品质最大幸运加成 */
export const MAX_LUCK_BONUS = 0.3;

/** 品质等级映射（用于计算） */
export const RARITY_ORDER: Record<ItemRarity, number> = {
  '普通': 1,
  '稀有': 2,
  '史诗': 3,
  '传说': 4,
  '神话': 5,
};

// ============================================
// 品质范围获取
// ============================================

/**
 * 获取品质范围
 * 
 * 关键：品质上限由内容本身决定，而非玩家属性
 * 
 * @param sourceType 来源类型
 * @param sourceLevel 来源等级（机缘等级/敌人等级）
 */
export function getRarityRange(
  sourceType: RaritySource,
  sourceLevel: number
): RarityRangeConfig {
  const level = Math.max(1, sourceLevel);
  
  // 机缘品质范围
  if (sourceType === 'opportunity') {
    const rarityRange = getOpportunityRarityRange(level);
    const baseWeights = getOpportunityRarityWeights(level);
    
    return {
      sourceType,
      level,
      rarityRange,
      baseWeights,
    };
  }
  
  // 敌人品质范围（基于敌人等级）
  if (sourceType === 'enemy') {
    if (level >= 60) {
      return {
        sourceType: 'enemy',
        level,
        rarityRange: ['稀有', '史诗', '传说', '神话'],
        baseWeights: { '稀有': 30, '史诗': 40, '传说': 20, '神话': 10 },
      };
    } else if (level >= 40) {
      return {
        sourceType: 'enemy',
        level,
        rarityRange: ['普通', '稀有', '史诗', '传说'],
        baseWeights: { '普通': 20, '稀有': 40, '史诗': 30, '传说': 10 },
      };
    } else if (level >= 20) {
      return {
        sourceType: 'enemy',
        level,
        rarityRange: ['普通', '稀有', '史诗'],
        baseWeights: { '普通': 40, '稀有': 45, '史诗': 15 },
      };
    } else {
      return {
        sourceType: 'enemy',
        level,
        rarityRange: ['普通', '稀有'],
        baseWeights: { '普通': 75, '稀有': 25 },
      };
    }
  }
  
  // Boss品质范围
  if (sourceType === 'boss') {
    if (level >= 50) {
      return {
        sourceType: 'boss',
        level,
        rarityRange: ['史诗', '传说', '神话'],
        baseWeights: { '史诗': 30, '传说': 45, '神话': 25 },
      };
    } else if (level >= 30) {
      return {
        sourceType: 'boss',
        level,
        rarityRange: ['稀有', '史诗', '传说'],
        baseWeights: { '稀有': 25, '史诗': 50, '传说': 25 },
      };
    } else {
      return {
        sourceType: 'boss',
        level,
        rarityRange: ['稀有', '史诗', '传说'],
        baseWeights: { '稀有': 40, '史诗': 45, '传说': 15 },
      };
    }
  }
  
  // 默认：普通品质
  return {
    sourceType,
    level,
    rarityRange: ['普通'],
    baseWeights: { '普通': 100 },
  };
}

// ============================================
// 品质生成
// ============================================

/**
 * 生成掉落品质
 * 
 * @param sourceType 来源类型
 * @param sourceLevel 来源等级（机缘等级/敌人等级）
 * @param playerLuck 玩家幸运值（只影响权重分布，不影响品质上限）
 * @param worldBonus 世界加成（只影响数量，不影响品质上限）- 已废弃，保留参数兼容
 */
export function generateDropRarity(
  sourceType: RaritySource,
  sourceLevel: number,
  playerLuck: number = 0,
  _worldBonus: number = 0 // 已废弃，保留参数兼容
): ItemRarity {
  // 1. 获取品质范围（由内容决定，不含玩家因素）
  const config = getRarityRange(sourceType, sourceLevel);
  
  // 2. 复制基础权重
  const weights: Record<string, number> = { ...config.baseWeights };
  
  // 3. 幸运值影响权重分布（不影响上限）
  // 幸运值可以让高品质概率更高，但不能突破品质上限
  if (playerLuck > 0 && config.rarityRange.length > 1) {
    const luckBonus = Math.min(playerLuck * 0.005, MAX_LUCK_BONUS); // 最高30%加成
    const rarities = config.rarityRange;
    
    // 从低到高调整权重
    for (let i = 0; i < rarities.length - 1; i++) {
      const shift = weights[rarities[i]] * luckBonus * (i + 1) / rarities.length;
      weights[rarities[i]] = Math.max(0, weights[rarities[i]] - shift);
      weights[rarities[rarities.length - 1]] += shift;
    }
  }
  
  // 4. 确保所有品质都在范围内
  for (const rarity of Object.keys(weights)) {
    if (!config.rarityRange.includes(rarity as ItemRarity)) {
      delete weights[rarity];
    }
  }
  
  // 5. 随机选择
  return weightedRandom(weights) as ItemRarity;
}

/**
 * 计算掉落数量
 * 
 * @param baseCount 基础数量
 * @param worldBonus 世界加成
 * @param playerBonus 玩家加成
 */
export function calculateDropCount(
  baseCount: number,
  worldBonus: number = 0,
  playerBonus: number = 0
): number {
  const multiplier = 1 + worldBonus + playerBonus;
  return Math.max(1, Math.floor(baseCount * multiplier));
}

// ============================================
// 工具函数
// ============================================

/**
 * 加权随机选择
 */
function weightedRandom(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  if (entries.length === 0) {
    return '普通';
  }
  
  // 如果只有一个选项，直接返回
  if (entries.length === 1) {
    return entries[0][0];
  }
  
  const totalWeight = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  
  if (totalWeight <= 0) {
    // 如果总权重为0，平均分配
    const index = Math.floor(Math.random() * entries.length);
    return entries[index][0];
  }
  
  let random = Math.random() * totalWeight;
  
  for (const [key, weight] of entries) {
    random -= Math.max(0, weight);
    if (random <= 0) {
      return key;
    }
  }
  
  return entries[entries.length - 1][0];
}

/**
 * 获取品质对应的颜色类名
 */
export function getRarityColorClass(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    '普通': 'text-muted-foreground',
    '稀有': 'text-blue-400',
    '史诗': 'text-purple-400',
    '传说': 'text-orange-400',
    '神话': 'text-yellow-400',
  };
  return colors[rarity] || 'text-muted-foreground';
}

/**
 * 获取品质对应的背景色类名
 */
export function getRarityBgClass(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    '普通': 'bg-muted/50',
    '稀有': 'bg-blue-500/20',
    '史诗': 'bg-purple-500/20',
    '传说': 'bg-orange-500/20',
    '神话': 'bg-yellow-500/20',
  };
  return colors[rarity] || 'bg-muted/50';
}

/**
 * 获取品质对应的边框色类名
 */
export function getRarityBorderClass(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    '普通': 'border-border',
    '稀有': 'border-blue-500/50',
    '史诗': 'border-purple-500/50',
    '传说': 'border-orange-500/50',
    '神话': 'border-yellow-500/50',
  };
  return colors[rarity] || 'border-border';
}

/**
 * 比较两个品质的等级
 * @returns 正数表示 a > b，负数表示 a < b，0 表示相等
 */
export function compareRarity(a: ItemRarity, b: ItemRarity): number {
  return RARITY_ORDER[a] - RARITY_ORDER[b];
}

/**
 * 获取最高品质
 */
export function getHighestRarity(rarities: ItemRarity[]): ItemRarity {
  if (rarities.length === 0) return '普通';
  
  return rarities.reduce((highest, current) => {
    return compareRarity(current, highest) > 0 ? current : highest;
  }, rarities[0]);
}

/**
 * 获取最低品质
 */
export function getLowestRarity(rarities: ItemRarity[]): ItemRarity {
  if (rarities.length === 0) return '普通';
  
  return rarities.reduce((lowest, current) => {
    return compareRarity(current, lowest) < 0 ? current : lowest;
  }, rarities[0]);
}

/**
 * 检查品质是否在范围内
 */
export function isRarityInRange(rarity: ItemRarity, range: ItemRarity[]): boolean {
  return range.includes(rarity);
}

/**
 * 获取随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成掉落物品等级
 */
export function generateDropItemLevel(sourceLevel: number): number {
  // 物品等级由来源等级决定，允许 ±5 级浮动
  return Math.max(1, sourceLevel + randomInt(-5, 5));
}

/**
 * 批量生成掉落
 */
export function generateDrops(
  sourceType: RaritySource,
  sourceLevel: number,
  count: number,
  playerLuck: number = 0
): DropResult[] {
  const drops: DropResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const rarity = generateDropRarity(sourceType, sourceLevel, playerLuck);
    const itemLevel = generateDropItemLevel(sourceLevel);
    
    drops.push({
      rarity,
      level: itemLevel,
      quantity: 1,
      sourceType,
      sourceLevel,
    });
  }
  
  return drops;
}
