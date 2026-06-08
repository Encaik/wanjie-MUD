/**
 * 稀有度工具函数和常量
 */

import { Element, WeaponCategory } from './restraintSystem';
import { TECHNIQUE_RARITY_CONFIG, EQUIPMENT_RARITY_CONFIG } from './skillTypes';
import { ItemRarity, Technique, Equipment, TechniqueType, EquipmentSlot } from './types';

/** 稀有度中文名称 */
export const RARITY_NAMES: Record<ItemRarity, string> = {
  '普通': '普通',
  '稀有': '稀有',
  '史诗': '史诗',
  '传说': '传说',
  '神话': '神话',
};

/** 稀有度颜色 */
export const RARITY_COLORS: Record<ItemRarity, string> = {
  '普通': 'text-gray-500',
  '稀有': 'text-blue-500',
  '史诗': 'text-purple-500',
  '传说': 'text-yellow-500',
  '神话': 'text-red-500',
};

/** 稀有度边框颜色 */
export const RARITY_BORDER_COLORS: Record<ItemRarity, string> = {
  '普通': 'border-gray-500',
  '稀有': 'border-blue-500',
  '史诗': 'border-purple-500',
  '传说': 'border-yellow-500',
  '神话': 'border-red-500',
};

/** 稀有度背景颜色 */
export const RARITY_BG_COLORS: Record<ItemRarity, string> = {
  '普通': 'bg-gray-500/10',
  '稀有': 'bg-blue-500/10',
  '史诗': 'bg-purple-500/10',
  '传说': 'bg-yellow-500/10',
  '神话': 'bg-red-500/10',
};

/** 稀有度徽章样式 */
export const RARITY_BADGE_STYLES: Record<ItemRarity, { border: string; bg: string; text: string; badge: string }> = {
  '普通': { 
    border: 'border-gray-400', 
    bg: 'bg-gray-100 dark:bg-gray-800', 
    text: 'text-gray-600 dark:text-gray-300',
    badge: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
  '稀有': { 
    border: 'border-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    text: 'text-blue-600 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200',
  },
  '史诗': { 
    border: 'border-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    text: 'text-purple-600 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200',
  },
  '传说': { 
    border: 'border-yellow-400', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
    text: 'text-yellow-600 dark:text-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200',
  },
  '神话': { 
    border: 'border-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    text: 'text-red-600 dark:text-red-300',
    badge: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
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
