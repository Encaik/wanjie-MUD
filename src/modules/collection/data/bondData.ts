/**
 * 图鉴羁绊系统数据配置
 * 
 * 羁绊类型：
 * - element: 元素羁绊（火、冰、雷、风、土、光、暗）
 * - weapon: 武器羁绊（剑、刀、拳、弓、枪）
 * - rarity: 稀有度羁绊
 * 
 * 触发方式：
 * - 通过物品名称中的关键词匹配
 */

import { BondDefinition, BondType, BondLevel, BondReward } from '@/shared/lib/types';

/**
 * 羁绊等级配置
 */
export const BOND_LEVELS: BondLevel[] = [
  { level: 1, required: 2, multiplier: 1.1 },   // 2件激活，10%加成
  { level: 2, required: 5, multiplier: 1.2 },   // 5件，20%加成
  { level: 3, required: 10, multiplier: 1.35 }, // 10件，35%加成
  { level: 4, required: 20, multiplier: 1.5 },  // 20件，50%加成
  { level: 5, required: 35, multiplier: 1.75 }, // 35件，75%加成
];

/**
 * 元素羁绊关键词映射
 */
export const ELEMENT_KEYWORDS: Record<string, string[]> = {
  fire: ['火', '焰', '炎', '焚', '烈'],
  ice: ['冰', '寒', '霜', '冻', '雪'],
  thunder: ['雷', '电', '霆', '震'],
  wind: ['风', '疾', '飘'],
  earth: ['土', '岩', '石', '山'],
  light: ['光', '阳', '辉', '明', '圣'],
  dark: ['暗', '阴', '影', '幽', '冥', '鬼'],
};

/**
 * 武器羁绊关键词映射
 */
export const WEAPON_KEYWORDS: Record<string, string[]> = {
  sword: ['剑', '刃'],
  blade: ['刀'],
  fist: ['拳', '掌', '爪'],
  bow: ['弓', '弩', '箭'],
  spear: ['枪'],
};

/**
 * 羁绊类型中文名称
 */
export const BondTypeNames: Record<BondType, string> = {
  element: '元素羁绊',
  weapon: '武器羁绊',
  rarity: '品质羁绊',
};

/**
 * 元素羁绊中文名称
 */
export const ElementNames: Record<string, string> = {
  fire: '火系',
  ice: '冰系',
  thunder: '雷系',
  wind: '风系',
  earth: '土系',
  light: '光系',
  dark: '暗系',
};

/**
 * 武器羁绊中文名称
 */
export const WeaponNames: Record<string, string> = {
  sword: '剑系',
  blade: '刀系',
  fist: '拳系',
  bow: '弓系',
  spear: '枪系',
};

/**
 * 所有羁绊定义
 */
export const BONDS: BondDefinition[] = [
  // ========== 元素羁绊 ==========
  {
    id: 'bond_fire',
    name: '烈焰之道',
    description: '收集火系功法和装备，提升攻击力',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.fire,
    rewards: [
      { level: 1, stats: { 攻击力: 5 } },
      { level: 2, stats: { 攻击力: 12 } },
      { level: 3, stats: { 攻击力: 25, 暴击率: 3 } },
      { level: 4, stats: { 攻击力: 50, 暴击率: 5 } },
      { level: 5, stats: { 攻击力: 80, 暴击率: 8, 暴击伤害: 15 } },
    ],
  },
  {
    id: 'bond_ice',
    name: '寒冰之道',
    description: '收集冰系功法和装备，提升防御力',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.ice,
    rewards: [
      { level: 1, stats: { 防御力: 5 } },
      { level: 2, stats: { 防御力: 12 } },
      { level: 3, stats: { 防御力: 25, 闪避率: 3 } },
      { level: 4, stats: { 防御力: 50, 闪避率: 5 } },
      { level: 5, stats: { 防御力: 80, 闪避率: 8, 生命上限: 100 } },
    ],
  },
  {
    id: 'bond_thunder',
    name: '雷霆之道',
    description: '收集雷系功法和装备，提升暴击能力',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.thunder,
    rewards: [
      { level: 1, stats: { 暴击率: 2 } },
      { level: 2, stats: { 暴击率: 4, 暴击伤害: 5 } },
      { level: 3, stats: { 暴击率: 7, 暴击伤害: 12 } },
      { level: 4, stats: { 暴击率: 10, 暴击伤害: 20 } },
      { level: 5, stats: { 暴击率: 15, 暴击伤害: 35, 攻击力: 30 } },
    ],
  },
  {
    id: 'bond_wind',
    name: '疾风之道',
    description: '收集风系功法和装备，提升闪避能力',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.wind,
    rewards: [
      { level: 1, stats: { 闪避率: 2 } },
      { level: 2, stats: { 闪避率: 4, 命中率: 3 } },
      { level: 3, stats: { 闪避率: 7, 命中率: 5, 速度: 5 } },
      { level: 4, stats: { 闪避率: 10, 命中率: 8, 速度: 10 } },
      { level: 5, stats: { 闪避率: 15, 命中率: 12, 速度: 15, 攻击力: 20 } },
    ],
  },
  {
    id: 'bond_earth',
    name: '大地之道',
    description: '收集土系功法和装备，提升生命和防御',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.earth,
    rewards: [
      { level: 1, stats: { 生命上限: 30 } },
      { level: 2, stats: { 生命上限: 60, 防御力: 8 } },
      { level: 3, stats: { 生命上限: 120, 防御力: 18 } },
      { level: 4, stats: { 生命上限: 200, 防御力: 35, 意志: 3 } },
      { level: 5, stats: { 生命上限: 350, 防御力: 60, 意志: 5, 体质: 5 } },
    ],
  },
  {
    id: 'bond_light',
    name: '光明之道',
    description: '收集光系功法和装备，全面提升属性',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.light,
    rewards: [
      { level: 1, stats: { 攻击力: 3, 防御力: 3 } },
      { level: 2, stats: { 攻击力: 8, 防御力: 8, 生命上限: 30 } },
      { level: 3, stats: { 攻击力: 15, 防御力: 15, 生命上限: 80, 法力上限: 40 } },
      { level: 4, stats: { 攻击力: 28, 防御力: 28, 生命上限: 150, 法力上限: 80, 幸运: 3 } },
      { level: 5, stats: { 攻击力: 45, 防御力: 45, 生命上限: 250, 法力上限: 120, 幸运: 5 } },
    ],
  },
  {
    id: 'bond_dark',
    name: '暗影之道',
    description: '收集暗系功法和装备，提升暴击和伤害',
    type: 'element',
    keywords: ELEMENT_KEYWORDS.dark,
    rewards: [
      { level: 1, stats: { 暴击伤害: 8 } },
      { level: 2, stats: { 暴击伤害: 15, 暴击率: 3 } },
      { level: 3, stats: { 暴击伤害: 28, 暴击率: 6, 攻击力: 15 } },
      { level: 4, stats: { 暴击伤害: 45, 暴击率: 10, 攻击力: 30, 命中率: 5 } },
      { level: 5, stats: { 暴击伤害: 70, 暴击率: 15, 攻击力: 50, 命中率: 8 } },
    ],
  },

  // ========== 武器羁绊 ==========
  {
    id: 'bond_sword',
    name: '剑道至尊',
    description: '收集剑系功法和装备，提升攻击和暴击',
    type: 'weapon',
    keywords: WEAPON_KEYWORDS.sword,
    rewards: [
      { level: 1, stats: { 攻击力: 5 } },
      { level: 2, stats: { 攻击力: 12, 暴击率: 2 } },
      { level: 3, stats: { 攻击力: 25, 暴击率: 4, 暴击伤害: 8 } },
      { level: 4, stats: { 攻击力: 45, 暴击率: 7, 暴击伤害: 15, 命中率: 5 } },
      { level: 5, stats: { 攻击力: 70, 暴击率: 10, 暴击伤害: 25, 命中率: 8, 灵根: 3 } },
    ],
  },
  {
    id: 'bond_blade',
    name: '刀道无双',
    description: '收集刀系功法和装备，提升攻击和穿透',
    type: 'weapon',
    keywords: WEAPON_KEYWORDS.blade,
    rewards: [
      { level: 1, stats: { 攻击力: 6 } },
      { level: 2, stats: { 攻击力: 14, 暴击伤害: 5 } },
      { level: 3, stats: { 攻击力: 28, 暴击伤害: 12, 命中率: 3 } },
      { level: 4, stats: { 攻击力: 50, 暴击伤害: 22, 命中率: 6, 意志: 2 } },
      { level: 5, stats: { 攻击力: 80, 暴击伤害: 35, 命中率: 10, 意志: 4, 体质: 3 } },
    ],
  },
  {
    id: 'bond_fist',
    name: '拳掌宗师',
    description: '收集拳掌系功法和装备，提升攻击和防御',
    type: 'weapon',
    keywords: WEAPON_KEYWORDS.fist,
    rewards: [
      { level: 1, stats: { 攻击力: 3, 防御力: 3 } },
      { level: 2, stats: { 攻击力: 8, 防御力: 8 } },
      { level: 3, stats: { 攻击力: 16, 防御力: 16, 生命上限: 50 } },
      { level: 4, stats: { 攻击力: 30, 防御力: 30, 生命上限: 100, 体质: 3 } },
      { level: 5, stats: { 攻击力: 50, 防御力: 50, 生命上限: 180, 体质: 5, 意志: 4 } },
    ],
  },
  {
    id: 'bond_bow',
    name: '神射手',
    description: '收集弓弩系功法和装备，提升命中和暴击',
    type: 'weapon',
    keywords: WEAPON_KEYWORDS.bow,
    rewards: [
      { level: 1, stats: { 命中率: 3 } },
      { level: 2, stats: { 命中率: 6, 暴击率: 3 } },
      { level: 3, stats: { 命中率: 10, 暴击率: 5, 暴击伤害: 10 } },
      { level: 4, stats: { 命中率: 15, 暴击率: 8, 暴击伤害: 18, 攻击力: 25 } },
      { level: 5, stats: { 命中率: 22, 暴击率: 12, 暴击伤害: 30, 攻击力: 45, 灵根: 3 } },
    ],
  },
  {
    id: 'bond_spear',
    name: '枪道先锋',
    description: '收集枪系功法和装备，提升攻击和穿透',
    type: 'weapon',
    keywords: WEAPON_KEYWORDS.spear,
    rewards: [
      { level: 1, stats: { 攻击力: 5, 命中率: 2 } },
      { level: 2, stats: { 攻击力: 12, 命中率: 4 } },
      { level: 3, stats: { 攻击力: 24, 命中率: 7, 暴击率: 3 } },
      { level: 4, stats: { 攻击力: 42, 命中率: 11, 暴击率: 6, 暴击伤害: 12 } },
      { level: 5, stats: { 攻击力: 65, 命中率: 16, 暴击率: 10, 暴击伤害: 22, 悟性: 3 } },
    ],
  },
];

/**
 * 根据类型获取羁绊列表
 */
export function getBondsByType(type: BondType): BondDefinition[] {
  return BONDS.filter(b => b.type === type);
}

/**
 * 根据ID获取羁绊
 */
export function getBondById(id: string): BondDefinition | undefined {
  return BONDS.find(b => b.id === id);
}

/**
 * 获取所有羁绊类型
 */
export function getAllBondTypes(): BondType[] {
  return ['element', 'weapon'];
}

/**
 * 检查物品名称是否匹配羁绊关键词
 */
export function matchBondKeywords(name: string, keywords: string[]): boolean {
  return keywords.some(keyword => name.includes(keyword));
}

/**
 * 获取物品匹配的所有羁绊
 */
export function getMatchedBonds(name: string): BondDefinition[] {
  return BONDS.filter(bond => matchBondKeywords(name, bond.keywords));
}

/**
 * 获取羁绊等级信息
 */
export function getBondLevelInfo(collectedCount: number): BondLevel | null {
  // 从高到低检查
  for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
    if (collectedCount >= BOND_LEVELS[i].required) {
      return BOND_LEVELS[i];
    }
  }
  return null;
}

/**
 * 获取下一级羁绊所需数量
 */
export function getNextLevelRequired(collectedCount: number): number | null {
  for (const level of BOND_LEVELS) {
    if (collectedCount < level.required) {
      return level.required;
    }
  }
  return null; // 已满级
}

/**
 * 计算羁绊奖励
 */
export function calculateBondRewards(bond: BondDefinition, collectedCount: number): BondReward | null {
  const levelInfo = getBondLevelInfo(collectedCount);
  if (!levelInfo) return null;
  
  return bond.rewards.find(r => r.level === levelInfo.level) || null;
}

/**
 * 从物品名称中检测元素属性
 * @returns 元素属性名称（如"火系"、"冰系"），无匹配返回null
 */
export function detectElementFromName(name: string): string | null {
  for (const [key, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return ElementNames[key] || null;
    }
  }
  return null;
}

/**
 * 从物品名称中检测武器类型
 * @returns 武器类型名称（如"剑系"、"刀系"），无匹配返回null
 */
export function detectWeaponFromName(name: string): string | null {
  for (const [key, keywords] of Object.entries(WEAPON_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return WeaponNames[key] || null;
    }
  }
  return null;
}
