/**
 * 稀有度工具函数和常量
 */

import { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
import { TECHNIQUE_RARITY_CONFIG, EQUIPMENT_RARITY_CONFIG } from '@/modules/techniques/logic/skillTypes';
import { ItemRarity, Technique, Equipment, TechniqueType, EquipmentSlot } from '@/shared/lib/types';

/** 稀有度中文名称 */
export const RARITY_NAMES: Record<ItemRarity, string> = {
  '普通': '普通',
  '稀有': '稀有',
  '史诗': '史诗',
  '传说': '传说',
  '神话': '神话',
};

/**
 * 稀有度颜色 — 使用 quality-* 语义化变量
 *
 * 映射关系（对齐 8 级品质色系统）：
 * 神话(传说品质) → mythic(红) | 传说(史诗品质) → legendary(橙)
 * 史诗(稀有品质) → epic(黄) | 稀有(精良品质) → rare(紫)
 * 普通(优秀品质) → common(绿)
 */
export const RARITY_COLORS: Record<ItemRarity, string> = {
  '普通': 'text-quality-common',
  '稀有': 'text-quality-rare',
  '史诗': 'text-quality-epic',
  '传说': 'text-quality-legendary',
  '神话': 'text-quality-mythic',
};

/** 稀有度边框颜色 */
export const RARITY_BORDER_COLORS: Record<ItemRarity, string> = {
  '普通': 'border-quality-common',
  '稀有': 'border-quality-rare',
  '史诗': 'border-quality-epic',
  '传说': 'border-quality-legendary',
  '神话': 'border-quality-mythic',
};

/** 稀有度背景颜色 */
export const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  '普通': 'bg-quality-common/10',
  '稀有': 'bg-quality-rare/10',
  '史诗': 'bg-quality-epic/10',
  '传说': 'bg-quality-legendary/10',
  '神话': 'bg-quality-mythic/10',
};

/** 稀有度徽章样式 — 使用 quality-* 语义化变量 */
export const RARITY_BADGE_STYLES: Record<ItemRarity, { border: string; bg: string; text: string; badge: string }> = {
  '普通': {
    border: 'border-quality-common',
    bg: 'bg-quality-common/10',
    text: 'text-quality-common',
    badge: 'bg-quality-common/20 text-quality-common',
  },
  '稀有': {
    border: 'border-quality-rare',
    bg: 'bg-quality-rare/10',
    text: 'text-quality-rare',
    badge: 'bg-quality-rare/20 text-quality-rare',
  },
  '史诗': {
    border: 'border-quality-epic',
    bg: 'bg-quality-epic/10',
    text: 'text-quality-epic',
    badge: 'bg-quality-epic/20 text-quality-epic',
  },
  '传说': {
    border: 'border-quality-legendary',
    bg: 'bg-quality-legendary/10',
    text: 'text-quality-legendary',
    badge: 'bg-quality-legendary/20 text-quality-legendary',
  },
  '神话': {
    border: 'border-quality-mythic',
    bg: 'bg-quality-mythic/10',
    text: 'text-quality-mythic',
    badge: 'bg-quality-mythic/20 text-quality-mythic',
  },
};

/** 所有稀有度列表 */
export const ALL_RARITIES: ItemRarity[] = ['普通', '稀有', '史诗', '传说', '神话'];

/** 创建最小化的功法对象（用于测试/初始化） */
export function createMinimalTechnique(
  id: string,
  name: string,
  type: TechniqueType,
  rarity: ItemRarity,
  overrides: Partial<Technique> = {}
): Technique {
  const config = TECHNIQUE_RARITY_CONFIG[rarity];
  return {
    id,
    name,
    type,
    rarity,
    description: `${name}的描述`,
    power: 10,
    bonus: 5,
    level: 1,
    exp: 0,
    expToNext: 100,
    maxLevel: config.maxLevel,
    baseMpCost: 10,
    element: null as unknown as Element,
    compatibleWeapon: null,
    compatibleBonus: 0,
    skillSlots: 0,
    maxSkillSlots: config.maxSkillSlots,
    allSkills: [],
    equippedSkills: [],
    source: 'initial',
    isFragment: false,
    ...overrides,
  };
}

/** 创建最小化的装备对象（用于测试/初始化） */
export function createMinimalEquipment(
  id: string,
  name: string,
  slot: EquipmentSlot,
  rarity: ItemRarity,
  overrides: Partial<Equipment> = {}
): Equipment {
  const config = EQUIPMENT_RARITY_CONFIG[rarity];
  return {
    id,
    name,
    slot,
    rarity,
    description: `${name}的描述`,
    level: 1,
    exp: 0,
    expToNext: 100,
    maxLevel: config.maxLevel,
    weaponCategory: slot === 'melee' ? 'sword' : slot === 'ranged' ? 'bow' : null,
    element: null,
    compatibleElement: null,
    compatibleBonus: 0,
    attackBonus: slot === 'melee' || slot === 'ranged' ? 10 : 0,
    defenseBonus: slot !== 'melee' && slot !== 'ranged' ? 10 : 0,
    power: 10,
    techniqueSlots: 0,
    maxTechniqueSlots: config.maxSkillSlots, // 武器使用 maxSkillSlots 作为技巧槽位上限
    allTechniques: [],
    equippedTechniques: [],
    source: 'initial',
    isFragment: false,
    ...overrides,
  };
}
