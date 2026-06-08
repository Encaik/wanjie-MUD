/**
 * 统一时间系统
 * 
 * 设计理念：
 * 1. 现实时间系统：基于真实时间戳，用于各种倒计时、刷新等
 * 2. 游戏时间系统：基于游戏行为，用于主角年龄变化
 * 
 * 核心原则：
 * - 所有倒计时存储"开始时间戳 + 持续时间"，而非"剩余时间"
 * - 离线时间通过计算得出，自动处理过期
 * - 游戏时间与行为绑定，独立于现实时间
 */

// ============================================
// 类型定义
// ============================================

/**
 * 冷却时间记录
 * 存储"开始时间 + 持续时间"，而非"剩余时间"
 */
export interface CooldownRecord {
  /** 冷却开始时间戳（毫秒） */
  startTime: number;
  /** 冷却持续时间（毫秒） */
  duration: number;
}

/**
 * 现实时间系统状态
 * 用于管理所有基于现实时间的倒计时
 */
export interface RealTimeState {
  /** 上次登录时间戳（毫秒） */
  lastLoginTime: number;
  /** 上次登出时间戳（毫秒），用于计算离线时间 */
  lastLogoutTime: number;
  
  // === 各种冷却时间 ===
  /** 历练冷却 */
  exploreCooldown: CooldownRecord | null;
  /** 任务刷新时间（每日刷新的时间戳） */
  dailyTaskRefreshTime: number;
  /** 商店刷新时间 */
  shopRefreshTime: number;
  /** 黑市刷新时间 */
  blackMarketRefreshTime: number;
  
  // === 可扩展的冷却时间映射 ===
  /** 自定义冷却时间记录 */
  customCooldowns: Record<string, CooldownRecord>;
}

/**
 * 游戏时间系统状态
 * 用于管理主角年龄等游戏内时间
 */
export interface GameTimeState {
  /** 游戏内年份 */
  year: number;
  /** 游戏内月份（1-12） */
  month: number;
  /** 游戏内日期（1-30） */
  day: number;
  /** 游戏内时辰（1-12，对应子丑寅卯...） */
  hour: number;
  
  /** 主角初始年龄 */
  baseAge: number;
  /** 总游戏时间（秒），用于计算年龄 */
  totalGameSeconds: number;
  
  /** 当前世界纪元名称 */
  eraName: string;
}

/**
 * 时间系统完整状态
 */
export interface TimeSystemState {
  realTime: RealTimeState;
  gameTime: GameTimeState;
}

// ============================================
// 常量定义
// ============================================

/** 时辰名称 */
export const HOUR_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 月份名称 */
export const MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', 
                            '七月', '八月', '九月', '十月', '冬月', '腊月'];

/** 游戏时间缩放比例：1秒现实时间 = 1分钟游戏时间（可选） */
export const GAME_TIME_SCALE = 60;

/** 默认初始年龄 */
export const DEFAULT_BASE_AGE = 16;

/** 各行为消耗的游戏时间（秒） */
export const ACTION_TIME_COST = {
  /** 修炼一次：1小时 */
  cultivate: 3600,
  /** 历练一次：2小时 */
  explore: 7200,
  /** 战斗一次：30分钟 */
  battle: 1800,
  /** 炼丹一次：4小时 */
  alchemy: 14400,
  /** 炼器一次：6小时 */
  forge: 21600,
  /** 突破：12小时 */
  breakthrough: 43200,
  /** 休息：8小时 */
  rest: 28800,
  /** 日常任务：1小时 */
  dailyTask: 3600,
};

// ============================================
// 默认值
// ============================================

export function getDefaultRealTimeState(): RealTimeState {
  const now = Date.now();
  return {
    lastLoginTime: now,
    lastLogoutTime: 0,
    exploreCooldown: null,
    dailyTaskRefreshTime: now,
    shopRefreshTime: now,
    blackMarketRefreshTime: now,
    customCooldowns: {},
  };
}

export function getDefaultGameTimeState(baseAge: number = DEFAULT_BASE_AGE): GameTimeState {
  return {
    year: 1,
    month: 1,
    day: 1,
    hour: 6, // 默认从辰时（早上）开始
    baseAge,
    totalGameSeconds: 0,
    eraName: '初元',
  };
}

// ============================================
// 冷却时间管理
// ============================================

/**
 * 检查冷却是否结束
 */
export function isCooldownEnded(cooldown: CooldownRecord | null, currentTime: number = Date.now()): boolean {
  if (!cooldown) return true;
  return currentTime >= cooldown.startTime + cooldown.duration;
}

/**
 * 获取冷却剩余时间（毫秒）
 * 返回 0 表示已结束
 */
export function getCooldownRemaining(cooldown: CooldownRecord | null, currentTime: number = Date.now()): number {
  if (!cooldown) return 0;
  const remaining = cooldown.startTime + cooldown.duration - currentTime;
  return Math.max(0, remaining);
}

/**
 * 获取冷却进度（0-1）
 */
export function getCooldownProgress(cooldown: CooldownRecord | null, currentTime: number = Date.now()): number {
  if (!cooldown) return 1;
  const elapsed = currentTime - cooldown.startTime;
  return Math.min(1, elapsed / cooldown.duration);
}

/**
 * 创建新的冷却记录
 */
export function createCooldown(duration: number, startTime: number = Date.now()): CooldownRecord {
  return {
    startTime,
    duration,
  };
}

/**
 * 处理离线期间的冷却时间
 * 返回已过期的冷却ID列表
 */
export function processOfflineCooldowns(
  cooldowns: Record<string, CooldownRecord>,
  currentTime: number = Date.now()
): string[] {
  const expiredIds: string[] = [];
  for (const [id, cooldown] of Object.entries(cooldowns)) {
    if (isCooldownEnded(cooldown, currentTime)) {
      expiredIds.push(id);
    }
  }
  return expiredIds;
}

// ============================================
// 每日刷新相关
// ============================================

/**
 * 检查是否需要每日刷新
 * 每日凌晨0点刷新
 */
export function shouldDailyRefresh(lastRefreshTime: number, currentTime: number = Date.now()): boolean {
  const lastDate = new Date(lastRefreshTime);
  const currentDate = new Date(currentTime);
  
  // 比较日期（年月日）
  return lastDate.getFullYear() !== currentDate.getFullYear() ||
         lastDate.getMonth() !== currentDate.getMonth() ||
         lastDate.getDate() !== currentDate.getDate();
}

/**
 * 获取距离下次每日刷新的时间（毫秒）
 */
export function getNextDailyRefreshIn(currentTime: number = Date.now()): number {
  const now = new Date(currentTime);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

// ============================================
// 游戏时间管理
// ============================================

/**
 * 计算主角当前年龄
 */
export function calculateCurrentAge(gameTime: GameTimeState): number {
  // 总游戏秒数转换为年（假设1年 = 365天 = 31536000秒）
  const yearsFromPlay = Math.floor(gameTime.totalGameSeconds / 31536000);
  return gameTime.baseAge + yearsFromPlay;
}

/**
 * 消耗游戏时间
 */
export function consumeGameTime(gameTime: GameTimeState, seconds: number): GameTimeState {
  const newTotalSeconds = gameTime.totalGameSeconds + seconds;
  
  // 计算新的日期
  let remainingSeconds = newTotalSeconds;
  
  // 每天有 12 时辰，每时辰 = 2小时 = 7200秒
  const secondsPerHour = 7200; // 一个时辰的秒数
  const secondsPerDay = secondsPerHour * 12; // 一天的秒数
  const secondsPerMonth = secondsPerDay * 30; // 一月的秒数
  const secondsPerYear = secondsPerMonth * 12; // 一年的秒数
  
  const year = Math.floor(remainingSeconds / secondsPerYear) + 1;
  remainingSeconds %= secondsPerYear;
  
  const month = Math.floor(remainingSeconds / secondsPerMonth) + 1;
  remainingSeconds %= secondsPerMonth;
  
  const day = Math.floor(remainingSeconds / secondsPerDay) + 1;
  remainingSeconds %= secondsPerDay;
  
  const hour = Math.floor(remainingSeconds / secondsPerHour) + 1;
  
  return {
    ...gameTime,
    year,
    month,
    day,
    hour,
    totalGameSeconds: newTotalSeconds,
  };
}

/**
 * 获取时辰名称
 */
export function getHourName(hour: number): string {
  const index = ((hour - 1) % 12 + 12) % 12;
  return HOUR_NAMES[index];
}

/**
 * 获取完整时间字符串
 */
export function formatGameTime(gameTime: GameTimeState): string {
  const hourName = getHourName(gameTime.hour);
  const age = calculateCurrentAge(gameTime);
  return `${gameTime.eraName}${gameTime.year}年${MONTH_NAMES[gameTime.month - 1]}${gameTime.day}日 ${hourName}时 (${age}岁)`;
}

/**
 * 获取简短时间字符串（用于顶栏显示）
 */
export function formatGameTimeShort(gameTime: GameTimeState): string {
  const hourName = getHourName(gameTime.hour);
  const age = calculateCurrentAge(gameTime);
  return `第${gameTime.year}年${gameTime.month}月${gameTime.day}日 ${hourName}时 · ${age}岁`;
}

// ============================================
// 离线时间处理
// ============================================

/**
 * 离线计算结果
 */
export interface OfflineCalcResult {
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 已过期的冷却列表 */
  expiredCooldowns: string[];
  /** 需要每日刷新的项目 */
  needsDailyRefresh: boolean;
  /** 需要商店刷新 */
  needsShopRefresh: boolean;
  /** 需要黑市刷新 */
  needsBlackMarketRefresh: boolean;
}

/**
 * 计算离线期间的变化
 */
export function calculateOfflineChanges(
  realTime: RealTimeState,
  currentTime: number = Date.now()
): OfflineCalcResult {
  const offlineDuration = currentTime - realTime.lastLogoutTime;
  
  // 处理自定义冷却
  const expiredCooldowns = processOfflineCooldowns(realTime.customCooldowns, currentTime);
  
  // 检查每日刷新
  const needsDailyRefresh = shouldDailyRefresh(realTime.dailyTaskRefreshTime, currentTime);
  
  // 检查商店刷新
  const needsShopRefresh = shouldDailyRefresh(realTime.shopRefreshTime, currentTime);
  
  // 检查黑市刷新
  const needsBlackMarketRefresh = shouldDailyRefresh(realTime.blackMarketRefreshTime, currentTime);
  
  return {
    offlineDuration,
    expiredCooldowns,
    needsDailyRefresh,
    needsShopRefresh,
    needsBlackMarketRefresh,
  };
}

/**
 * 登录时处理离线时间
 */
export function processLogin(
  realTime: RealTimeState,
  currentTime: number = Date.now()
): {
  updatedRealTime: RealTimeState;
  offlineResult: OfflineCalcResult;
} {
  const offlineResult = calculateOfflineChanges(realTime, currentTime);
  
  // 清除已过期的冷却
  const newCustomCooldowns = { ...realTime.customCooldowns };
  for (const id of offlineResult.expiredCooldowns) {
    delete newCustomCooldowns[id];
  }
  
  // 清除历练冷却（如果已过期）
  const newExploreCooldown = isCooldownEnded(realTime.exploreCooldown, currentTime) 
    ? null 
    : realTime.exploreCooldown;
  
  const updatedRealTime: RealTimeState = {
    ...realTime,
    lastLoginTime: currentTime,
    exploreCooldown: newExploreCooldown,
    customCooldowns: newCustomCooldowns,
  };
  
  return {
    updatedRealTime,
    offlineResult,
  };
}

/**
 * 登出时保存时间状态
 */
export function processLogout(realTime: RealTimeState): RealTimeState {
  return {
    ...realTime,
    lastLogoutTime: Date.now(),
  };
}

// ============================================
// 格式化工具
// ============================================

/**
 * 格式化剩余时间为可读字符串
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '已就绪';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}天${remainingHours}小时`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分钟`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }
  
  return `${seconds}秒`;
}

/**
 * 格式化离线时间为友好字符串
 */
export function formatOfflineTime(ms: number): string {
  if (ms <= 0) return '刚刚';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天`;
  }
  
  if (hours > 0) {
    return `${hours}小时`;
  }
  
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  
  return `${seconds}秒`;
}
