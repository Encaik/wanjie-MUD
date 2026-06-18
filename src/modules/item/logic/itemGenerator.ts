/**
 * 物品生成器 — 随机掉落、稀有度选择、词缀生成
 *
 * 所有函数接受 seed 参数，使用 seeded RNG 确保确定性。
 */

import { parseTemplateId } from '../types';
import type { ItemInstance, Rarity } from '../types';
import type { ItemTemplate } from '../types';
import { getTemplate, getAllTemplates } from '../data/index';
import { ALL_RARITIES, RARITY_ORDER, RARITY_CONFIG } from '../data/rarity';
import { ALL_AFFIX_TEMPLATES } from '../data/affixes';
import { createItemInstance } from './itemManager';

/** 简易 seeded RNG（乘法同余，确定性） */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 从模板创建物品实例
 *
 * @param templateId - 模板 ID
 * @param level - 等级（默认 1）
 * @param seed - 随机种子（用于词缀）
 */
export function generateItemInstance(
  templateId: string,
  level: number = 1,
  seed?: number
): ItemInstance {
  const template = getTemplate(templateId);
  const rng = seed !== undefined ? createRng(seed) : createRng(Date.now());

  const affixes = template.rarity !== 'common'
    ? rollAffixes(template.rarity, rng)
    : [];

  return createItemInstance(templateId, { level, affixes, source: 'drop' });
}

/**
 * 随机选择稀有度
 *
 * @param enemyLevel - 敌人等级
 * @param bossLevel - Boss 等级（0 表示非 Boss）
 * @param luck - 玩家幸运值（影响高稀有度权重）
 * @param seed - 随机种子
 */
export function rollRarity(
  enemyLevel: number,
  bossLevel: number = 0,
  luck: number = 8,
  seed?: number
): Rarity {
  const rng = seed !== undefined ? createRng(seed) : createRng(Date.now());

  // 根据等级确定稀有度上限
  let maxRarityIdx = 0;
  if (enemyLevel >= 50) maxRarityIdx = 5; // mythic
  else if (enemyLevel >= 30) maxRarityIdx = 4; // legendary
  else if (enemyLevel >= 20) maxRarityIdx = 3; // epic
  else if (enemyLevel >= 10) maxRarityIdx = 2; // rare
  else if (enemyLevel >= 5) maxRarityIdx = 1; // uncommon
  else maxRarityIdx = 0; // common

  // Boss 提升稀有度上限
  if (bossLevel >= 3) maxRarityIdx = Math.min(maxRarityIdx + 2, 5);
  else if (bossLevel >= 1) maxRarityIdx = Math.min(maxRarityIdx + 1, 5);

  // 加权随机（幸运值提升高稀有度权重）
  const weights: number[] = ALL_RARITIES.map((r, i) => {
    if (i > maxRarityIdx) return 0;
    let w = RARITY_CONFIG[r].dropWeight;
    // 幸运值加成：每超过基准 8 点，高稀有度权重 +20%
    const luckBonus = Math.max(0, luck - 8) * 0.02;
    if (i >= 3) w *= (1 + luckBonus * (i - 2));
    return w;
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return ALL_RARITIES[i];
  }

  return 'common';
}

/**
 * 随机生成词缀列表
 */
export function rollAffixes(
  rarity: Rarity,
  rng?: () => number
): ItemInstance['affixes'] {
  const config = RARITY_CONFIG[rarity];
  const [minCount, maxCount] = config.affixCount;
  if (maxCount === 0) return [];

  const rand = rng ?? createRng(Date.now());
  const count = minCount + Math.floor(rand() * (maxCount - minCount + 1));

  // 筛选不超过当前稀有度的词缀
  const maxIdx = RARITY_ORDER[rarity];
  const available = ALL_AFFIX_TEMPLATES.filter(a => RARITY_ORDER[a.rarity] <= maxIdx);

  if (available.length === 0) return [];

  const selected: ItemInstance['affixes'] = [];
  const usedTypes = new Set<'prefix' | 'suffix'>();

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rand() * available.length);
    const affix = available[idx];

    // 避免同一类型重复
    if (!usedTypes.has(affix.type) || count > 2) {
      selected.push({ id: `affix_${Date.now()}_${i}`, ...affix });
      usedTypes.add(affix.type);
    }

    // 移除已选的避免重复
    available.splice(idx, 1);
  }

  return selected;
}

/**
 * 随机生成掉落物品
 *
 * @param enemyLevel - 敌人等级
 * @param bossLevel - Boss 等级（0 表示非 Boss）
 * @param worldType - 世界观过滤
 * @param seed - 随机种子
 * @returns 生成的 ItemInstance，或 null（不掉落）
 */
export function generateRandomDrop(
  enemyLevel: number,
  bossLevel: number = 0,
  worldType?: string,
  seed?: number
): ItemInstance | null {
  const rng = seed !== undefined ? createRng(seed) : createRng(Date.now());

  // 基础掉落率 40%，Boss 100%
  const dropRate = bossLevel > 0 ? 1.0 : 0.4;
  if (rng() > dropRate) return null;

  const rarity = rollRarity(enemyLevel, bossLevel, 8, seed);

  // 筛选可掉落的模板
  const candidates = getAllTemplates().filter(t => {
    if (!t.isDroppable) return false;
    if (t.category === 'currency' || t.category === 'fragment') return false;
    if (t.rarity !== rarity) return false;
    // 世界观过滤：通过 templateId 中的 worldview 段判断
    if (worldType) {
      const parsed = parseTemplateId(t.templateId);
      if (parsed && parsed.worldview !== 'common' && parsed.worldview !== worldType) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  // 随机选一个模板
  const template = candidates[Math.floor(rng() * candidates.length)];
  const level = Math.max(1, Math.floor(enemyLevel / 10));

  return generateItemInstance(template.templateId, level, seed);
}
