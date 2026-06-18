/**
 * logic/rarityRoller.ts — 稀有度投骰器
 *
 * 纯函数模块：根据权重配置和玩家幸运值投骰稀有度。
 * 替代旧的 itemGenerator.rollRarity()，支持每个条目独立的稀有度配置。
 */

import type { Rarity } from '@/modules/item/types';
import { ALL_RARITIES, RARITY_ORDER } from '@/modules/item/data/rarity';
import { createRng } from '@/shared/utils/rng';

/** 默认幸运基准值 */
const BASE_LUCK = 8;

/**
 * 加权稀有度投骰
 *
 * 每个条目独立调用，支持不同的稀有度分布。
 * 幸运值超过基准（8）时，高稀有度（epic+）获得权重加成。
 *
 * @param weights - 稀有度权重映射（如 { common: 0.7, rare: 0.2, epic: 0.1 }）
 * @param luck - 玩家幸运值
 * @param seed - 随机种子
 * @returns 投骰结果稀有度
 */
export function rollRarity(
  weights: Partial<Record<Rarity, number>>,
  luck: number = BASE_LUCK,
  seed?: number | string
): Rarity {
  const rng = seed !== undefined ? createRng(seed) : createRng(Date.now());

  // 构建权重数组（按 ALL_RARITIES 顺序）
  const weightArray: number[] = ALL_RARITIES.map((r, i) => {
    const baseWeight = weights[r] ?? 0;

    // 幸运值加成：超过基准时，epic+ 权重提升
    if (baseWeight > 0 && i >= 3) {
      const luckBonus = Math.max(0, luck - BASE_LUCK) * 0.02;
      return baseWeight * (1 + luckBonus * (i - 2));
    }

    return baseWeight;
  });

  // 检查总权重
  const totalWeight = weightArray.reduce((s, w) => s + w, 0);
  if (totalWeight <= 0) {
    // fallback 到 common
    return 'common';
  }

  // 加权随机选择
  let roll = rng() * totalWeight;
  for (let i = 0; i < weightArray.length; i++) {
    roll -= weightArray[i];
    if (roll <= 0) {
      return ALL_RARITIES[i];
    }
  }

  // 浮点精度保护
  return ALL_RARITIES[ALL_RARITIES.length - 1];
}

/**
 * 按等级确定稀有度上限索引
 *
 * @param level - 敌人/节点等级
 * @returns 稀有度在 ALL_RARITIES 中的最大索引
 */
export function getMaxRarityByLevel(level: number): number {
  if (level >= 50) return 5; // mythic
  if (level >= 30) return 4; // legendary
  if (level >= 20) return 3; // epic
  if (level >= 10) return 2; // rare
  if (level >= 5) return 1;  // uncommon
  return 0;                   // common
}

/**
 * 按稀有度上限裁剪权重
 *
 * 将超过 maxRarity 的稀有度权重置零。
 *
 * @param weights - 原始权重
 * @param maxRarity - 最大稀有度
 * @returns 裁剪后的权重
 */
export function clampWeightsByRarity(
  weights: Partial<Record<Rarity, number>>,
  maxRarity: Rarity
): Partial<Record<Rarity, number>> {
  const maxIdx = RARITY_ORDER[maxRarity];
  const clamped: Partial<Record<Rarity, number>> = {};
  for (const r of ALL_RARITIES) {
    if (RARITY_ORDER[r] <= maxIdx) {
      const w = weights[r];
      if (w !== undefined && w > 0) {
        clamped[r] = w;
      }
    }
  }
  return clamped;
}
