/**
 * 时间系统类型定义
 *
 * 设计原则：
 * - GameClock：游戏世界虚拟时间，绑定于玩家主动行为
 * - RealClock：现实时间，绑定于服务端时间戳
 * - TimeState 对外部模块是不透明结构，应通过 core/time/ 的 API 操作
 */

// ============================================
// 冷却时间
// ============================================

/** 冷却时间记录 — 存储"开始时间 + 持续时间"，而非"结束时间" */
export interface CooldownRecord {
  /** 冷却开始时间戳（毫秒，服务端时间） */
  startTime: number;
  /** 冷却持续时间（毫秒） */
  duration: number;
}

/** 冷却映射表 — key 为冷却标识（如 'explore'、'skill:fireball'） */
export type CooldownMap = Record<string, CooldownRecord>;

// ============================================
// 游戏世界时钟
// ============================================

/** 游戏世界时钟状态 */
export interface GameClock {
  /** 游戏内年份（1-N） */
  year: number;
  /** 游戏内月份（1-12） */
  month: number;
  /** 游戏内日期（1-30） */
  day: number;
  /** 游戏内时辰（1-12，对应子丑寅卯...） */
  shichen: number;
  /** 累计游戏秒数（用于年龄计算） */
  totalSeconds: number;
  /** 主角初始年龄 */
  baseAge: number;
  /** 当前纪元名称 */
  eraName: string;
}

// ============================================
// 现实时钟
// ============================================

/** 现实时钟状态 */
export interface RealClock {
  /** 上次登录时间戳（毫秒，服务端时间） */
  lastLoginAt: number;
  /** 上次登出时间戳（毫秒，服务端时间）。0 表示无有效登出记录 */
  lastLogoutAt: number;
  /** 统一冷却记录 */
  cooldowns: CooldownMap;
  /** 上次每日刷新时的服务端时间戳 */
  dailyRefreshAt: number;
  /** 上次每周刷新时的服务端时间戳 */
  weeklyRefreshAt: number;
}

// ============================================
// 统一时间状态
// ============================================

/**
 * 时间系统完整状态
 *
 * 存入 GameState.time 的唯一字段。
 * 外部模块不直接访问 .game 或 .real 内部字段，
 * 而是通过 core/time/ 提供的 API 函数操作。
 */
export interface TimeState {
  /** 游戏世界时钟 */
  readonly game: GameClock;
  /** 现实时钟 */
  readonly real: RealClock;
}

// ============================================
// 离线处理相关类型
// ============================================

/** 离线时间处理配置 */
export interface OfflineConfig {
  /** 最大离线时长（毫秒），超过部分不计入收益 */
  maxOfflineDuration: number;
  /** 体力恢复间隔（毫秒） */
  staminaRecoverInterval: number;
  /** 每次体力恢复数量 */
  staminaRecoverAmount: number;
  /** HP 恢复间隔（毫秒） */
  hpRecoverInterval: number;
  /** 每次 HP 恢复百分比（0-1） */
  hpRecoverPercent: number;
  /** MP 恢复间隔（毫秒） */
  mpRecoverInterval: number;
  /** 每次 MP 恢复百分比（0-1） */
  mpRecoverPercent: number;
  /** 显示离线弹窗的最小离线时长（毫秒） */
  minOfflineTimeForDialog: number;
  /** 自动修炼间隔（毫秒） */
  autoCultivateInterval: number;
  /** 自动修炼每次消耗灵石 */
  autoCultivateSpiritStoneCost: number;
  /** 自动修炼每次获得经验基础值 */
  autoCultivateExpBase: number;
  /** 自动修炼每次获得经验等级系数 */
  autoCultivateExpPerLevel: number;
  /** 离线修炼效率系数（0-1） */
  offlineCultivateEfficiency: number;
}

/** 自动修炼计算结果 */
export interface AutoCultivateResult {
  /** 是否执行了自动修炼 */
  executed: boolean;
  /** 修炼次数 */
  count: number;
  /** 消耗的灵石 */
  spiritStonesSpent: number;
  /** 获得的总经验 */
  totalExpGained: number;
  /** 升级前的等级 */
  startLevel: number;
  /** 升级后的等级 */
  endLevel: number;
  /** 升级后的经验进度 */
  endExperience: number;
  /** 是否因灵石不足停止 */
  stoppedByResource: boolean;
}

/** 离线处理结果 */
export interface OfflineResult {
  /** 离线时长（已限制最大值，毫秒） */
  offlineDuration: number;
  /** 格式化的离线时长文本 */
  offlineDurationText: string;

  // ── 资源恢复 ──
  /** 恢复的体力数量 */
  staminaRecovered: number;
  /** 恢复的 HP 数量 */
  hpRecovered: number;
  /** 恢复的 MP 数量 */
  mpRecovered: number;

  // ── 冷却处理 ──
  /** 已过期的冷却 ID 列表 */
  expiredCooldownIds: string[];

  // ── 刷新检测 ──
  /** 是否需要每日刷新 */
  needsDailyRefresh: boolean;
  /** 是否需要每周刷新 */
  needsWeeklyRefresh: boolean;

  // ── 自动修炼 ──
  /** 自动修炼结果（未开启时返回默认值） */
  autoCultivate: AutoCultivateResult;
}

// ============================================
// 游戏行为类型
// ============================================

/** 消耗游戏时间的行为类型 */
export type GameAction =
  | 'cultivate'    // 修炼
  | 'explore'      // 历练
  | 'battle'       // 战斗
  | 'alchemy'      // 炼丹
  | 'forge'        // 炼器
  | 'breakthrough' // 突破
  | 'rest'         // 休息
  | 'dailyTask';   // 日常任务
