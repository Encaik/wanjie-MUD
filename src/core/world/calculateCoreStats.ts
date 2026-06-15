/**
 * 核心值计算引擎
 *
 * 将属性（Attribute）通过世界观定义的映射公式转换为核心值（CoreStat）。
 * 核心值维度是固定的 11 维，全世界观通用。
 * 核心值基础值（初始值）是代码常量，不属于世界观数据。
 * 世界观只定义：有哪些属性 + 属性到核心值的转换公式。
 *
 * 纯函数：不依赖 React、不修改输入、不使用 Math.random()。
 *
 * @module core/world
 */

import type {
  AttributeTemplate,
  NumericAttributeTemplate,
  EnumAttributeTemplate,
  AttributeGrowthRule,
  CoreStatKey,
} from '@/core/types';

/** 角色属性字典（AttributeDefinition.key → 数值 或 枚举值字符串） */
export type AttributeValues = Record<string, number | string>;

/** 角色核心值字典（CoreStatKey → 数值） */
export type CoreStatValues = Record<CoreStatKey, number>;

/** 核心值基础初始值（全世界观通用常量，BG3 风格低起点） */
export const DEFAULT_CORE_STAT_BASE_VALUES: CoreStatValues = {
  maxHp: 20,
  physicalATK: 5,
  specialATK: 5,
  physicalDEF: 3,
  specialDEF: 3,
  speed: 10,
  intelligence: 10,
  willpower: 10,
  lifespan: 80,
  perception: 10,
  specialResourceCap: 0,   // 由世界观 specialResource 决定
};

// ============================================
// 属性成长计算
// ============================================

/**
 * 计算单个属性在给定等级/境界下的最终值
 *
 * 公式：attrValue = baseValue + Σ(各 growthTerm 计算结果)
 *   - linear:      + multiplier * level
 *   - exponential: baseValue *= (baseMultiplier ^ level)
 *   - constant:    + value
 *   - perRealm:    + realmBonuses[currentRealm] ?? 0
 *
 * @param baseValue - 属性模板的初始值
 * @param growthRule - 世界观定义的成长规则（多项组合）
 * @param level - 当前等级
 * @param realm - 当前境界名称（可选，用于 perRealm 项）
 * @returns 计算后的属性值
 *
 * @example
 * // 线性成长：baseValue 8 + 0.5 * 10 = 13
 * calculateAttributeGrowth(8, [{ type: 'linear', multiplier: 0.5 }], 10)
 *
 * @example
 * // 线性 + 常数：8 + 0.5*10 + 2 = 15
 * calculateAttributeGrowth(8, [{ type: 'linear', multiplier: 0.5 }, { type: 'constant', value: 2 }], 10)
 */
export function calculateAttributeGrowth(
  baseValue: number,
  growthRule: AttributeGrowthRule,
  level: number,
  realm?: string,
): number {
  let value = baseValue;

  for (const term of growthRule) {
    switch (term.type) {
      case 'linear':
        value += term.multiplier * level;
        break;
      case 'exponential':
        value *= Math.pow(term.baseMultiplier, level);
        break;
      case 'constant':
        value += term.value;
        break;
      case 'perRealm':
        if (realm && term.realmBonuses[realm]) {
          value += term.realmBonuses[realm];
        }
        break;
    }
  }

  return Math.round(value * 100) / 100;
}

/**
 * 处理数值型属性：attrValue * multiplier 贡献到核心值
 */
function applyNumericAttribute(
  result: Record<string, number>,
  attrDef: NumericAttributeTemplate,
  attrValue: number,
): void {
  for (const calc of attrDef.calculations) {
    result[calc.targetCoreStat] = (result[calc.targetCoreStat] ?? 0) + attrValue * calc.multiplier;
  }
}

/**
 * 处理枚举型属性：查找匹配的枚举值，累加其固定加成
 */
function applyEnumAttribute(
  result: Record<string, number>,
  attrDef: EnumAttributeTemplate,
  selectedValue: string,
): void {
  const enumEntry = attrDef.enumValues.find(e => e.value === selectedValue);
  if (!enumEntry) return;
  for (const [key, bonus] of Object.entries(enumEntry.bonuses)) {
    result[key] = (result[key] ?? 0) + (bonus as number);
  }
}

/**
 * 从属性值和属性定义计算核心值
 *
 * 支持两种属性类型：
 * - numeric：attrValue * multiplier 叠加到对应核心值
 * - enum：匹配枚举值的 bonuses 直接叠加
 *
 * @param attributes - 角色属性字典（key → 数值或枚举值字符串）
 * @param attrDefs - 完整的属性定义（模板 + 世界观成长规则已合并）
 * @param baseCoreStats - 可选，覆盖默认基础值
 * @returns 计算后的核心值
 */
export function calculateCoreStats(
  attributes: AttributeValues,
  attrDefs: AttributeTemplate[],
  baseCoreStats?: Partial<CoreStatValues>,
): CoreStatValues {
  const result: Record<string, number> = {
    ...DEFAULT_CORE_STAT_BASE_VALUES,
    ...baseCoreStats,
  };

  for (const attrDef of attrDefs) {
    if (attrDef.type === 'numeric') {
      const raw = attributes[attrDef.key];
      const attrValue = typeof raw === 'number' ? raw : attrDef.baseValue;
      applyNumericAttribute(result, attrDef, attrValue);
    } else if (attrDef.type === 'enum') {
      const selectedValue = attributes[attrDef.key];
      if (typeof selectedValue === 'string') {
        applyEnumAttribute(result, attrDef, selectedValue);
      }
    }
  }

  // 向下取整
  for (const key of Object.keys(result)) {
    result[key] = Math.floor(result[key] as number);
  }

  return result as CoreStatValues;
}

/**
 * 获取核心值维度列表（供 UI 遍历）
 */
export function getCoreStatKeys(): CoreStatKey[] {
  return [
    'maxHp',
    'physicalATK',
    'specialATK',
    'physicalDEF',
    'specialDEF',
    'speed',
    'intelligence',
    'willpower',
    'lifespan',
    'perception',
    'specialResourceCap',
  ];
}

/** 核心值中文显示名映射 */
export const CORE_STAT_DISPLAY_NAMES: Record<CoreStatKey, string> = {
  maxHp: '生命值',
  physicalATK: '物理攻击',
  specialATK: '特殊攻击',
  physicalDEF: '物理防御',
  specialDEF: '特殊防御',
  speed: '速度',
  intelligence: '智力',
  willpower: '毅力',
  lifespan: '寿命',
  perception: '感知',
  specialResourceCap: '专项数值上限',
};

/** 核心值分类（战斗/养成/世界专属） */
export const CORE_STAT_CATEGORIES: Record<CoreStatKey, 'combat' | 'growth' | 'special'> = {
  maxHp: 'combat',
  physicalATK: 'combat',
  specialATK: 'combat',
  physicalDEF: 'combat',
  specialDEF: 'combat',
  speed: 'combat',
  intelligence: 'growth',
  willpower: 'growth',
  lifespan: 'growth',
  perception: 'growth',
  specialResourceCap: 'special',
};
