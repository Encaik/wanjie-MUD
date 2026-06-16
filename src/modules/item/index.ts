/**
 * modules/item — 统一物品系统
 *
 * 所有可拥有、可使用、可装备、可消耗、可升级的实体统一为 Item 类型。
 * 替代旧的 modules/economy/、modules/equipment/、modules/techniques/、modules/crafting/。
 */

// 类型
export type {
  // 基础
  Rarity,
  ItemCategory,
  EquipmentSubcategory,
  TechniqueSubcategory,
  SkillSubcategory,
  SkillTag,
  // 技能效果
  SkillEffect,
  // 词缀
  ItemAffix,
  // 槽位
  SlotId,
  SlotDefinition,
  UnlockCondition,
  // 模板
  ItemTemplate,
  CurrencyTemplate,
  ConsumableTemplate,
  MaterialTemplate,
  EquipmentTemplate,
  TechniqueTemplate,
  SkillTemplate,
  FragmentTemplate,
  // 实例
  ItemInstance,
  // 结果
  EquipResult,
  ItemActionResult,
  // 解析
  ResolvedItem,
} from './types';

// 数据
export {
  ALL_TEMPLATES,
  TEMPLATE_MAP,
  getTemplate,
  getTemplatesByCategory,
  getTemplatesByWorldView,
} from './data';

export {
  RARITY_CONFIG,
  ALL_RARITIES,
  RARITY_ORDER,
  getRarityConfig,
} from './data/rarity';

export {
  SLOT_DEFINITIONS,
  FIXED_SLOT_IDS,
  createEmptySlots,
} from './data/slots';

// 逻辑
export {
  createItemInstance,
  addItem,
  removeItem,
  getItemCount,
  getCurrencyAmount,
  hasEnough,
  findItemsByTemplate,
  findItemByInstance,
  resolveItem,
  equipItem,
  unequipItem,
  equipSkill,
  unequipSkill,
  generateItemInstance,
  generateRandomDrop,
  upgradeItem,
  fragmentItem,
  synthesizeFragments,
  useConsumable,
} from './logic';

// 事件
export type {
  ItemEvent,
  ItemObtainedEvent,
  ItemUsedEvent,
  ItemEquippedEvent,
  ItemUnequippedEvent,
  ItemUpgradedEvent,
  ItemFragmentedEvent,
  ItemSynthesizedEvent,
} from './events';

// Hooks
export {
  useInventory,
  useEquipment,
  useTechniques,
  useSkills,
  useCrafting,
} from './hooks';

// 组件
export {
  ItemTooltip,
  InventoryPanel,
} from './components';
