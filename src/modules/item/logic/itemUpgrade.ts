/**
 * 物品升级系统 — 消耗材料→exp→升级→解锁槽位
 *
 * 所有函数为纯函数。
 */

import type { ItemInstance, Rarity } from '../types';
import { getTemplate } from '../data/index';
import { getRarityConfig } from '../data/rarity';
import { findItemByInstance, removeItem } from './itemManager';

/**
 * 计算当前等级升级所需经验
 */
export function calculateUpgradeExp(level: number, rarity: Rarity): number {
  const config = getRarityConfig(rarity);
  return Math.round(100 * config.expMultiplier * Math.pow(1.5, level - 1));
}

/**
 * 计算指定等级的物品属性
 */
export function getStatsAtLevel(
  templateId: string,
  level: number
): Record<string, number> {
  const template = getTemplate(templateId);
  const rarityConfig = getRarityConfig(template.rarity);
  const mult = rarityConfig.statMultiplier * (1 + (level - 1) * 0.15);

  const stats: Record<string, number> = {};
  for (const [key, value] of Object.entries(template.baseStats)) {
    stats[key] = Math.round(value * mult);
  }
  return stats;
}

/**
 * 消耗材料升级物品
 *
 * @param inventory - 当前背包
 * @param instanceId - 要升级的物品实例 ID
 * @param materials - 消耗的材料 [{ templateId, quantity }]
 * @returns 包含更新后背包和升级后物品的结果
 */
export function upgradeItem(
  inventory: ItemInstance[],
  instanceId: string,
  materials: { templateId: string; quantity: number }[]
): {
  inventory: ItemInstance[];
  upgradedItem: ItemInstance;
  leveledUp: boolean;
  newSkillsUnlocked: number;
} {
  const itemIndex = inventory.findIndex(i => i.instanceId === instanceId);
  if (itemIndex === -1) {
    throw new Error(`物品不存在: ${instanceId}`);
  }

  const item = inventory[itemIndex];
  const template = getTemplate(item.templateId);

  if (item.level >= template.maxLevel) {
    throw new Error(`物品已满级 (${template.maxLevel})`);
  }

  // 验证并消耗材料
  let newInventory = inventory.map(i => ({ ...i, equippedSkills: { ...i.equippedSkills } }));
  let totalExp = 0;

  for (const mat of materials) {
    const matTemplate = getTemplate(mat.templateId);
    const expValue = (matTemplate.ext as { expValue?: number }).expValue ?? 0;
    if (expValue <= 0) {
      throw new Error(`"${matTemplate.name}" 不是经验材料`);
    }

    // 检查是否有足够的材料
    const available = newInventory
      .filter(i => i.templateId === mat.templateId && !i.equipped)
      .reduce((s, i) => s + i.quantity, 0);
    if (available < mat.quantity) {
      throw new Error(`材料不足：需要 ${mat.quantity} 个 ${matTemplate.name}，当前有 ${available} 个`);
    }

    // 消耗材料
    let remaining = mat.quantity;
    for (let i = newInventory.length - 1; i >= 0 && remaining > 0; i--) {
      if (newInventory[i].templateId === mat.templateId && !newInventory[i].equipped) {
        const toRemove = Math.min(newInventory[i].quantity, remaining);
        remaining -= toRemove;
        if (newInventory[i].quantity <= toRemove) {
          newInventory.splice(i, 1);
        } else {
          newInventory[i] = { ...newInventory[i], quantity: newInventory[i].quantity - toRemove, equippedSkills: { ...newInventory[i].equippedSkills } };
        }
      }
    }

    totalExp += expValue * mat.quantity;
  }

  // 升级逻辑
  let updatedItem = { ...item, equippedSkills: { ...item.equippedSkills } };
  let leveledUp = false;
  let newSkillsUnlocked = 0;

  updatedItem.exp += totalExp;
  const rarityConfig = getRarityConfig(template.rarity);

  while (updatedItem.level < template.maxLevel) {
    const expNeeded = calculateUpgradeExp(updatedItem.level, template.rarity);
    if (updatedItem.exp >= expNeeded) {
      updatedItem.exp -= expNeeded;
      updatedItem.level += 1;
      leveledUp = true;

      // 检查是否解锁新技能槽
      const prevSlots = getUnlockedSkillSlots(updatedItem.level - 1, template.maxLevel, rarityConfig.skillSlots);
      const newSlots = getUnlockedSkillSlots(updatedItem.level, template.maxLevel, rarityConfig.skillSlots);
      newSkillsUnlocked += Math.max(0, newSlots - prevSlots);
    } else {
      break;
    }
  }

  // 钳制到满级
  if (updatedItem.level >= template.maxLevel) {
    updatedItem.exp = 0;
  }

  newInventory[newInventory.findIndex(i => i.instanceId === instanceId)] = updatedItem;

  return { inventory: newInventory, upgradedItem: updatedItem, leveledUp, newSkillsUnlocked };
}

/**
 * 获取当前等级已解锁的技能槽位数
 */
function getUnlockedSkillSlots(level: number, maxLevel: number, totalSlots: number): number {
  if (totalSlots === 0) return 0;
  const slotsPerLevel = totalSlots / maxLevel;
  return Math.min(totalSlots, Math.floor(level * slotsPerLevel));
}
