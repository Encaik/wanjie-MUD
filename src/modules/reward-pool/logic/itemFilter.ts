/**
 * logic/itemFilter.ts — 物品过滤器
 *
 * 纯函数模块：根据 ItemFilter 条件筛选 ItemTemplateData 列表。
 * FilterEntry 在运行时调用，查询 ItemRegistry 获取匹配物品。
 */

import type { ItemFilter } from '../types';
import type { ItemTemplateData } from '@/core/types';
import type { Rarity } from '@/modules/item/types';
import { RARITY_ORDER } from '@/modules/item/data/rarity';

/**
 * 按 ItemFilter 条件筛选模板列表
 *
 * 过滤顺序：isDroppable → category → subcategory → rarity 范围 → exclude
 *
 * @param templates - 待筛选的模板列表（来自 ItemRegistry.getAll()）
 * @param filter - 过滤条件
 * @returns 匹配的模板列表，可能为空
 */
export function applyFilter(
  templates: readonly ItemTemplateData[],
  filter: ItemFilter
): ItemTemplateData[] {
  let result = [...templates];

  // ① isDroppable（默认 true）
  const isDroppable = filter.isDroppable ?? true;
  result = result.filter(t => t.isDroppable === isDroppable);

  // ② category 过滤
  if (filter.category !== undefined) {
    const categories = Array.isArray(filter.category) ? filter.category : [filter.category];
    result = result.filter(t => categories.includes(t.category as typeof categories[number]));
  }

  // ③ subcategory 过滤
  if (filter.subcategory !== undefined) {
    const subcategories = Array.isArray(filter.subcategory)
      ? filter.subcategory
      : [filter.subcategory];
    result = result.filter(t =>
      typeof t.subcategory === 'string' && subcategories.includes(t.subcategory!)
    );
  }

  // ④ rarity 范围过滤
  const minRarityIdx = filter.minRarity ? RARITY_ORDER[filter.minRarity] : 0;
  const maxRarityIdx = filter.maxRarity ? RARITY_ORDER[filter.maxRarity] : 5;
  result = result.filter(t => {
    const idx = RARITY_ORDER[t.rarity as Rarity];
    return idx !== undefined && idx >= minRarityIdx && idx <= maxRarityIdx;
  });

  // ⑤ exclude 排除
  if (filter.exclude && filter.exclude.length > 0) {
    const excludeSet = new Set(filter.exclude);
    result = result.filter(t => !excludeSet.has(t.templateId));
  }

  return result;
}

/**
 * 生成 ItemFilter 的缓存 key
 *
 * 用于 poolRegistry 缓存 FilterEntry 的过滤结果。
 */
export function filterCacheKey(filter: ItemFilter): string {
  return JSON.stringify(filter, Object.keys(filter).sort());
}
