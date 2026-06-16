/**
 * 消耗品使用逻辑
 *
 * 所有函数为纯函数。
 */

import type { ItemInstance } from '../types';
import type { SkillEffect } from '../types';
import { getTemplate } from '../data/index';
import { removeItem, findItemByInstance } from './itemManager';

/** 使用消耗品的结果 */
export interface UseConsumableResult {
  inventory: ItemInstance[];
  effects: SkillEffect[];
  itemName: string;
}

/**
 * 使用消耗品
 *
 * @param inventory - 当前背包
 * @param instanceId - 要使用的物品实例 ID
 * @returns 使用结果（更新后的背包 + 效果列表）
 */
export function useConsumable(
  inventory: ItemInstance[],
  instanceId: string
): UseConsumableResult {
  const item = findItemByInstance(inventory, instanceId);
  if (!item) {
    throw new Error(`物品不存在: ${instanceId}`);
  }

  const template = getTemplate(item.templateId);

  if (template.category !== 'consumable') {
    throw new Error(`"${template.name}" 不是消耗品，无法使用`);
  }

  if (item.isFragment) {
    throw new Error('碎片无法使用');
  }

  // 获取消耗品的效果
  const effects: SkillEffect[] = (template.ext as { effects?: SkillEffect[] }).effects ?? [];

  // 减少数量
  const newInventory = removeItem(inventory, instanceId, 1);

  return {
    inventory: newInventory,
    effects,
    itemName: template.name,
  };
}
