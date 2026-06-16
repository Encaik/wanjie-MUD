/**
 * 材料模板 — 草药、矿石、宝石、妖兽材料、经验材料
 */

import type { MaterialTemplate } from '../../types';

/** 灵草 — 基础炼丹材料 */
export const SPIRIT_HERB: MaterialTemplate = {
  templateId: 'spirit_herb',
  name: '灵草',
  description: '蕴含微弱灵气的草药，炼丹的基础材料。',
  category: 'material',
  subcategory: 'herb',
  rarity: 'common',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 10,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 千年灵芝 — 稀有炼丹材料 */
export const THOUSAND_YEAR_LINGZHI: MaterialTemplate = {
  templateId: 'thousand_year_lingzhi',
  name: '千年灵芝',
  description: '生长千年的灵芝，蕴含浓郁灵气，是炼制高级丹药的珍贵材料。',
  category: 'material',
  subcategory: 'herb',
  rarity: 'rare',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 500,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 万年雪莲 — 传说炼丹材料 */
export const TEN_THOUSAND_YEAR_LOTUS: MaterialTemplate = {
  templateId: 'ten_thousand_year_lotus',
  name: '万年雪莲',
  description: '生长于极寒之地的万年雪莲，蕴含天地至寒精华。',
  category: 'material',
  subcategory: 'herb',
  rarity: 'legendary',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 5000,
  element: 'ice',
  isDroppable: true,
  ext: {},
};

/** 铁矿石 — 基础炼器材料 */
export const IRON_ORE: MaterialTemplate = {
  templateId: 'iron_ore',
  name: '铁矿石',
  description: '普通的铁矿石，可提炼用于打造基础装备。',
  category: 'material',
  subcategory: 'ore',
  rarity: 'common',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 15,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 玄铁 — 稀有炼器材料 */
export const BLACK_IRON: MaterialTemplate = {
  templateId: 'black_iron',
  name: '玄铁',
  description: '天外陨铁，坚不可摧，是打造高级装备的上乘材料。',
  category: 'material',
  subcategory: 'ore',
  rarity: 'rare',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 800,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 灵石碎片 — 宝石材料 */
export const SPIRIT_GEM: MaterialTemplate = {
  templateId: 'spirit_gem',
  name: '灵石碎片',
  description: '灵石的天然碎片，晶莹剔透，可用于镶嵌或炼制。',
  category: 'material',
  subcategory: 'gem',
  rarity: 'uncommon',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 100,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 龙晶 — 传说宝石 */
export const DRAGON_CRYSTAL: MaterialTemplate = {
  templateId: 'dragon_crystal',
  name: '龙晶',
  description: '真龙陨落后凝结的晶核，蕴含龙之精华，镶嵌于装备可获得强大力量。',
  category: 'material',
  subcategory: 'gem',
  rarity: 'legendary',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 10000,
  element: 'fire',
  isDroppable: true,
  ext: {},
};

/** 妖兽利爪 — 妖兽材料 */
export const BEAST_CLAW: MaterialTemplate = {
  templateId: 'beast_claw',
  name: '妖兽利爪',
  description: '从妖兽身上取下的利爪，锋利异常，可用于炼器。',
  category: 'material',
  subcategory: 'beast_part',
  rarity: 'uncommon',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 80,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 妖丹 — 稀有妖兽材料 */
export const DEMON_CORE: MaterialTemplate = {
  templateId: 'demon_core',
  name: '妖丹',
  description: '妖兽修炼所凝聚的内丹，蕴含妖力精华。炼丹和炼器的高级材料。',
  category: 'material',
  subcategory: 'beast_part',
  rarity: 'epic',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 3000,
  element: null,
  isDroppable: true,
  ext: {},
};

/** 经验石 — 装备/功法升级材料 */
export const EXP_STONE_SMALL: MaterialTemplate = {
  templateId: 'exp_stone_small',
  name: '小经验石',
  description: '蕴含少量经验的灵石，用于提升装备和功法等级。',
  category: 'material',
  subcategory: 'exp_fodder',
  rarity: 'common',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 20,
  element: null,
  isDroppable: true,
  ext: {
    expValue: 50,
    applicableCategory: 'equipment',
  },
};

/** 经验石 — 装备/功法升级材料 */
export const EXP_STONE_MEDIUM: MaterialTemplate = {
  templateId: 'exp_stone_medium',
  name: '经验石',
  description: '蕴含中等经验的灵石，用于提升装备和功法等级。',
  category: 'material',
  subcategory: 'exp_fodder',
  rarity: 'uncommon',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 100,
  element: null,
  isDroppable: true,
  ext: {
    expValue: 200,
    applicableCategory: 'equipment',
  },
};

/** 大经验石 */
export const EXP_STONE_LARGE: MaterialTemplate = {
  templateId: 'exp_stone_large',
  name: '大经验石',
  description: '蕴含大量经验的灵石，用于快速提升装备和功法等级。',
  category: 'material',
  subcategory: 'exp_fodder',
  rarity: 'rare',
  maxStack: 999,
  maxLevel: 1,
  baseStats: {},
  price: 500,
  element: null,
  isDroppable: true,
  ext: {
    expValue: 800,
    applicableCategory: 'equipment',
  },
};

/** 所有材料模板 */
export const MATERIAL_TEMPLATES: MaterialTemplate[] = [
  SPIRIT_HERB,
  THOUSAND_YEAR_LINGZHI,
  TEN_THOUSAND_YEAR_LOTUS,
  IRON_ORE,
  BLACK_IRON,
  SPIRIT_GEM,
  DRAGON_CRYSTAL,
  BEAST_CLAW,
  DEMON_CORE,
  EXP_STONE_SMALL,
  EXP_STONE_MEDIUM,
  EXP_STONE_LARGE,
];
