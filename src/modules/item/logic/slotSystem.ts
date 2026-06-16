/**
 * 统一槽位系统 — 装备/卸下 + 动态技能槽管理
 *
 * 所有函数为纯函数。
 */

import type { ItemInstance, SlotId, EquipResult } from '../types';
import type { SlotDefinition } from '../types';
import { getTemplate } from '../data/index';
import { getSlotDefinition, SLOT_DEFINITIONS, createEmptySlots } from '../data/slots';
import { findItemByInstance, createItemInstance } from './itemManager';

// ══════════════════════════════════════════════════════════════════
// 验证
// ══════════════════════════════════════════════════════════════════

/**
 * 验证物品能否装备到指定槽位
 */
export function validateEquip(
  instance: ItemInstance,
  slotDef: SlotDefinition
): { valid: boolean; error?: string } {
  if (!instance) return { valid: false, error: '物品不存在' };

  const template = getTemplate(instance.templateId);

  if (template.category !== slotDef.acceptedCategory) {
    return { valid: false, error: `物品类型不匹配：${template.category} 无法装备到 ${slotDef.displayName}` };
  }

  if (slotDef.acceptedSubcategory && template.subcategory !== slotDef.acceptedSubcategory) {
    return { valid: false, error: `物品子类型不匹配：需要 ${slotDef.acceptedSubcategory}` };
  }

  if (instance.isFragment) {
    return { valid: false, error: '碎片无法装备' };
  }

  if (instance.equipped) {
    return { valid: false, error: '物品已在其他槽位装备中' };
  }

  return { valid: true };
}

/**
 * 检查槽位兼容性
 */
export function isSlotCompatible(instance: ItemInstance, slotId: SlotId): boolean {
  const slotDef = getSlotDefinition(slotId);
  if (!slotDef) return false;
  return validateEquip(instance, slotDef).valid;
}

// ══════════════════════════════════════════════════════════════════
// 动态技能槽位
// ══════════════════════════════════════════════════════════════════

/**
 * 根据装备的物品创建动态技能槽位
 *
 * @param templateId - 装备的物品模板 ID
 * @param parentSlotId - 父槽位 ID
 * @returns 技能槽位定义数组
 */
export function createDynamicSkillSlots(
  templateId: string,
  parentSlotId: string
): SlotDefinition[] {
  const template = getTemplate(templateId);

  // 只有装备和功法提供技能槽位
  if (template.category !== 'equipment' && template.category !== 'technique') {
    return [];
  }

  const slotCount = (template.ext as { providesSkillSlots?: number }).providesSkillSlots ?? 0;
  const acceptedSkillTag = (template.ext as { acceptedSkillTag?: string }).acceptedSkillTag;

  if (slotCount <= 0 || !acceptedSkillTag) return [];

  const slots: SlotDefinition[] = [];
  for (let i = 0; i < slotCount; i++) {
    slots.push({
      slotId: `skill_${parentSlotId}_${i}`,
      displayName: `${template.name} 技能槽${i + 1}`,
      category: 'skill',
      acceptedCategory: 'skill',
      acceptedSkillTag: acceptedSkillTag as import('../types').SkillTag,
      isDynamic: true,
      parentSlotId,
    });
  }

  return slots;
}

/**
 * 同步动态技能槽位（装备/卸下物品时调用）
 *
 * 装备物品时创建技能槽，卸下物品时清理技能槽。
 *
 * @param inventory - 当前背包（用于清理时卸下技能）
 * @param slots - 当前槽位映射
 * @param changedSlotId - 变更的槽位 ID
 * @param oldItemId - 旧物品 ID（卸下时）
 * @param newItemId - 新物品 ID（装备时）
 * @returns 更新后的 { inventory, slots }
 */
export function syncSkillSlots(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  changedSlotId: string,
  oldItemId: string | null,
  newItemId: string | null
): { inventory: ItemInstance[]; slots: Record<string, string | null> } {
  let newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));
  let newSlots = { ...slots };

  // 清理旧物品的动态技能槽位
  if (oldItemId) {
    const oldItem = findItemByInstance(newInventory, oldItemId);
    if (oldItem) {
      // 卸下旧物品的技能槽中的技能
      for (const [skillSlotId, skillInstanceId] of Object.entries(oldItem.equippedSkills)) {
        if (skillInstanceId) {
          const skillItem = findItemByInstance(newInventory, skillInstanceId);
          if (skillItem) {
            newInventory = newInventory.map(i =>
              i.instanceId === skillInstanceId
                ? { ...i, equipped: false, equippedInSlot: null, equippedSkills: { ...i.equippedSkills } }
                : i
            );
          }
          newSlots[skillSlotId] = null;
        }
      }
      // 删除动态槽位
      const dynamicSlotIds = Object.keys(newSlots).filter(k => k.startsWith(`skill_${changedSlotId}_`));
      for (const id of dynamicSlotIds) {
        delete newSlots[id];
      }
      // 更新旧物品状态
      newInventory = newInventory.map(i =>
        i.instanceId === oldItemId
          ? { ...i, equipped: false, equippedInSlot: null, equippedSkills: {} }
          : i
      );
    }
    newSlots[changedSlotId] = null;
  }

  // 为新物品创建动态技能槽位
  if (newItemId) {
    const newItem = findItemByInstance(newInventory, newItemId);
    if (newItem) {
      const dynamicDefs = createDynamicSkillSlots(newItem.templateId, changedSlotId);
      for (const def of dynamicDefs) {
        newSlots[def.slotId] = null;
      }
      // 更新新物品状态
      newInventory = newInventory.map(i =>
        i.instanceId === newItemId
          ? { ...i, equipped: true, equippedInSlot: changedSlotId }
          : i
      );
      newSlots[changedSlotId] = newItemId;
    }
  }

  return { inventory: newInventory, slots: newSlots };
}

// ══════════════════════════════════════════════════════════════════
// 装备/卸下
// ══════════════════════════════════════════════════════════════════

/**
 * 装备物品到指定槽位
 *
 * 如果槽位已被占用，先卸下旧物品再装备新物品。
 *
 * @param inventory - 当前背包
 * @param slots - 当前槽位映射
 * @param instanceId - 要装备的物品实例 ID
 * @param slotId - 目标槽位 ID
 * @returns 包含更新后 inventory 和 slots 的结果
 */
export function equipItem(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  instanceId: string,
  slotId: string
): EquipResult {
  const item = findItemByInstance(inventory, instanceId);
  if (!item) {
    return { success: false, error: '物品不存在' };
  }

  const slotDef = getSlotDefinition(slotId);
  if (!slotDef) {
    return { success: false, error: `槽位 "${slotId}" 不存在` };
  }

  const validation = validateEquip(item, slotDef);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 同步槽位（处理旧物品卸下 + 新物品装备 + 动态技能槽）
  const oldItemId = slots[slotId] || null;
  const { inventory: newInventory, slots: newSlots } = syncSkillSlots(
    inventory,
    slots,
    slotId,
    oldItemId,
    instanceId
  );

  return {
    success: true,
    message: `装备了 ${getTemplate(item.templateId).name}`,
    updatedInventory: newInventory,
    updatedSlots: newSlots,
  };
}

/**
 * 卸下指定槽位的物品
 *
 * @param inventory - 当前背包
 * @param slots - 当前槽位映射
 * @param slotId - 要卸下的槽位 ID
 * @returns 包含更新后 inventory 和 slots 的结果
 */
export function unequipItem(
  inventory: ItemInstance[],
  slots: Record<string, string | null>,
  slotId: string
): EquipResult {
  const equippedItemId = slots[slotId];
  if (!equippedItemId) {
    return { success: false, error: '该槽位没有装备物品' };
  }

  const { inventory: newInventory, slots: newSlots } = syncSkillSlots(
    inventory,
    slots,
    slotId,
    equippedItemId,
    null
  );

  const item = findItemByInstance(inventory, equippedItemId);
  const itemName = item ? getTemplate(item.templateId).name : '物品';

  return {
    success: true,
    message: `卸下了 ${itemName}`,
    updatedInventory: newInventory,
    updatedSlots: newSlots,
  };
}
