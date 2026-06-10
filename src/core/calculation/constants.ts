/**
 * 统一数值计算系统 - 常量定义
 * 
 * 定义所有边界约束、默认值等常量
 */

import { CalculableStat, StatBounds } from './types';

// ============================================
// 数值安全常量
// ============================================

/** 安全整数范围 */
export const SAFE_INTEGER_MAX = Number.MAX_SAFE_INTEGER;
export const SAFE_INTEGER_MIN = Number.MIN_SAFE_INTEGER;

/** 浮点数比较误差范围 */
export const FLOAT_EPSILON = 0.0001;

/** 最小正数（用于除法保护） */
export const MIN_POSITIVE = 0.0001;

// ============================================
// 边界约束配置
// ============================================

/** 默认属性边界约束 */
export const DEFAULT_STAT_BOUNDS: Record<CalculableStat, StatBounds> = {
  // 战斗属性
  maxHp: {
    stat: 'maxHp',
    min: 1,
    max: 999999,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 100,
  },
  maxMp: {
    stat: 'maxMp',
    min: 0,
    max: 999999,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 50,
  },
  attack: {
    stat: 'attack',
    min: 1,
    max: 99999,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 10,
  },
  defense: {
    stat: 'defense',
    min: 0,
    max: 99999,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 5,
  },
  critRate: {
    stat: 'critRate',
    min: 0,
    max: 1,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0.05,
  },
  critDamage: {
    stat: 'critDamage',
    min: 1,
    max: 10,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1.5,
  },
  dodgeRate: {
    stat: 'dodgeRate',
    min: 0,
    max: 0.5,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0.03,
  },
  
  // 修炼属性
  cultivationExp: {
    stat: 'cultivationExp',
    min: 0.1,
    max: 100,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1,
  },
  breakthroughRate: {
    stat: 'breakthroughRate',
    min: 0,
    max: 1,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0.5,
  },
  techniqueExp: {
    stat: 'techniqueExp',
    min: 0.1,
    max: 100,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1,
  },
  
  // 经济属性
  expGain: {
    stat: 'expGain',
    min: 0.1,
    max: 100,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1,
  },
  spiritStoneGain: {
    stat: 'spiritStoneGain',
    min: 0.1,
    max: 100,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1,
  },
  dropRate: {
    stat: 'dropRate',
    min: 0,
    max: 10,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 1,
  },
  rarityBoost: {
    stat: 'rarityBoost',
    min: 0,
    max: 5,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0,
  },
  
  // 特殊属性
  luck: {
    stat: 'luck',
    min: 0,
    max: 100,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0,
  },
  power: {
    stat: 'power',
    min: 0,
    max: 9999999,
    minBehavior: 'clamp',
    maxBehavior: 'clamp',
    defaultValue: 0,
  },
};

// ============================================
// 效果相关常量
// ============================================

/** 最大同时激活效果数量 */
export const MAX_ACTIVE_EFFECTS = 100;

/** 效果优先级数值（用于排序） */
export const EFFECT_PRIORITY_VALUES = {
  base: 1,
  passive: 2,
  faction: 3,
  buff: 4,
  world: 5,
  special: 6,
} as const;

/** 效果优先级数组（用于遍历） */
export const EFFECT_PRIORITIES = ['base', 'passive', 'faction', 'buff', 'world', 'special'] as const;

/** 计算类型数组 */
export const CALCULATION_TYPES = ['add', 'multiply', 'override', 'chain'] as const;

/** 效果来源类型数组 */
export const EFFECT_SOURCE_TYPES = [
  'world_danger',
  'world_opportunity',
  'world_base',
  'pill',
  'equipment',
  'technique',
  'title',
  'buff',
  'realm',
  'state',
  'passive',
  'faction',
  'school',
  'enemy_buff',
] as const;

/** 默认效果层级 */
export const DEFAULT_EFFECT_LAYER = 1;

/** 永久效果持续时间标记 */
export const PERMANENT_DURATION = -1;

/** 即时效果持续时间标记 */
export const INSTANT_DURATION = 0;

// ============================================
// 计算相关常量
// ============================================

/** 计算结果缓存时间（毫秒） */
export const CALCULATION_CACHE_TTL = 1000;

/** 最大计算深度（防止无限递归） */
export const MAX_CALCULATION_DEPTH = 10;

/** 批量计算的最大属性数量 */
export const MAX_BATCH_CALCULATION_SIZE = 50;

// ============================================
// 日志相关常量
// ============================================

/** 是否启用计算日志 */
export const ENABLE_CALCULATION_LOG = process.env.NODE_ENV === 'development';

/** 是否启用效果追踪 */
export const ENABLE_EFFECT_TRACING = process.env.NODE_ENV === 'development';

/** 日志前缀 */
export const LOG_PREFIX = '[Calculation]';

// ============================================
// 辅助函数
// ============================================

/**
 * 获取属性边界约束
 */
export function getStatBounds(stat: CalculableStat): StatBounds {
  return DEFAULT_STAT_BOUNDS[stat];
}

/**
 * 获取属性默认值
 */
export function getStatDefaultValue(stat: CalculableStat): number {
  return DEFAULT_STAT_BOUNDS[stat].defaultValue;
}

/**
 * 检查是否为概率类型属性
 */
export function isProbabilityStat(stat: CalculableStat): boolean {
  return ['critRate', 'dodgeRate', 'breakthroughRate'].includes(stat);
}

/**
 * 检查是否为百分比类型属性
 */
export function isPercentageStat(stat: CalculableStat): boolean {
  return ['critRate', 'dodgeRate', 'breakthroughRate', 'critDamage'].includes(stat);
}

/**
 * 检查是否为倍率类型属性
 */
export function isMultiplierStat(stat: CalculableStat): boolean {
  return [
    'cultivationExp',
    'techniqueExp',
    'expGain',
    'spiritStoneGain',
    'dropRate',
  ].includes(stat);
}

// ============================================
// 默认配置
// ============================================

/** 默认边界配置 */
export const DEFAULT_BOUNDARY_CONFIG = {
  enabled: true,
  overflowBehavior: 'clamp' as const,
  underflowBehavior: 'clamp' as const,
  customBounds: {},
};

/** 默认系统配置 */
export const DEFAULT_SYSTEM_CONFIG = {
  boundary: DEFAULT_BOUNDARY_CONFIG,
  enableCache: true,
  cacheTTL: CALCULATION_CACHE_TTL,
  enableTracing: ENABLE_EFFECT_TRACING,
  maxEffects: MAX_ACTIVE_EFFECTS,
};

/** 优先级顺序（从types导出，这里重新导出方便使用） */
export const PRIORITY_ORDER = EFFECT_PRIORITY_VALUES;
