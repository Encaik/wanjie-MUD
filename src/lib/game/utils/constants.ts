/**
 * 游戏常量配置
 * 统一管理游戏中的魔法数字和硬编码常量
 */

// ============================================
// 游戏基础常量
// ============================================
export const GAME_CONSTANTS = {
  // 初始值
  INITIAL_SPIRIT_STONES: 100,
  INITIAL_STAMINA: 100,
  INITIAL_MAX_STAMINA: 100,
  
  // 等级上限
  MAX_LEVEL: 100,
  MAX_REalm_LEVEL: 100,
  
  // 百分比上限
  MAX_MENTAL_STATE: 100,
  MAX_DEMON_CHANCE: 100,
  MAX_HP_PERCENT: 100,
  
  // 时间相关 (毫秒)
  STAMINA_RECOVERY_INTERVAL_MS: 5 * 60 * 1000, // 5分钟恢复一点体力
  TASK_COOLDOWN_DEFAULT_MS: 24 * 60 * 60 * 1000, // 24小时
  EXPLORE_COOLDOWN_MS: 30 * 1000, // 30秒历练冷却
  AUTO_CULTIVATE_TICK_MS: 1000, // 自动修炼tick
  
  // 修炼消耗
  REST_SPIRIT_STONE_COST: 10,
  
  // 渡劫惩罚
  HP_LOSS_PERCENT: 0.3, // HP损失30%
  STAMINA_LOSS_PERCENT: 0.5, // 体力损失50%
  
  // 战斗相关
  BATTLE_MAX_TURNS: 50,
  BATTLE_GRACE_TURNS: 3, // 保护回合数
  
  // 飞升系统
  ASCENSION_MIN_LEVEL: 100,
  ASCENSION_BATTLE_PHASES: 3,
  
  // 经验倍率
  OVERFLOW_EXPERIENCE_RATE: 0.1, // 溢出经验转化的倍率
  
  // 经验溢出上限（修复 BUG-005）
  MAX_OVERFLOW_EXP_MULTIPLIER: 2, // 最大溢出经验为当前等级所需经验的2倍
  
  // 每日刷新时间戳
  DAILY_RESET_HOUR: 4, // 凌晨4点刷新
  
  // 战斗相关概率（修复 P2-001：硬编码魔法数字）
  TECHNIQUE_TRIGGER_RATE: 0.25, // 功法触发概率 25%
  MAX_DAMAGE_RATIO: 0.15, // 最大伤害比例（敌人最大HP的15%）
  
  // 机缘事件概率
  EVENT_COMMON_RATE: 0.5, // 普通事件概率 50%
  EVENT_RARE_BASE_RATE: 0.3, // 稀有事件基础概率 30%
  EVENT_DANGER_BASE_RATE: 0.15, // 危险事件基础概率 15%
  EVENT_RARE_DIFFICULTY_FACTOR: 0.005, // 稀有事件难度因子
  EVENT_DANGER_DIFFICULTY_FACTOR: 0.003, // 危险事件难度因子
  TREASURE_FIND_RATE: 0.3, // 发现宝藏概率 30%
  
} as const;

// 类型别名，方便使用
export type GameConstantKey = keyof typeof GAME_CONSTANTS;

/**
 * 获取常量值（带类型安全）
 */
export function getConstant<K extends GameConstantKey>(key: K): typeof GAME_CONSTANTS[K] {
  return GAME_CONSTANTS[key];
}

/**
 * 检查值是否在有效范围内
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 等级限制（1-100）
 */
export const LEVEL_CONSTRAINTS = {
  MIN: 1,
  MAX: GAME_CONSTANTS.MAX_LEVEL,
  
  clamp(level: number): number {
    return clampValue(level, this.MIN, this.MAX);
  },
} as const;

/**
 * 体力恢复配置
 */
export const STAMINA_CONSTRAINTS = {
  MIN: 0,
  MAX: GAME_CONSTANTS.INITIAL_MAX_STAMINA,
  RECOVERY_INTERVAL_MS: GAME_CONSTANTS.STAMINA_RECOVERY_INTERVAL_MS,
  
  clamp(stamina: number): number {
    return clampValue(stamina, this.MIN, this.MAX);
  },
} as const;

/**
 * 心境状态配置
 */
export const MENTAL_CONSTRAINTS = {
  MIN: 0,
  MAX: GAME_CONSTANTS.MAX_MENTAL_STATE,
  
  clamp(mental: number): number {
    return clampValue(mental, this.MIN, this.MAX);
  },
} as const;

/**
 * 百分比配置
 */
export const PERCENTAGE_CONSTRAINTS = {
  MIN: 0,
  MAX: 100,
  
  clamp(value: number): number {
    return clampValue(value, this.MIN, this.MAX);
  },
  
  toDecimal(value: number): number {
    return value / 100;
  },
  
  fromDecimal(value: number): number {
    return value * 100;
  },
} as const;

/**
 * 时间常量（毫秒转秒/分钟/小时）
 */
export const TIME_CONSTANTS = {
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  
  fromMs(ms: number): { seconds: number; minutes: number; hours: number; days: number } {
    return {
      seconds: Math.floor(ms / this.MS_PER_SECOND),
      minutes: Math.floor(ms / this.MS_PER_MINUTE),
      hours: Math.floor(ms / this.MS_PER_HOUR),
      days: Math.floor(ms / this.MS_PER_DAY),
    };
  },
} as const;

/**
 * 存档版本管理
 */
export const SAVE_VERSION = {
  CURRENT: 1,
  MIN_SUPPORTED: 1, // 支持的最旧版本
  
  isSupported(version: number): boolean {
    return version >= this.MIN_SUPPORTED && version <= this.CURRENT;
  },
} as const;

/**
 * 数值限制（修复 BUG-006）
 * 防止数值溢出
 */
export const VALUE_LIMITS = {
  /** 最大属性值 */
  MAX_STAT: 99999,
  /** 最小属性值 */
  MIN_STAT: 1,
  /** 最大等级 */
  MAX_LEVEL: 100,
  /** 最大资源数量（灵石等） */
  MAX_RESOURCE: 999999999, // 10亿
  /** 最大击杀数统计 */
  MAX_KILLS: 999999999,
  /** 最大经验值 */
  MAX_EXPERIENCE: 999999999,
  /** 最大HP */
  MAX_HP: 999999,
  /** 最大MP */
  MAX_MP: 99999,
  
  /**
   * 安全增量（防止溢出）
   */
  safeIncrement(current: number, delta: number, max: number): number {
    const result = current + delta;
    if (!Number.isFinite(result)) return max;
    return Math.max(0, Math.min(result, max));
  },
  
  /**
   * 安全属性值
   */
  safeStat(value: number): number {
    return clampValue(value, this.MIN_STAT, this.MAX_STAT);
  },
  
  /**
   * 安全资源值
   */
  safeResource(value: number): number {
    return clampValue(value, 0, this.MAX_RESOURCE);
  },
} as const;
