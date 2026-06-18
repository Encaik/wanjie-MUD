/**
 * 消耗品模板 — 丹药和卷轴
 */

import type { ConsumableTemplate } from '../../types';

/** 回春丹 — 恢复生命值 */
export const REJUVENATION_PILL: ConsumableTemplate = {
  templateId: 'wanjie:common:rejuvenation_pill',
  name: '回春丹',
  description: '基础疗伤丹药，服用后恢复少量生命值。',
  category: 'consumable',
  subcategory: 'pill_hp',
  rarity: 'common',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { hpRestore: 50 },
  price: 50,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'heal', baseValue: 50, statScaling: 0, target: 'self' }],
    requiredLevel: 1,
  },
};

/** 疗伤丹 — 中量恢复生命值 */
export const HEALING_PILL: ConsumableTemplate = {
  templateId: 'wanjie:common:healing_pill',
  name: '疗伤丹',
  description: '中级疗伤丹药，服用后恢复中等量生命值。',
  category: 'consumable',
  subcategory: 'pill_hp',
  rarity: 'uncommon',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { hpRestore: 150 },
  price: 200,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'heal', baseValue: 150, statScaling: 0, target: 'self' }],
    requiredLevel: 5,
  },
};

/** 九转还魂丹 — 大量恢复生命值 */
export const SOUL_RESTORATION_PILL: ConsumableTemplate = {
  templateId: 'wanjie:common:soul_restoration_pill',
  name: '九转还魂丹',
  description: '传说中的顶级疗伤丹药，服用后可起死回生，恢复大量生命值。',
  category: 'consumable',
  subcategory: 'pill_hp',
  rarity: 'epic',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { hpRestore: 500 },
  price: 2000,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'heal', baseValue: 500, statScaling: 0, target: 'self' }],
    requiredLevel: 20,
  },
};

/** 聚神丹 — 恢复法力值 */
export const MANA_RESTORATION_PILL: ConsumableTemplate = {
  templateId: 'wanjie:common:mana_restoration_pill',
  name: '聚神丹',
  description: '基础回蓝丹药，服用后恢复少量法力值。',
  category: 'consumable',
  subcategory: 'pill_mp',
  rarity: 'common',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { mpRestore: 30 },
  price: 50,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'heal', baseValue: 30, statScaling: 0, target: 'self', description: '恢复法力值' }],
    requiredLevel: 1,
  },
};

/** 回元丹 — 中量恢复法力值 */
export const MANA_HEALING_PILL: ConsumableTemplate = {
  templateId: 'wanjie:common:mana_healing_pill',
  name: '回元丹',
  description: '中级回蓝丹药，服用后恢复中等量法力值。',
  category: 'consumable',
  subcategory: 'pill_mp',
  rarity: 'uncommon',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { mpRestore: 100 },
  price: 200,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'heal', baseValue: 100, statScaling: 0, target: 'self', description: '恢复法力值' }],
    requiredLevel: 5,
  },
};

/** 所有通用消耗品模板（修仙专属丹药已迁移至 wanjie-core mod 的 data/items/cultivation.json） */

export const CONSUMABLE_TEMPLATES: ConsumableTemplate[] = [
  REJUVENATION_PILL,
  HEALING_PILL,
  SOUL_RESTORATION_PILL,
  MANA_RESTORATION_PILL,
  MANA_HEALING_PILL,
];
