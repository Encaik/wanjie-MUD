/**
 * 统一时间戳处理模块
 * 用于管理游戏中的各种时间相关计算，支持离线计算
 */

// ============================================
// 类型定义
// ============================================

export interface TimeBasedResource {
  /** 当前值 */
  current: number;
  /** 最大值 */
  max: number;
  /** 上次更新时间戳（毫秒） */
  lastUpdate: number;
  /** 恢复间隔（毫秒） */
  recoveryInterval: number;
  /** 每次恢复量 */
  recoveryAmount: number;
}

export interface DailyRefreshable {
  /** 上次刷新时间戳（毫秒） */
  lastRefresh: number;
  /** 刷新时间（小时，0-23） */
  refreshHour: number;
}

export interface OfflineCalculationResult<T> {
  /** 更新后的资源 */
  updated: T;
  /** 离线期间恢复的数量 */
  recoveredAmount: number;
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 是否需要通知用户 */
  shouldNotify: boolean;
}

export interface DailyRefreshResult<T> {
  /** 更新后的状态 */
  updated: T;
  /** 是否触发了刷新 */
  didRefresh: boolean;
  /** 距离下次刷新的时间（毫秒） */
  nextRefreshIn: number;
}

// ============================================
// 核心计算函数
// ============================================

/**
 * 计算离线期间的资源恢复
 * @param resource 资源状态
 * @param currentTime 当前时间戳
 * @returns 计算结果
 */
export function calculateOfflineRecovery(
  resource: TimeBasedResource,
  currentTime: number = Date.now()
): OfflineCalculationResult<TimeBasedResource> {
  const offlineDuration = currentTime - resource.lastUpdate;
  const recoveredAmount = Math.floor(offlineDuration / resource.recoveryInterval) * resource.recoveryAmount;
  
  // 计算新值，不超过最大值
  const newCurrent = Math.min(resource.max, resource.current + recoveredAmount);
  const actualRecovered = newCurrent - resource.current;
  
  // 计算剩余恢复进度（用于精确显示）
  const remainingProgress = offlineDuration % resource.recoveryInterval;
  const newLastUpdate = currentTime - remainingProgress;
  
  return {
    updated: {
      ...resource,
      current: newCurrent,
      lastUpdate: newLastUpdate,
    },
    recoveredAmount: actualRecovered,
    offlineDuration,
    shouldNotify: actualRecovered > 0,
  };
}

/**
 * 计算距离下次恢复的时间
 * @param resource 资源状态
 * @param currentTime 当前时间戳
 * @returns 距离下次恢复的毫秒数
 */
export function getNextRecoveryIn(
  resource: TimeBasedResource,
  currentTime: number = Date.now()
): number {
  if (resource.current >= resource.max) {
    return 0; // 已满，不需要恢复
  }
  
  const elapsed = currentTime - resource.lastUpdate;
  const remaining = resource.recoveryInterval - (elapsed % resource.recoveryInterval);
  return remaining;
}

/**
 * 格式化剩余时间为可读字符串
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '已就绪';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
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

// ============================================
// 每日刷新相关
// ============================================

/**
 * 计算是否应该触发每日刷新
 * @param refreshable 可刷新对象
 * @param currentTime 当前时间戳
 * @returns 是否应该刷新和距离下次刷新的时间
 */
export function shouldDailyRefresh(
  refreshable: DailyRefreshable,
  currentTime: number = Date.now()
): { shouldRefresh: boolean; nextRefreshIn: number } {
  const now = new Date(currentTime);
  const today = new Date(now);
  today.setHours(refreshable.refreshHour, 0, 0, 0);
  
  // 如果当前时间还没到今天的刷新点，下次刷新是今天
  // 如果当前时间已过今天的刷新点，下次刷新是明天
  let nextRefresh: Date;
  if (now.getHours() >= refreshable.refreshHour) {
    nextRefresh = new Date(today);
    nextRefresh.setDate(nextRefresh.getDate() + 1);
  } else {
    nextRefresh = today;
  }
  
  const lastRefreshDate = new Date(refreshable.lastRefresh);
  const lastRefreshDay = new Date(lastRefreshDate);
  lastRefreshDay.setHours(0, 0, 0, 0);
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // 如果上次刷新是在今天刷新点之前，则需要刷新
  const shouldRefresh = lastRefreshDate < today;
  
  return {
    shouldRefresh,
    nextRefreshIn: nextRefresh.getTime() - currentTime,
  };
}

/**
 * 获取距离下次刷新的时间字符串
 * @param refreshable 可刷新对象
 * @param currentTime 当前时间戳
 * @returns 时间字符串
 */
export function getNextDailyRefreshString(
  refreshable: DailyRefreshable,
  currentTime: number = Date.now()
): string {
  const { nextRefreshIn } = shouldDailyRefresh(refreshable, currentTime);
  return formatRemainingTime(nextRefreshIn);
}

// ============================================
// 体力系统相关
// ============================================

/** 体力恢复间隔：5分钟 */
export const STAMINA_RECOVERY_INTERVAL = 5 * 60 * 1000; // 5分钟
/** 每次恢复量：1点 */
export const STAMINA_RECOVERY_AMOUNT = 1;
/** 默认最大体力 */
export const DEFAULT_MAX_STAMINA = 100;

/**
 * 创建初始体力状态
 * @param maxStamina 最大体力
 * @returns 体力状态
 */
export function createInitialStamina(maxStamina: number = DEFAULT_MAX_STAMINA): TimeBasedResource {
  return {
    current: maxStamina,
    max: maxStamina,
    lastUpdate: Date.now(),
    recoveryInterval: STAMINA_RECOVERY_INTERVAL,
    recoveryAmount: STAMINA_RECOVERY_AMOUNT,
  };
}

/**
 * 计算离线期间的体力恢复
 * @param stamina 当前体力状态
 * @param currentTime 当前时间戳
 * @returns 更新后的体力状态
 */
export function calculateOfflineStamina(
  stamina: TimeBasedResource,
  currentTime: number = Date.now()
): OfflineCalculationResult<TimeBasedResource> {
  return calculateOfflineRecovery(stamina, currentTime);
}

// ============================================
// 黑市刷新相关
// ============================================

/** 黑市刷新时间点：每天0点 */
export const BLACK_MARKET_REFRESH_HOUR = 0;

/**
 * 创建初始黑市刷新状态
 * @returns 黑市刷新状态
 */
export function createInitialBlackMarketRefresh(): DailyRefreshable {
  return {
    lastRefresh: Date.now(),
    refreshHour: BLACK_MARKET_REFRESH_HOUR,
  };
}

/**
 * 检查黑市是否需要刷新
 * @param lastRefresh 上次刷新时间
 * @param currentTime 当前时间
 * @returns 是否需要刷新
 */
export function shouldBlackMarketRefresh(
  lastRefresh: number,
  currentTime: number = Date.now()
): boolean {
  const result = shouldDailyRefresh({
    lastRefresh,
    refreshHour: BLACK_MARKET_REFRESH_HOUR,
  }, currentTime);
  return result.shouldRefresh;
}

// ============================================
// 批量离线计算
// ============================================

export interface OfflineGameState {
  stamina?: TimeBasedResource;
  blackMarketLastRefresh?: number;
  lastOnlineTime: number;
}

export interface OfflineCalculationOptions {
  /** 是否计算体力恢复 */
  calculateStamina?: boolean;
  /** 是否计算黑市刷新 */
  calculateBlackMarket?: boolean;
  /** 最大离线计算时长（毫秒），默认24小时 */
  maxOfflineDuration?: number;
}

export interface OfflineCalculationAllResult {
  stamina?: OfflineCalculationResult<TimeBasedResource>;
  blackMarketRefresh: boolean;
  totalOfflineDuration: number;
}

/**
 * 批量计算所有需要离线更新的内容
 * @param state 游戏状态
 * @param options 计算选项
 * @returns 计算结果
 */
export function calculateAllOfflineUpdates(
  state: OfflineGameState,
  options: OfflineCalculationOptions = {}
): OfflineCalculationAllResult {
  const currentTime = Date.now();
  const maxOfflineDuration = options.maxOfflineDuration ?? 24 * 60 * 60 * 1000; // 默认最大24小时
  
  // 限制离线时间，防止异常数据
  const effectiveLastOnline = Math.max(
    state.lastOnlineTime,
    currentTime - maxOfflineDuration
  );
  
  const result: OfflineCalculationAllResult = {
    blackMarketRefresh: false,
    totalOfflineDuration: currentTime - effectiveLastOnline,
  };
  
  // 计算体力恢复
  if (options.calculateStamina !== false && state.stamina) {
    // 使用受限的离线时间进行计算
    const adjustedStamina = {
      ...state.stamina,
      lastUpdate: Math.max(state.stamina.lastUpdate, effectiveLastOnline),
    };
    result.stamina = calculateOfflineRecovery(adjustedStamina, currentTime);
  }
  
  // 计算黑市刷新
  if (options.calculateBlackMarket !== false && state.blackMarketLastRefresh) {
    result.blackMarketRefresh = shouldBlackMarketRefresh(state.blackMarketLastRefresh, currentTime);
  }
  
  return result;
}

// ============================================
// 工具函数
// ============================================

/**
 * 检查时间戳是否是今天
 * @param timestamp 时间戳
 * @returns 是否是今天
 */
export function isToday(timestamp: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(timestamp);
  target.setHours(0, 0, 0, 0);
  return today.getTime() === target.getTime();
}

/**
 * 获取今天的开始时间戳（0点）
 * @returns 今天的开始时间戳
 */
export function getTodayStart(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

/**
 * 获取明天的开始时间戳（0点）
 * @returns 明天的开始时间戳
 */
export function getTomorrowStart(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * 计算两个时间戳之间的天数差
 * @param timestamp1 时间戳1
 * @param timestamp2 时间戳2
 * @returns 天数差
 */
export function getDaysDifference(timestamp1: number, timestamp2: number): number {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / (24 * 60 * 60 * 1000)));
}
