/**
 * 技能装备系统 — 装备/卸下技能到功法/武器的技能槽位
 *
 * 所有函数为纯函数。
 */

import { findItemByInstance } from './itemManager';
import { getTemplate } from '../data/index';

import type { ItemInstance, SlotId, EquipResult } from '../types';

/**
 * 验证技能能否装备到指定技能槽位
 */
export function validateSkillEquip(
  skillInstance: ItemInstance,
  skillSlotId: string,
): { valid: boolean; error?: string } {
  // 检查槽位是否是技能槽
  if (!skillSlotId.startsWith('skill_')) {
    return { valid: false, error: '该槽位不是技能槽位' };
  }

  const template = getTemplate(skillInstance.templateId);
  if (template.category !== 'skill') {
    return { valid: false, error: '只能装备技能到技能槽位' };
  }

  if (skillInstance.isFragment) {
    return { valid: false, error: '碎片无法装备' };
  }

  if (skillInstance.equipped) {
    return { valid: false, error: '该技能已装备在其他槽位' };
  }

  return { valid: true };
}

/**
 * 装备技能到技能槽位
 *
 * 技能槽位属于某个功法/武器（父槽位），技能装备在父槽位的物品的 equippedSkills 中。
 *
 * @param inventory - 当前背包
 * @param slots - 当前槽位映射
 * @param skillInstanceId - 技能实例 ID
 * @param skillSlotId - 技能槽位 ID（如 'skill_technique_atk_1_0'）
 */
export function equipSkill(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  skillInstanceId: string,
  skillSlotId: string
): EquipResult {
  const skillItem = findItemByInstance(inventory, skillInstanceId);
  if (!skillItem) {
    return { success: false, error: '技能物品不存在' };
  }

  const validation = validateSkillEquip(skillItem, skillSlotId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 从 skillSlotId 解析父槽位（如 skill_technique_atk_1_0 → technique_atk_1）
  const parts = skillSlotId.split('_');
  parts.pop(); // 移除最后的索引
  const parentSlotId = parts.slice(1).join('_'); // 移除前缀 'skill_'

  const parentItemId = slots[parentSlotId];
  if (!parentItemId) {
    return { success: false, error: '父槽位未装备物品，无法装备技能' };
  }

  const parentItem = findItemByInstance(inventory, parentItemId);
  if (!parentItem) {
    return { success: false, error: '父槽位物品不存在' };
  }

  // 检查技能槽位是否已被占用
  const existingSkillId = slots[skillSlotId];
  let newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));
  const newSlots = { ...slots };

  if (existingSkillId) {
    // 卸下旧技能
    newInventory = newInventory.map(i =>
      i.instanceId === existingSkillId
        ? { ...i, equipped: false, equippedInSlot: null, equippedSkills: { ...i.equippedSkills } }
        : i
    );
  }

  // 更新技能物品状态
  newInventory = newInventory.map(i =>
    i.instanceId === skillInstanceId
      ? { ...i, equipped: true, equippedInSlot: skillSlotId, equippedSkills: { ...i.equippedSkills } }
      : i
  );

  // 更新父物品的 equippedSkills
  newInventory = newInventory.map(i =>
    i.instanceId === parentItemId
      ? { ...i, equippedSkills: { ...i.equippedSkills, [skillSlotId]: skillInstanceId } }
      : i
  );

  // 更新槽位
  newSlots[skillSlotId] = skillInstanceId;

  const skillName = getTemplate(skillItem.templateId).name;
  const parentName = getTemplate(parentItem.templateId).name;

  return {
    success: true,
    message: `将 ${skillName} 装备到 ${parentName} 的技能槽`,
    updatedInventory: newInventory,
    updatedSlots: newSlots,
  };
}

/**
 * 卸下技能槽位中的技能
 */
export function unequipSkill(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  skillSlotId: string
): EquipResult {
  const skillInstanceId = slots[skillSlotId];
  if (!skillInstanceId) {
    return { success: false, error: '该技能槽位为空' };
  }

  // 解析父槽位
  const parts = skillSlotId.split('_');
  parts.pop();
  const parentSlotId = parts.slice(1).join('_');

  const parentItemId = slots[parentSlotId];

  let newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));
  const newSlots = { ...slots };

  // 卸下技能
  newInventory = newInventory.map(i =>
    i.instanceId === skillInstanceId
      ? { ...i, equipped: false, equippedInSlot: null, equippedSkills: { ...i.equippedSkills } }
      : i
  );

  // 更新父物品
  if (parentItemId) {
    newInventory = newInventory.map(i =>
      i.instanceId === parentItemId
        ? { ...i, equippedSkills: { ...i.equippedSkills, [skillSlotId]: null } }
        : i
    );
  }

  newSlots[skillSlotId] = null;

  const skillItem = findItemByInstance(inventory, skillInstanceId);
  const skillName = skillItem ? getTemplate(skillItem.templateId).name : '技能';

  return {
    success: true,
    message: `卸下了 ${skillName}`,
    updatedInventory: newInventory,
    updatedSlots: newSlots,
  };
}

/**
 * 获取所有可用技能槽位
 */
export function getAvailableSkillSlots(slots: Record<string, string | null>): SlotId[] {
  return Object.keys(slots).filter(k => k.startsWith('skill_'));
}

/**
 * 获取指定父槽位的已装备技能
 */
export function getEquippedSkillsForSource(
  slots: Record<string, string | null>,
  parentSlotId: SlotId
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [slotId, itemId] of Object.entries(slots)) {
    if (slotId.startsWith(`skill_${parentSlotId}_`)) {
      result[slotId] = itemId;
    }
  }
  return result;
}
