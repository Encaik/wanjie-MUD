/**
 * 时间系统常量定义
 *
 * 所有时间相关常量集中管理，避免跨文件散落。
 */

import type { GameAction, OfflineConfig } from './types';

// ============================================
// 时辰与月份名称
// ============================================

/** 时辰名称（索引 0-11，对应值 1-12） */
export const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 月份名称（索引 0-11） */
export const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

// ============================================
// 游戏时间倍率与年龄
// ============================================

/** 游戏时间缩放比例：1 秒现实时间 = 60 秒游戏时间（1 分钟） */
export const GAME_TIME_SCALE = 60;

/** 默认初始年龄 */
export const DEFAULT_BASE_AGE = 16;

/** 游戏内一年对应的秒数（365 天 × 86400 秒） */
export const GAME_YEAR_SECONDS = 31536000;

/** 一个时辰对应的秒数（2 小时 = 7200 秒） */
export const SHICHEN_SECONDS = 7200;

/** 一天对应的秒数（12 时辰） */
export const GAME_DAY_SECONDS = SHICHEN_SECONDS * 12;

/** 一月对应的秒数（30 天） */
export const GAME_MONTH_SECONDS = GAME_DAY_SECONDS * 30;

/** 一年对应的秒数（12 月） */
export const GAME_YEAR_SECONDS_COMPUTED = GAME_MONTH_SECONDS * 12;

// ============================================
// 行为游戏时间消耗（秒）
// ============================================

/** 各行为消耗的游戏时间（游戏内秒数） */
export const ACTION_TIME_COST: Record<GameAction, number> = {
  /** 修炼一次：1 小时 */
  cultivate: 3600,
  /** 历练一次：2 小时 */
  explore: 7200,
  /** 战斗一次：30 分钟 */
  battle: 1800,
  /** 炼丹一次：4 小时 */
  alchemy: 14400,
  /** 炼器一次：6 小时 */
  forge: 21600,
  /** 突破：12 小时 */
  breakthrough: 43200,
  /** 休息：8 小时 */
  rest: 28800,
  /** 日常任务：1 小时 */
  dailyTask: 3600,
};

/** 默认纪元名 */
export const DEFAULT_ERA_NAME = '初元';

// ============================================
// 离线处理默认配置
// ============================================

/** 默认离线时间处理配置 */
export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  maxOfflineDuration: 8 * 60 * 60 * 1000,   // 8 小时
  staminaRecoverInterval: 5 * 60 * 1000,     // 5 分钟
  staminaRecoverAmount: 1,                    // 每次 1 点
  hpRecoverInterval: 5 * 60 * 1000,          // 5 分钟
  hpRecoverPercent: 0.05,                     // 5%
  mpRecoverInterval: 5 * 60 * 1000,          // 5 分钟
  mpRecoverPercent: 0.08,                     // 8%
  minOfflineTimeForDialog: 30 * 1000,         // 30 秒
  autoCultivateInterval: 3000,                // 3 秒
  autoCultivateSpiritStoneCost: 20,           // 每次 20 灵石
  autoCultivateExpBase: 10,                   // 基础经验
  autoCultivateExpPerLevel: 2,                // 每等级增加经验
  offlineCultivateEfficiency: 0.5,            // 离线效率 50%
};

// ============================================
// 升级经验公式常量
// ============================================

/** 经验公式基础值 */
export const EXP_BASE = 100;

/** 经验公式增长因子 */
export const EXP_GROWTH_FACTOR = 1.15;

/** 最大等级 */
export const MAX_LEVEL = 100;

// ============================================
// 计时器配置
// ============================================

/** 运行时计时器 tick 间隔（毫秒） */
export const TIMER_TICK_INTERVAL = 500;
