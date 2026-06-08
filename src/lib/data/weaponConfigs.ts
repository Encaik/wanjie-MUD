/**
 * 武器/装备配置管理器
 * 
 * 统一管理所有装备的配置数据：
 * - 名称库（按槽位和稀有度）
 * - 描述模板
 * - 数值范围
 * - 稀有度配置
 */

import { Element, WeaponCategory } from '../game/restraintSystem';
import { EQUIPMENT_RARITY_CONFIG, RARITY_WEIGHTS } from '../game/skillTypes';
import { EquipmentSlot, ItemRarity } from '../game/types';

// ============================================
// 装备名称库
// ============================================

/** 近战武器名称 */
export const MELEE_WEAPON_NAMES: Record<ItemRarity, string[]> = {
  '普通': [
    '铁剑', '木剑', '石剑', '铜剑', '铁刀', '木刀', '石刀', '铜刀',
    '铁拳套', '木拳套', '铁枪', '木枪', '铁棍', '木棍', '铁鞭', '铜鞭',
  ],
  '稀有': [
    '精钢剑', '玄铁剑', '赤铜剑', '寒铁剑', '精钢刀', '玄铁刀', '赤铜刀', '寒铁刀',
    '精钢拳套', '玄铁拳套', '精钢枪', '玄铁枪', '寒冰剑', '烈焰刀', '雷霆枪', '疾风棍',
  ],
  '史诗': [
    '龙鳞剑', '凤羽剑', '天雷剑', '烈焰剑', '龙鳞刀', '凤羽刀', '天雷刀', '烈焰刀',
    '龙鳞拳套', '凤羽拳套', '龙鳞枪', '凤羽枪', '紫电剑', '青霜刀', '天风枪', '幽冥棍',
  ],
  '传说': [
    '天外陨铁剑', '神龙剑', '圣光剑', '暗影剑', '天外陨铁刀', '神龙刀', '圣光刀', '暗影刀',
    '天外陨铁拳套', '神龙拳套', '天外陨铁枪', '神龙枪', '星辰剑', '月华刀', '烈阳枪', '玄冥棍',
  ],
  '神话': [
    '创世神剑', '混沌之剑', '永恒之剑', '天地剑', '创世神刀', '混沌之刀', '永恒之刀', '天地刀',
    '创世神拳套', '混沌拳套', '创世神枪', '混沌之枪', '大道之剑', '天道之刀', '轮回之枪', '造化之棍',
  ],
};

/** 远程武器名称 */
export const RANGED_WEAPON_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['木弓', '短弓', '猎弓', '长弓', '竹弓', '铁弓'],
  '稀有': ['精钢弓', '玄铁弓', '赤铜弓', '寒铁弓', '烈风弓', '寒冰弓'],
  '史诗': ['龙骨弓', '凤羽弓', '天雷弓', '烈焰弓', '紫电弓', '青霜弓'],
  '传说': ['天外陨铁弓', '神龙弓', '圣光弓', '暗影弓', '星辰弓', '月华弓'],
  '神话': ['创世神弓', '混沌之弓', '永恒之弓', '天地弓', '大道之弓', '天道之弓'],
};

/** 头部防具名称 */
export const HEAD_ARMOR_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['布帽', '皮帽', '铁盔', '铜盔', '草帽', '麻帽'],
  '稀有': ['精钢盔', '玄铁盔', '赤铜盔', '寒铁盔', '银盔', '金盔'],
  '史诗': ['龙鳞盔', '凤羽盔', '天雷盔', '烈焰盔', '紫电盔', '青霜盔'],
  '传说': ['天外陨铁盔', '神龙盔', '圣光盔', '暗影盔', '星辰盔', '月华盔'],
  '神话': ['创世神盔', '混沌之盔', '永恒之盔', '天地盔', '大道之盔', '天道之盔'],
};

/** 身体防具名称 */
export const BODY_ARMOR_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['布衣', '皮甲', '铁甲', '铜甲', '麻衣', '草衣'],
  '稀有': ['精钢甲', '玄铁甲', '赤铜甲', '寒铁甲', '银甲', '金甲'],
  '史诗': ['龙鳞甲', '凤羽甲', '天雷甲', '烈焰甲', '紫电甲', '青霜甲'],
  '传说': ['天外陨铁甲', '神龙甲', '圣光甲', '暗影甲', '星辰甲', '月华甲'],
  '神话': ['创世神甲', '混沌之甲', '永恒之甲', '天地甲', '大道之甲', '天道之甲'],
};

/** 腿部防具名称 */
export const LEGS_ARMOR_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['布裤', '皮裤', '铁裤', '铜裤', '麻裤', '草裤'],
  '稀有': ['精钢裤', '玄铁裤', '赤铜裤', '寒铁裤', '银裤', '金裤'],
  '史诗': ['龙鳞裤', '凤羽裤', '天雷裤', '烈焰裤', '紫电裤', '青霜裤'],
  '传说': ['天外陨铁裤', '神龙裤', '圣光裤', '暗影裤', '星辰裤', '月华裤'],
  '神话': ['创世神裤', '混沌之裤', '永恒之裤', '天地裤', '大道之裤', '天道之裤'],
};

/** 脚部防具名称 */
export const FEET_ARMOR_NAMES: Record<ItemRarity, string[]> = {
  '普通': ['布鞋', '皮靴', '铁靴', '铜靴', '麻鞋', '草鞋'],
  '稀有': ['精钢靴', '玄铁靴', '赤铜靴', '寒铁靴', '银靴', '金靴'],
  '史诗': ['龙鳞靴', '凤羽靴', '天雷靴', '烈焰靴', '紫电靴', '青霜靴'],
  '传说': ['天外陨铁靴', '神龙靴', '圣光靴', '暗影靴', '星辰靴', '月华靴'],
  '神话': ['创世神靴', '混沌之靴', '永恒之靴', '天地靴', '大道之靴', '天道之靴'],
};

/** 装备名称库映射 */
export const EQUIPMENT_NAMES: Record<EquipmentSlot, Record<ItemRarity, string[]>> = {
  melee: MELEE_WEAPON_NAMES,
  ranged: RANGED_WEAPON_NAMES,
  head: HEAD_ARMOR_NAMES,
  body: BODY_ARMOR_NAMES,
  legs: LEGS_ARMOR_NAMES,
  feet: FEET_ARMOR_NAMES,
};

// ============================================
// 武器类别关键词
// ============================================

/** 剑类关键词 */
export const SWORD_KEYWORDS = ['剑', '刀'];

/** 刀类关键词 */
export const BLADE_KEYWORDS = ['刀'];

/** 拳类关键词 */
export const FIST_KEYWORDS = ['拳', '爪', '手', '掌'];

/** 弓类关键词 */
export const BOW_KEYWORDS = ['弓'];

/** 枪类关键词 */
export const SPEAR_KEYWORDS = ['枪', '矛'];

/** 从名称检测武器类别（内部使用，避免与 skillConfigs 冲突） */
function internalDetectWeaponCategoryFromName(name: string): WeaponCategory | null {
  if (SPEAR_KEYWORDS.some(k => name.includes(k))) return 'spear';
  if (BOW_KEYWORDS.some(k => name.includes(k))) return 'bow';
  if (FIST_KEYWORDS.some(k => name.includes(k))) return 'fist';
  if (BLADE_KEYWORDS.some(k => name.includes(k))) return 'blade';
  if (name.includes('剑')) return 'sword';
  return null;
}

/** 从名称检测元素属性（内部使用） */
function internalDetectElementFromEquipmentName(name: string): Element | null {
  if (FIRE_KEYWORDS.some(k => name.includes(k))) return 'fire';
  if (ICE_KEYWORDS.some(k => name.includes(k))) return 'ice';
  if (THUNDER_KEYWORDS.some(k => name.includes(k))) return 'thunder';
  if (WIND_KEYWORDS.some(k => name.includes(k))) return 'wind';
  if (EARTH_KEYWORDS.some(k => name.includes(k))) return 'earth';
  if (LIGHT_KEYWORDS.some(k => name.includes(k))) return 'light';
  if (DARK_KEYWORDS.some(k => name.includes(k))) return 'dark';
  return null;
}

// ============================================
// 元素关键词
// ============================================

/** 火焰关键词 */
export const FIRE_KEYWORDS = ['火', '烈焰', '烈', '焚'];

/** 冰霜关键词 */
export const ICE_KEYWORDS = ['冰', '寒', '霜', '雪'];

/** 雷霆关键词 */
export const THUNDER_KEYWORDS = ['雷', '电', '霆', '闪'];

/** 疾风关键词 */
export const WIND_KEYWORDS = ['风', '疾', '快', '旋'];

/** 大地关键词 */
export const EARTH_KEYWORDS = ['土', '地', '岩', '石'];

/** 光明关键词 */
export const LIGHT_KEYWORDS = ['光', '圣', '阳', '明'];

/** 黑暗关键词 */
export const DARK_KEYWORDS = ['暗', '冥', '幽', '鬼', '魔'];

/** 从名称检测元素属性 */
export function detectElementFromEquipmentName(name: string): Element | null {
  if (FIRE_KEYWORDS.some(k => name.includes(k))) return 'fire';
  if (ICE_KEYWORDS.some(k => name.includes(k))) return 'ice';
  if (THUNDER_KEYWORDS.some(k => name.includes(k))) return 'thunder';
  if (WIND_KEYWORDS.some(k => name.includes(k))) return 'wind';
  if (EARTH_KEYWORDS.some(k => name.includes(k))) return 'earth';
  if (LIGHT_KEYWORDS.some(k => name.includes(k))) return 'light';
  if (DARK_KEYWORDS.some(k => name.includes(k))) return 'dark';
  return null;
}

// ============================================
// 装备数值范围
// ============================================

/** 攻击加成范围 */
export const ATTACK_BONUS_RANGE: Record<ItemRarity, [number, number]> = {
  '普通': [5, 15],
  '稀有': [12, 28],
  '史诗': [25, 45],
  '传说': [40, 70],
  '神话': [60, 100],
};

/** 防御加成范围 */
export const DEFENSE_BONUS_RANGE: Record<ItemRarity, [number, number]> = {
  '普通': [5, 15],
  '稀有': [12, 28],
  '史诗': [25, 45],
  '传说': [40, 70],
  '神话': [60, 100],
};

/** 威力值范围 */
export const EQUIPMENT_POWER_RANGE: Record<ItemRarity, [number, number]> = {
  '普通': [10, 30],
  '稀有': [25, 50],
  '史诗': [45, 80],
  '传说': [70, 120],
  '神话': [100, 150],
};

// ============================================
// 装备掉落权重
// ============================================

/** 装备掉落权重 */
export const EQUIPMENT_DROP_WEIGHTS: Record<ItemRarity, number> = {
  '普通': 45,
  '稀有': 30,
  '史诗': 15,
  '传说': 8,
  '神话': 2,
};

// ============================================
// 装备定价范围
// ============================================

/** 武器定价范围 */
export const WEAPON_PRICE_RANGE: Record<ItemRarity, [number, number]> = {
  '普通': [200, 800],
  '稀有': [800, 3000],
  '史诗': [3000, 10000],
  '传说': [10000, 40000],
  '神话': [40000, 150000],
};

/** 防具定价范围 */
export const ARMOR_PRICE_RANGE: Record<ItemRarity, [number, number]> = {
  '普通': [100, 400],
  '稀有': [400, 1500],
  '史诗': [1500, 5000],
  '传说': [5000, 20000],
  '神话': [20000, 80000],
};

// ============================================
// 槽位配置
// ============================================

/** 槽位是否影响攻击 */
export const SLOT_AFFECTS_ATTACK: Record<EquipmentSlot, boolean> = {
  melee: true,
  ranged: true,
  head: false,
  body: false,
  legs: false,
  feet: false,
};

/** 槽位是否影响防御 */
export const SLOT_AFFECTS_DEFENSE: Record<EquipmentSlot, boolean> = {
  melee: false,
  ranged: false,
  head: true,
  body: true,
  legs: true,
  feet: true,
};

// ============================================
// 工具函数
// ============================================

/** 获取指定槽位和稀有度的名称列表 */
export function getEquipmentNamesBySlotAndRarity(
  slot: EquipmentSlot,
  rarity: ItemRarity
): string[] {
  return EQUIPMENT_NAMES[slot]?.[rarity] || [];
}

/** 获取指定槽位的所有名称 */
export function getAllEquipmentNamesBySlot(slot: EquipmentSlot): string[] {
  return Object.values(EQUIPMENT_NAMES[slot] || {}).flat();
}

/** 是否为武器槽位 */
export function isWeaponSlot(slot: EquipmentSlot): boolean {
  return slot === 'melee' || slot === 'ranged';
}

/** 是否为防具槽位 */
export function isArmorSlot(slot: EquipmentSlot): boolean {
  return !isWeaponSlot(slot);
}

/** 获取装备定价 */
export function getEquipmentPrice(
  slot: EquipmentSlot,
  rarity: ItemRarity,
  level: number = 1
): number {
  const range = isWeaponSlot(slot) ? WEAPON_PRICE_RANGE : ARMOR_PRICE_RANGE;
  const [min, max] = range[rarity];
  const basePrice = min + Math.floor((max - min) * Math.random());
  return Math.floor(basePrice * (1 + level * 0.1));
}
