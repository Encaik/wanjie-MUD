/**
 * 碎片系统 — 完整物品拆为碎片 / 碎片合成完整物品
 *
 * 所有函数为纯函数。
 */

import type { ItemInstance } from '../types';
import { getTemplate } from '../data/index';
import { getRarityConfig } from '../data/rarity';
import { createItemInstance, getItemCount, removeItem, findItemByInstance } from './itemManager';
import { generateItemInstance } from './itemGenerator';

/**
 * 将完整物品拆解为碎片
 *
 * @param inventory - 当前背包
 * @param instanceId - 要拆解的物品实例 ID
 * @param seed - 随机种子（用于碎片数量随机）
 * @returns 更新后的背包
 */
export function fragmentItem(
  inventory: ItemInstance[],
  instanceId: string,
  seed?: number
): ItemInstance[] {
  const item = findItemByInstance(inventory, instanceId);
  if (!item) throw new Error(`物品不存在: ${instanceId}`);

  if (item.isFragment) throw new Error('碎片不能再次拆解');
  if (item.equipped) throw new Error('已装备的物品不能拆解');

  const template = getTemplate(item.templateId);
  const rarityConfig = getRarityConfig(template.rarity);

  // 拆解获得的碎片数量 = 合成所需数量 × 0.6（随机 ±2）
  const rng = seed !== undefined ? (() => { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })() : (() => Math.random());
  const baseFragments = Math.floor(rarityConfig.fragmentsRequired * 0.6);
  const variance = Math.floor(rng() * 5) - 2; // -2 ~ +2
  const fragmentCount = Math.max(1, baseFragments + variance);

  // 先移除完整物品
  let newInventory = removeItem(inventory, instanceId, 1);

  // 添加碎片（碎片模板 ID 约定：源模板ID_fragment）
  const fragmentTemplateId = `${item.templateId}_fragment`;

  // 检查碎片模板是否存在
  try {
    getTemplate(fragmentTemplateId);
    // 模板存在，使用它
    newInventory = newInventory.concat(
      createItemInstance(fragmentTemplateId, { quantity: fragmentCount, source: 'craft' })
    );
  } catch {
    // 碎片模板不存在，使用通用碎片机制
    // 创建一个带 isFragment 标记的实例
    const fragment = createItemInstance(item.templateId, {
      quantity: fragmentCount,
      isFragment: true,
      source: 'craft',
      level: 1,
    });
    newInventory = newInventory.concat(fragment);
  }

  return newInventory;
}

/**
 * 将碎片合成为完整物品
 *
 * @param inventory - 当前背包
 * @param templateId - 目标完整物品的模板 ID（不含 _fragment 后缀）
 * @param seed - 随机种子
 * @returns { inventory, synthesizedItem }
 */
export function synthesizeFragments(
  inventory: ItemInstance[],
  templateId: string,
  seed?: number
): { inventory: ItemInstance[]; synthesizedItem?: ItemInstance; message: string } {
  const template = getTemplate(templateId);
  const rarityConfig = getRarityConfig(template.rarity);
  const required = rarityConfig.fragmentsRequired;

  // 统计有多少该模板的碎片
  const totalFragments = getItemCount(inventory, templateId);
  const fragmentInstances = inventory.filter(i => i.templateId === templateId && i.isFragment);

  if (totalFragments < required) {
    return {
      inventory,
      synthesizedItem: undefined,
      message: `碎片不足：需要 ${required} 个碎片，当前有 ${totalFragments} 个`,
    };
  }

  // 消耗碎片（从 isFragment 的实例中扣除）
  let remaining = required;
  let newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));

  for (const frag of fragmentInstances) {
    if (remaining <= 0) break;
    const toRemove = Math.min(frag.quantity, remaining);
    remaining -= toRemove;
    newInventory = removeItem(newInventory, frag.instanceId, toRemove);
  }

  // 生成完整物品
  const synthesizedItem = generateItemInstance(templateId, 1, seed);
  synthesizedItem.source = 'craft';
  newInventory = newInventory.concat(synthesizedItem);

  return {
    inventory: newInventory,
    synthesizedItem,
    message: `成功合成了 ${template.name}！`,
  };
}
