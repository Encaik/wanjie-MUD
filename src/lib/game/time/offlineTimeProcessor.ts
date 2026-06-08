/**
 * 统一离线时间处理器
 * 
 * 核心原则：
 * 1. 所有倒计时存储"开始时间戳 + 持续时间"，而非"剩余时间"
 * 2. 离线时自动计算时间流逝，更新相应状态
 * 3. 统一处理：体力恢复、冷却时间、每日刷新、HP/MP恢复等
 * 4. 高性能批量计算：避免循环升级导致的性能问题
 */

import { 
  RealTimeState, 
  CooldownRecord,
  isCooldownEnded,
  shouldDailyRefresh,
  getDefaultRealTimeState,
} from './timeSystem';
import { TOWER_CONFIG } from '../tower/types';
import { Protagonist } from '../types';

// ============================================
// 类型定义
// ============================================

/**
 * 离线时间处理配置
 */
export interface OfflineTimeConfig {
  /** 体力恢复间隔（毫秒），默认5分钟 */
  staminaRecoverInterval: number;
  /** 每次体力恢复数量，默认1点 */
  staminaRecoverAmount: number;
  /** HP恢复间隔（毫秒），默认5分钟 */
  hpRecoverInterval: number;
  /** 每次HP恢复百分比，默认5% */
  hpRecoverPercent: number;
  /** MP恢复间隔（毫秒），默认5分钟 */
  mpRecoverInterval: number;
  /** 每次MP恢复百分比，默认8% */
  mpRecoverPercent: number;
  /** 显示离线弹窗的最小离线时间（毫秒），默认30秒 */
  minOfflineTimeForDialog: number;
  /** 最大离线时间（毫秒），默认8小时 */
  maxOfflineTime: number;
  /** 自动修炼间隔（毫秒），默认3秒 */
  autoCultivateInterval: number;
  /** 自动修炼每次消耗灵石 */
  autoCultivateSpiritStoneCost: number;
  /** 自动修炼每次获得经验基础值 */
  autoCultivateExpBase: number;
  /** 自动修炼每次获得经验等级系数 */
  autoCultivateExpPerLevel: number;
  /** 离线修炼效率系数 */
  offlineCultivateEfficiency: number;
}

/**
 * 默认配置
 */
export const DEFAULT_OFFLINE_TIME_CONFIG: OfflineTimeConfig = {
  staminaRecoverInterval: 5 * 60 * 1000, // 5分钟
  staminaRecoverAmount: 1,
  hpRecoverInterval: 5 * 60 * 1000, // 5分钟
  hpRecoverPercent: 0.05, // 5%
  mpRecoverInterval: 5 * 60 * 1000, // 5分钟
  mpRecoverPercent: 0.08, // 8%
  minOfflineTimeForDialog: 30 * 1000, // 30秒
  maxOfflineTime: 8 * 60 * 60 * 1000, // 8小时
  autoCultivateInterval: 3000, // 3秒
  autoCultivateSpiritStoneCost: 20, // 每次消耗20灵石
  autoCultivateExpBase: 10, // 基础经验
  autoCultivateExpPerLevel: 2, // 每等级增加经验
  offlineCultivateEfficiency: 0.5, // 离线效率50%
};

/**
 * 离线时间处理结果
 */
export interface OfflineTimeResult {
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 格式化的离线时长 */
  offlineDurationText: string;
  
  // === 时间相关更新 ===
  /** 更新后的现实时间状态 */
  updatedRealTime: RealTimeState;
  
  // === 体力恢复 ===
  /** 恢复的体力数量 */
  staminaRecovered: number;
  
  // === HP/MP恢复 ===
  /** 恢复的HP数量 */
  hpRecovered: number;
  /** 恢复的MP数量 */
  mpRecovered: number;
  
  // === 冷却处理 ===
  /** 已过期的冷却ID列表 */
  expiredCooldowns: string[];
  /** 历练冷却是否已过期 */
  exploreCooldownExpired: boolean;
  
  // === 每日刷新 ===
  /** 需要每日刷新（任务等） */
  needsDailyRefresh: boolean;
  /** 需要商店刷新 */
  needsShopRefresh: boolean;
  /** 需要黑市刷新 */
  needsBlackMarketRefresh: boolean;
  
  // === 任务冷却 ===
  /** 已过期的任务冷却ID列表 */
  expiredTaskCooldowns: string[];
  
  // === 自动修炼 ===
  /** 自动修炼结果 */
  autoCultivateResult?: AutoCultivateResult;
}

/**
 * 自动修炼计算结果
 */
export interface AutoCultivateResult {
  /** 是否执行了自动修炼 */
  executed: boolean;
  /** 修炼次数 */
  cultivateCount: number;
  /** 消耗的灵石 */
  spiritStonesSpent: number;
  /** 获得的总经验 */
  totalExpGained: number;
  /** 升级前的等级 */
  startLevel: number;
  /** 升级后的等级 */
  endLevel: number;
  /** 升级后的经验 */
  endExperience: number;
  /** 是否因灵石不足停止 */
  stoppedByResource: boolean;
}

// ============================================
// 工具函数
// ============================================

/**
 * 格式化离线时长
 */
export function formatOfflineDuration(ms: number): string {
  if (ms <= 0) return '刚刚';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
  
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  
  return `${seconds}秒`;
}

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

// ============================================
// 高性能批量升级计算
// ============================================

/**
 * 经验公式（与 cultivation.ts 保持一致）
 * baseExp = 100, growthFactor = 1.15
 * getExperienceForLevel(level) = baseExp * Math.pow(growthFactor, level - 1)
 */
const EXP_BASE = 100;
const EXP_GROWTH_FACTOR = 1.15;
const MAX_LEVEL = 100;

/**
 * 获取指定等级所需经验
 */
function getExperienceForLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(EXP_GROWTH_FACTOR, level - 1));
}

/**
 * 获取从 level1 升到 level2 所需的总经验
 * 使用等比数列求和公式
 */
function getTotalExperienceBetweenLevels(level1: number, level2: number): number {
  if (level1 >= level2) return 0;
  
  // 等比数列求和: S = a1 * (q^n - 1) / (q - 1)
  // 这里 a1 = EXP_BASE * EXP_GROWTH_FACTOR^(level1), q = EXP_GROWTH_FACTOR, n = level2 - level1
  const a1 = EXP_BASE * Math.pow(EXP_GROWTH_FACTOR, level1);
  const n = level2 - level1;
  return Math.floor(a1 * (Math.pow(EXP_GROWTH_FACTOR, n) - 1) / (EXP_GROWTH_FACTOR - 1));
}

/**
 * 高性能批量计算升级结果
 * 
 * 关键优化：
 * 1. 使用数学公式直接计算最终等级，避免循环
 * 2. 处理满级情况
 * 3. 返回完整的升级结果
 * 
 * @param currentLevel 当前等级
 * @param currentExp 当前经验（当前等级内的进度）
 * @param totalExpGained 获得的总经验
 * @param maxLevel 最大等级（默认100）
 */
export function calculateBatchLevelUp(
  currentLevel: number,
  currentExp: number,
  totalExpGained: number,
  maxLevel: number = MAX_LEVEL
): {
  newLevel: number;
  newExp: number;
  levelsGained: number;
} {
  // 如果已经满级，经验只增加不升级
  if (currentLevel >= maxLevel) {
    const maxExp = getExperienceForLevel(maxLevel);
    return {
      newLevel: maxLevel,
      newExp: Math.min(currentExp + totalExpGained, maxExp),
      levelsGained: 0,
    };
  }
  
  // 当前等级升到下一级所需经验
  const currentLevelMaxExp = getExperienceForLevel(currentLevel);
  const expAfterCurrentLevel = currentExp + totalExpGained;
  
  // 如果经验不足以升级
  if (expAfterCurrentLevel < currentLevelMaxExp) {
    return {
      newLevel: currentLevel,
      newExp: expAfterCurrentLevel,
      levelsGained: 0,
    };
  }
  
  // 计算可以升多少级
  // 使用二分查找确定最终等级（因为经验公式是指数增长的）
  let low = currentLevel;
  let high = maxLevel;
  let targetLevel = currentLevel;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const totalExpNeeded = getTotalExperienceBetweenLevels(currentLevel, mid) 
                          + (mid > currentLevel ? getExperienceForLevel(currentLevel) - currentExp : 0);
    
    if (totalExpNeeded <= totalExpGained) {
      targetLevel = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // 限制最大等级
  targetLevel = Math.min(targetLevel, maxLevel);
  
  // 计算剩余经验
  // 总消耗 = 从当前等级升到目标等级消耗的经验
  let totalExpConsumed = 0;
  for (let level = currentLevel; level < targetLevel; level++) {
    const levelMaxExp = getExperienceForLevel(level);
    totalExpConsumed += levelMaxExp - (level === currentLevel ? currentExp : 0);
  }
  
  // 目标等级的进度经验
  const remainingExp = totalExpGained - totalExpConsumed;
  const targetLevelMaxExp = getExperienceForLevel(targetLevel);
  const newExp = Math.min(remainingExp, targetLevelMaxExp);
  
  return {
    newLevel: targetLevel,
    newExp,
    levelsGained: targetLevel - currentLevel,
  };
}

/**
 * 计算自动修炼收益
 */
function calculateAutoCultivation(
  autoCultivating: boolean,
  protagonist: Protagonist,
  offlineDuration: number,
  config: OfflineTimeConfig
): AutoCultivateResult {
  // 默认结果
  const defaultResult: AutoCultivateResult = {
    executed: false,
    cultivateCount: 0,
    spiritStonesSpent: 0,
    totalExpGained: 0,
    startLevel: protagonist.level,
    endLevel: protagonist.level,
    endExperience: protagonist.experience || 0,
    stoppedByResource: false,
  };
  
  // 如果没有开启自动修炼，直接返回
  if (!autoCultivating) {
    return defaultResult;
  }
  
  // 计算可以修炼的次数
  const maxCultivateCount = Math.floor(offlineDuration / config.autoCultivateInterval);
  
  if (maxCultivateCount <= 0) {
    return defaultResult;
  }
  
  // 获取当前灵石数量
  const spiritStoneItem = protagonist.inventory.find(
    item => item.definition.id === 'spirit_stone' || item.definition.type === '灵石'
  );
  const currentSpiritStones = spiritStoneItem?.quantity || 0;
  
  // 计算实际可以修炼的次数（受灵石限制）
  const possibleCount = Math.floor(currentSpiritStones / config.autoCultivateSpiritStoneCost);
  const actualCultivateCount = Math.min(maxCultivateCount, possibleCount);
  
  // 如果灵石不足一次修炼
  if (actualCultivateCount <= 0) {
    return {
      ...defaultResult,
      stoppedByResource: true,
    };
  }
  
  // 计算获得的总经验
  const expPerCultivation = config.autoCultivateExpBase + protagonist.level * config.autoCultivateExpPerLevel;
  const totalExpGained = Math.floor(
    expPerCultivation * actualCultivateCount * config.offlineCultivateEfficiency
  );
  
  // 使用高性能批量升级计算
  const levelUpResult = calculateBatchLevelUp(
    protagonist.level,
    protagonist.experience || 0,
    totalExpGained
  );
  
  return {
    executed: true,
    cultivateCount: actualCultivateCount,
    spiritStonesSpent: actualCultivateCount * config.autoCultivateSpiritStoneCost,
    totalExpGained,
    startLevel: protagonist.level,
    endLevel: levelUpResult.newLevel,
    endExperience: levelUpResult.newExp,
    stoppedByResource: actualCultivateCount < maxCultivateCount,
  };
}

/**
 * 计算体力恢复
 */
function calculateStaminaRecovery(
  currentStamina: number,
  maxStamina: number,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineTimeConfig
): { recovered: number; newStamina: number; newLastRecoverTime: number } {
  // 如果已满，不需要恢复
  if (currentStamina >= maxStamina) {
    return {
      recovered: 0,
      newStamina: currentStamina,
      newLastRecoverTime: currentTime,
    };
  }
  
  // 如果没有上次恢复时间，使用当前时间
  const lastRecover = lastRecoverTime ?? currentTime;
  
  // 计算经过的时间
  const timePassed = currentTime - lastRecover;
  
  // 计算可以恢复的次数
  const recoveries = Math.floor(timePassed / config.staminaRecoverInterval);
  
  if (recoveries <= 0) {
    return {
      recovered: 0,
      newStamina: currentStamina,
      newLastRecoverTime: lastRecover,
    };
  }
  
  // 计算恢复的体力
  const totalRecovery = recoveries * config.staminaRecoverAmount;
  const newStamina = Math.min(maxStamina, currentStamina + totalRecovery);
  const actualRecovered = newStamina - currentStamina;
  
  // 计算新的上次恢复时间（考虑部分时间可能未用于恢复）
  const usedTime = recoveries * config.staminaRecoverInterval;
  const newLastRecoverTime = lastRecover + usedTime;
  
  return {
    recovered: actualRecovered,
    newStamina,
    newLastRecoverTime,
  };
}

/**
 * 计算HP恢复
 */
function calculateHpRecovery(
  currentHp: number,
  maxHp: number,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineTimeConfig
): { recovered: number; newHp: number; newLastRecoverTime: number } {
  if (currentHp >= maxHp) {
    return { recovered: 0, newHp: currentHp, newLastRecoverTime: currentTime };
  }
  
  const lastRecover = lastRecoverTime ?? currentTime;
  const timePassed = currentTime - lastRecover;
  const recoveries = Math.floor(timePassed / config.hpRecoverInterval);
  
  if (recoveries <= 0) {
    return { recovered: 0, newHp: currentHp, newLastRecoverTime: lastRecover };
  }
  
  const recoveryPerTick = Math.floor(maxHp * config.hpRecoverPercent);
  const totalRecovery = recoveries * recoveryPerTick;
  const newHp = Math.min(maxHp, currentHp + totalRecovery);
  const actualRecovered = newHp - currentHp;
  const usedTime = recoveries * config.hpRecoverInterval;
  const newLastRecoverTime = lastRecover + usedTime;
  
  return { recovered: actualRecovered, newHp, newLastRecoverTime };
}

/**
 * 计算MP恢复
 */
function calculateMpRecovery(
  currentMp: number,
  maxMp: number,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineTimeConfig
): { recovered: number; newMp: number; newLastRecoverTime: number } {
  if (currentMp >= maxMp) {
    return { recovered: 0, newMp: currentMp, newLastRecoverTime: currentTime };
  }
  
  const lastRecover = lastRecoverTime ?? currentTime;
  const timePassed = currentTime - lastRecover;
  const recoveries = Math.floor(timePassed / config.mpRecoverInterval);
  
  if (recoveries <= 0) {
    return { recovered: 0, newMp: currentMp, newLastRecoverTime: lastRecover };
  }
  
  const recoveryPerTick = Math.floor(maxMp * config.mpRecoverPercent);
  const totalRecovery = recoveries * recoveryPerTick;
  const newMp = Math.min(maxMp, currentMp + totalRecovery);
  const actualRecovered = newMp - currentMp;
  const usedTime = recoveries * config.mpRecoverInterval;
  const newLastRecoverTime = lastRecover + usedTime;
  
  return { recovered: actualRecovered, newMp, newLastRecoverTime };
}

/**
 * 处理过期的冷却
 */
function processExpiredCooldowns(
  cooldowns: Record<string, CooldownRecord>,
  currentTime: number
): string[] {
  const expiredIds: string[] = [];
  for (const [id, cooldown] of Object.entries(cooldowns)) {
    if (isCooldownEnded(cooldown, currentTime)) {
      expiredIds.push(id);
    }
  }
  return expiredIds;
}

/**
 * 处理任务冷却
 */
function processTaskCooldowns(
  taskCooldowns: Record<string, number>, // taskId -> cooldownEndTime
  currentTime: number
): string[] {
  const expiredIds: string[] = [];
  for (const [taskId, endTime] of Object.entries(taskCooldowns)) {
    if (currentTime >= endTime) {
      expiredIds.push(taskId);
    }
  }
  return expiredIds;
}

// ============================================
// 主处理函数
// ============================================

/**
 * 处理离线时间
 * 
 * 这是核心函数，统一处理所有与时间相关的离线补偿
 */
export function processOfflineTime(
  realTime: RealTimeState | undefined,
  protagonist: Protagonist | undefined,
  taskCooldowns: Record<string, number> | undefined,
  autoCultivating: boolean = false,
  currentTime: number = Date.now(),
  config: OfflineTimeConfig = DEFAULT_OFFLINE_TIME_CONFIG
): OfflineTimeResult {
  // 获取或创建默认值
  const realTimeState = realTime ?? getDefaultRealTimeState();
  const lastLogoutTime = realTimeState.lastLogoutTime || currentTime;
  
  // 计算离线时长（限制最大值）
  const rawOfflineDuration = currentTime - lastLogoutTime;
  const offlineDuration = Math.min(rawOfflineDuration, config.maxOfflineTime);
  const offlineDurationText = formatOfflineDuration(offlineDuration);
  
  // === 1. 处理体力恢复 ===
  let staminaRecovered = 0;
  let newStamina = protagonist?.stamina ?? 100;
  let newLastStaminaRecover = realTimeState.lastLoginTime;
  
  if (protagonist) {
    const staminaResult = calculateStaminaRecovery(
      protagonist.stamina ?? 100,
      protagonist.maxStamina ?? 100,
      protagonist.lastStaminaRecover,
      currentTime,
      config
    );
    staminaRecovered = staminaResult.recovered;
    newStamina = staminaResult.newStamina;
    newLastStaminaRecover = staminaResult.newLastRecoverTime;
  }
  
  // === 2. 处理HP/MP恢复 ===
  const hpRecovered = 0;
  const mpRecovered = 0;
  
  // === 3. 处理冷却时间 ===
  const expiredCooldowns = processExpiredCooldowns(
    realTimeState.customCooldowns || {},
    currentTime
  );
  const exploreCooldownExpired = realTimeState.exploreCooldown
    ? isCooldownEnded(realTimeState.exploreCooldown, currentTime)
    : false;
  
  // === 4. 处理任务冷却 ===
  const expiredTaskCooldowns = processTaskCooldowns(
    taskCooldowns || {},
    currentTime
  );
  
  // === 5. 检查每日刷新 ===
  const needsDailyRefresh = shouldDailyRefresh(realTimeState.dailyTaskRefreshTime, currentTime);
  const needsShopRefresh = shouldDailyRefresh(realTimeState.shopRefreshTime, currentTime);
  const needsBlackMarketRefresh = shouldDailyRefresh(realTimeState.blackMarketRefreshTime, currentTime);
  
  // === 6. 处理自动修炼 ===
  let autoCultivateResult: AutoCultivateResult | undefined;
  if (protagonist && autoCultivating) {
    autoCultivateResult = calculateAutoCultivation(
      true,
      protagonist,
      offlineDuration,
      config
    );
  }
  
  // === 7. 构建更新后的 RealTimeState ===
  // 清除已过期的冷却
  const newCustomCooldowns = { ...realTimeState.customCooldowns };
  for (const id of expiredCooldowns) {
    delete newCustomCooldowns[id];
  }
  
  const updatedRealTime: RealTimeState = {
    ...realTimeState,
    lastLoginTime: currentTime,
    exploreCooldown: exploreCooldownExpired ? null : realTimeState.exploreCooldown,
    customCooldowns: newCustomCooldowns,
    // 如果需要每日刷新，更新刷新时间
    dailyTaskRefreshTime: needsDailyRefresh ? currentTime : realTimeState.dailyTaskRefreshTime,
    shopRefreshTime: needsShopRefresh ? currentTime : realTimeState.shopRefreshTime,
    blackMarketRefreshTime: needsBlackMarketRefresh ? currentTime : realTimeState.blackMarketRefreshTime,
  };
  
  return {
    offlineDuration,
    offlineDurationText,
    updatedRealTime,
    staminaRecovered,
    hpRecovered,
    mpRecovered,
    expiredCooldowns,
    exploreCooldownExpired,
    needsDailyRefresh,
    needsShopRefresh,
    needsBlackMarketRefresh,
    expiredTaskCooldowns,
    autoCultivateResult,
  };
}

/**
 * 应用离线时间结果到主角
 */
export function applyOfflineTimeToProtagonist(
  protagonist: Protagonist,
  result: OfflineTimeResult
): Protagonist {
  let updated = {
    ...protagonist,
    stamina: (protagonist.stamina ?? 100) + result.staminaRecovered,
    lastStaminaRecover: result.updatedRealTime.lastLoginTime,
  };
  
  // 应用自动修炼结果
  if (result.autoCultivateResult?.executed) {
    const { spiritStonesSpent, endLevel, endExperience } = result.autoCultivateResult;
    
    // 更新等级和经验
    updated = {
      ...updated,
      level: endLevel,
      experience: endExperience,
    };
    
    // 扣除灵石
    const newInventory = [...updated.inventory];
    const spiritStoneIndex = newInventory.findIndex(
      item => item.definition.id === 'spirit_stone' || item.definition.type === '灵石'
    );
    
    if (spiritStoneIndex >= 0) {
      const item = newInventory[spiritStoneIndex];
      newInventory[spiritStoneIndex] = {
        ...item,
        quantity: Math.max(0, item.quantity - spiritStonesSpent),
      };
      updated.inventory = newInventory;
    }
  }
  
  return updated;
}

/**
 * 检查是否应该显示离线弹窗
 */
export function shouldShowOfflineDialog(
  offlineDuration: number,
  config: OfflineTimeConfig = DEFAULT_OFFLINE_TIME_CONFIG
): boolean {
  return offlineDuration >= config.minOfflineTimeForDialog;
}
