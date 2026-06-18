/**
 * data/difficultyConfig.ts — 难度倍率与稀有度上限配置
 *
 * 定义不同难度等级下的奖励倍率和稀有度上限。
 * 用于 RollContext.difficulty 对应的池子倍率调整。
 */

import type { Rarity } from '@/modules/item/types';

// ============================================
// 难度倍率
// ============================================

/** 难度等级 */
export type DifficultyLevel = 'normal' | 'hard' | 'nightmare';

/** 难度配置 */
export interface DifficultyConfig {
  /** 显示名称 */
  name: string;
  /** 奖励数量倍率 */
  quantityMultiplier: number;
  /** 稀有度权重加成（epic+ 权重乘以该值） */
  rarityBonus: number;
  /** 默认稀有度上限（按玩家等级段） */
  maxRarityOverride?: Rarity;
}

/** 难度配置表 */
export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  normal: {
    name: '普通',
    quantityMultiplier: 1.0,
    rarityBonus: 1.0,
  },
  hard: {
    name: '困难',
    quantityMultiplier: 1.5,
    rarityBonus: 1.5,
    maxRarityOverride: 'legendary',
  },
  nightmare: {
    name: '噩梦',
    quantityMultiplier: 2.5,
    rarityBonus: 2.5,
  },
};

/**
 * 获取指定难度的数量倍率
 *
 * @param difficulty - 难度等级，默认 'normal'
 * @returns 数量倍率
 */
export function getDifficultyMultiplier(difficulty?: string): number {
  if (!difficulty) return 1.0;
  const config = DIFFICULTY_CONFIG[difficulty as DifficultyLevel];
  return config?.quantityMultiplier ?? 1.0;
}

// ============================================
// 等级段稀有度上限
// ============================================

/** 按玩家等级段确定默认稀有度上限 */
export const LEVEL_RARITY_CAP: Array<{ maxLevel: number; maxRarity: Rarity }> = [
  { maxLevel: 4, maxRarity: 'common' },
  { maxLevel: 9, maxRarity: 'uncommon' },
  { maxLevel: 19, maxRarity: 'rare' },
  { maxLevel: 29, maxRarity: 'epic' },
  { maxLevel: 49, maxRarity: 'legendary' },
  { maxLevel: Infinity, maxRarity: 'mythic' },
];

/**
 * 根据玩家等级获取稀有度上限
 */
export function getMaxRarityForLevel(level: number): Rarity {
  for (const cap of LEVEL_RARITY_CAP) {
    if (level <= cap.maxLevel) return cap.maxRarity;
  }
  return 'mythic';
}
