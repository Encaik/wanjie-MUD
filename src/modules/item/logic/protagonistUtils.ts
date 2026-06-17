/**
 * Protagonist 便捷访问器（统一物品系统）
 *
 * 提供从 protagonist.slots + protagonist.items 读取装备/功法/技能/货币的便捷函数。
 * 消费方迁移时使用这些函数替代旧字段访问。
 */

import type { Protagonist } from '@/core/types';
import type { ItemInstance, ResolvedItem, ItemCategory } from '../types';
import { resolveItem, findItemByInstance, getItemCount } from './itemManager';

/** 从槽位获取已解析的装备物品 */
export function getEquippedResolved(protagonist: Protagonist, slotId: string): ResolvedItem | null {
  const instanceId = protagonist.slots?.[slotId];
  if (!instanceId) return null;
  const instance = findItemByInstance(protagonist.items, instanceId);
  return instance ? resolveItem(instance) : null;
}

/** 获取所有已装备的物品（按槽位分类） */
export function getAllEquipped(protagonist: Protagonist): Record<string, ResolvedItem> {
  const result: Record<string, ResolvedItem> = {};
  for (const [slotId, instanceId] of Object.entries(protagonist.slots || {})) {
    if (!instanceId) continue;
    const instance = findItemByInstance(protagonist.items, instanceId);
    if (instance) result[slotId] = resolveItem(instance);
  }
  return result;
}

/** 获取所有已装备的功法（攻击+防御） */
export function getEquippedTechniques(protagonist: Protagonist): ResolvedItem[] {
  const equipped = getAllEquipped(protagonist);
  return Object.entries(equipped)
    .filter(([slotId]) => slotId.startsWith('technique_'))
    .map(([, item]) => item);
}

/** 获取所有已装备的装备（武器+防具） */
export function getEquippedEquipments(protagonist: Protagonist): ResolvedItem[] {
  const equipped = getAllEquipped(protagonist);
  return Object.entries(equipped)
    .filter(([slotId]) => slotId.startsWith('weapon_') || slotId.startsWith('armor_'))
    .map(([, item]) => item);
}

/** 获取背包中指定类别的物品 */
export function getItemsByCategoryResolved(protagonist: Protagonist, category: ItemCategory): ResolvedItem[] {
  return protagonist.items
    .filter(i => {
      try { return resolveItem(i).category === category; } catch { return false; }
    })
    .map(i => resolveItem(i));
}

/** 获取货币余额 */
export function getCurrency(protagonist: Protagonist, currencyTemplateId: string): number {
  return getItemCount(protagonist.items, currencyTemplateId);
}

/** 获取灵石余额 */
export function getSpiritStones(protagonist: Protagonist): number {
  return getCurrency(protagonist, 'wanjie:common:spirit_stone');
}

/** 检查是否装备了某模板的物品 */
export function hasEquipped(protagonist: Protagonist, templateId: string): boolean {
  for (const instanceId of Object.values(protagonist.slots || {})) {
    if (!instanceId) continue;
    const instance = findItemByInstance(protagonist.items, instanceId);
    if (instance?.templateId === templateId) return true;
  }
  return false;
}

/** 获取近战武器（便捷访问器） */
export function getMeleeWeapon(protagonist: Protagonist): ResolvedItem | null {
  return getEquippedResolved(protagonist, 'weapon_melee');
}

/** 获取远程武器（便捷访问器） */
export function getRangedWeapon(protagonist: Protagonist): ResolvedItem | null {
  return getEquippedResolved(protagonist, 'weapon_ranged');
}

export { resolveItem, findItemByInstance, getItemCount };
