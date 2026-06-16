/**
 * modules/item/logic — 统一物品操作纯函数
 */

// 物品管理器
export {
  generateInstanceId,
  createItemInstance,
  addItem,
  removeItem,
  splitStack,
  mergeStacks,
  getItemsByCategory,
  getItemCount,
  getCurrencyAmount,
  hasEnough,
  findItemsByTemplate,
  findItemByInstance,
  resolveItem,
} from './itemManager';

// 槽位系统
export {
  validateEquip,
  isSlotCompatible,
  createDynamicSkillSlots,
  syncSkillSlots,
  equipItem,
  unequipItem,
} from './slotSystem';

// 技能系统
export {
  validateSkillEquip,
  equipSkill,
  unequipSkill,
  getAvailableSkillSlots,
  getEquippedSkillsForSource,
} from './skillSystem';

// 物品生成
export {
  generateItemInstance,
  generateRandomDrop,
  rollRarity,
  rollAffixes,
} from './itemGenerator';

// 物品升级
export {
  calculateUpgradeExp,
  getStatsAtLevel,
  upgradeItem,
} from './itemUpgrade';

// 碎片系统
export {
  fragmentItem,
  synthesizeFragments,
} from './itemFragment';

// 消耗品
export {
  useConsumable,
} from './itemUse';

// 便捷访问器
export {
  getEquippedResolved,
  getAllEquipped,
  getEquippedTechniques,
  getEquippedEquipments,
  getItemsByCategoryResolved,
  getCurrency,
  getSpiritStones,
  hasEquipped,
  getMeleeWeapon,
  getRangedWeapon,
} from './protagonistUtils';

export type { UseConsumableResult } from './itemUse';
