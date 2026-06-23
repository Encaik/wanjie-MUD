/**
 * 物品生成器 — 实例创建、词缀生成
 *
 * 所有函数接受 seed 参数，使用 seeded RNG 确保确定性。
 * 注意：generateRandomDrop() 和 rollRarity() 已迁移到 modules/reward-pool/。
 */

import { createItemInstance } from './itemManager';
import { ALL_AFFIX_TEMPLATES } from '../data/affixes';
import { getTemplate } from '../data/index';
import { RARITY_ORDER, RARITY_CONFIG } from '../data/rarity';

import type { ItemInstance, Rarity } from '../types';

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

