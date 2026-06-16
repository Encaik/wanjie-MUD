/**
 * 消耗品模板 — 丹药和卷轴
 */

import type { ConsumableTemplate } from '../../types';

/** 回春丹 — 恢复生命值 */
export const REJUVENATION_PILL: ConsumableTemplate = {
  templateId: 'rejuvenation_pill',
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
  templateId: 'healing_pill',
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
  templateId: 'soul_restoration_pill',
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
  templateId: 'mana_restoration_pill',
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
  templateId: 'mana_healing_pill',
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

/** 聚气丹 — 修炼加速 */
export const QI_GATHERING_PILL: ConsumableTemplate = {
  templateId: 'qi_gathering_pill',
  name: '聚气丹',
  description: '服用后加速灵气吸收，修炼效率提升 50%，持续 30 分钟。',
  category: 'consumable',
  subcategory: 'pill_cultivation',
  rarity: 'uncommon',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { cultivationBoost: 50 },
  price: 300,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'buff', baseValue: 50, statScaling: 0, target: 'self', duration: 30, description: '修炼效率+50%' }],
    requiredLevel: 3,
  },
};

/** 凝元丹 — 修炼大幅加速 */
export const ESSENCE_CONDENSING_PILL: ConsumableTemplate = {
  templateId: 'essence_condensing_pill',
  name: '凝元丹',
  description: '服用后灵气凝聚加速，修炼效率提升 100%，持续 30 分钟。',
  category: 'consumable',
  subcategory: 'pill_cultivation',
  rarity: 'rare',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { cultivationBoost: 100 },
  price: 800,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'buff', baseValue: 100, statScaling: 0, target: 'self', duration: 30, description: '修炼效率+100%' }],
    requiredLevel: 10,
  },
};

/** 筑基丹 — 突破辅助 */
export const FOUNDATION_PILL: ConsumableTemplate = {
  templateId: 'foundation_pill',
  name: '筑基丹',
  description: '辅助修士突破筑基境界的关键丹药，提升突破成功率 20%。',
  category: 'consumable',
  subcategory: 'pill_breakthrough',
  rarity: 'rare',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { breakthroughBoost: 20 },
  price: 500,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'buff', baseValue: 20, statScaling: 0, target: 'self', duration: 1, description: '突破成功率+20%' }],
    requiredLevel: 5,
    requiredRealm: 1,
  },
};

/** 结金丹 — 突破辅助 */
export const GOLDEN_CORE_PILL: ConsumableTemplate = {
  templateId: 'golden_core_pill',
  name: '结金丹',
  description: '辅助修士凝结金丹的关键丹药，提升突破成功率 25%。',
  category: 'consumable',
  subcategory: 'pill_breakthrough',
  rarity: 'epic',
  maxStack: 99,
  maxLevel: 1,
  baseStats: { breakthroughBoost: 25 },
  price: 1500,
  element: null,
  isDroppable: true,
  ext: {
    effects: [{ type: 'buff', baseValue: 25, statScaling: 0, target: 'self', duration: 1, description: '突破成功率+25%' }],
    requiredLevel: 15,
    requiredRealm: 3,
  },
};

/** 洗髓丹 — 属性重置 */
export const MARROW_WASHING_PILL: ConsumableTemplate = {
  templateId: 'marrow_washing_pill',
  name: '洗髓丹',
  description: '洗经伐髓的珍稀丹药，服用后可重置已分配的属性点。',
  category: 'consumable',
  subcategory: 'pill_stat',
  rarity: 'legendary',
  maxStack: 10,
  maxLevel: 1,
  baseStats: {},
  price: 5000,
  element: null,
  isDroppable: false,
  ext: {
    effects: [{ type: 'special', baseValue: 1, statScaling: 0, target: 'self', description: '重置属性点' }],
    requiredLevel: 20,
  },
};

/** 仙灵丹 — 永久属性提升 */
export const IMMORTAL_SPIRIT_PILL: ConsumableTemplate = {
  templateId: 'immortal_spirit_pill',
  name: '仙灵丹',
  description: '蕴含仙灵之力的神药，服用后永久提升各项属性 +1。',
  category: 'consumable',
  subcategory: 'pill_stat',
  rarity: 'mythic',
  maxStack: 10,
  maxLevel: 1,
  baseStats: {},
  price: 50000,
  element: null,
  isDroppable: false,
  ext: {
    effects: [{ type: 'buff', baseValue: 1, statScaling: 0, target: 'self', duration: -1, description: '全属性+1（永久）' }],
    requiredLevel: 30,
  },
};

/** 所有消耗品模板 */
export const CONSUMABLE_TEMPLATES: ConsumableTemplate[] = [
  REJUVENATION_PILL,
  HEALING_PILL,
  SOUL_RESTORATION_PILL,
  MANA_RESTORATION_PILL,
  MANA_HEALING_PILL,
  QI_GATHERING_PILL,
  ESSENCE_CONDENSING_PILL,
  FOUNDATION_PILL,
  GOLDEN_CORE_PILL,
  MARROW_WASHING_PILL,
  IMMORTAL_SPIRIT_PILL,
];
