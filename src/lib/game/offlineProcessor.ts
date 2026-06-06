/**
 * 离线时间处理模块
 * 
 * 处理玩家关闭页面后的事务：
 * 1. 自动修炼收益（如果开启了自动修炼）
 * 2. 体力恢复
 * 3. 冷却时间自动处理
 * 4. 每日刷新检测
 * 
 * 核心设计原则：
 * - 游戏时间（主角年龄）只在游戏进行中变动
 * - 现实时间（冷却、体力等）即使离线也在流动
 * - 离线收益有上限，防止无限挂机
 */

import { Protagonist, InventoryItem, createInventoryItem } from './types';
import { 
  RealTimeState, 
  GameTimeState,
  CooldownRecord,
  isCooldownEnded,
  getCooldownRemaining,
  createCooldown,
  processOfflineCooldowns,
  shouldDailyRefresh,
} from './timeSystem';

// ============================================
// 类型定义
// ============================================

/**
 * 离线收益类型
 */
export interface OfflineReward {
  /** 经验值 */
  experience: number;
  /** 灵石 */
  spiritStones: number;
  /** 体力恢复 */
  staminaRecovered: number;
  /** 获得的物品 */
  items: Array<{ id: string; name: string; quantity: number }>;
}

/**
 * 离线处理结果
 */
export interface OfflineProcessResult {
  /** 离线时长（毫秒） */
  offlineDuration: number;
  /** 离线时长描述 */
  offlineDurationText: string;
  /** 离线收益 */
  rewards: OfflineReward;
  /** 过期的冷却ID列表 */
  expiredCooldowns: string[];
  /** 需要每日刷新 */
  needsDailyRefresh: boolean;
  /** 体力恢复数量 */
  staminaRecovered: number;
  /** 当前体力（恢复后） */
  currentStamina: number;
  /** 是否有自动修炼 */
  hasAutoCultivation: boolean;
  /** 自动修炼次数 */
  autoCultivationCount: number;
}

/**
 * 离线处理配置
 */
export interface OfflineConfig {
  /** 最大离线时长（毫秒），超过此时间按此时间计算收益 */
  maxOfflineDuration: number;
  /** 体力恢复间隔（毫秒），默认5分钟恢复1点 */
  staminaRecoverInterval: number;
  /** 每次体力恢复数量 */
  staminaRecoverAmount: number;
  /** 自动修炼间隔（毫秒），默认3秒 */
  autoCultivationInterval: number;
  /** 离线修炼效率系数（相比在线） */
  offlineCultivationEfficiency: number;
}

// ============================================
// 默认配置
// ============================================

export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  maxOfflineDuration: 8 * 60 * 60 * 1000, // 8小时
  staminaRecoverInterval: 5 * 60 * 1000, // 5分钟
  staminaRecoverAmount: 1, // 每次1点
  autoCultivationInterval: 3000, // 3秒
  offlineCultivationEfficiency: 0.5, // 离线效率50%
};

// ============================================
// 辅助函数
// ============================================

/**
 * 格式化离线时长
 */
export function formatOfflineDuration(ms: number): string {
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
    return `${minutes}分钟`;
  }
  
  return `${seconds}秒`;
}

/**
 * 计算体力恢复
 */
function calculateStaminaRecovery(
  currentStamina: number,
  maxStamina: number,
  lastRecoverTime: number,
  currentTime: number,
  config: OfflineConfig
): { recovered: number; newStamina: number; lastRecoverTime: number } {
  if (currentStamina >= maxStamina) {
    return { 
      recovered: 0, 
      newStamina: currentStamina, 
      lastRecoverTime: currentTime 
    };
  }
  
  const timePassed = currentTime - lastRecoverTime;
  const recoveries = Math.floor(timePassed / config.staminaRecoverInterval);
  const totalRecovery = recoveries * config.staminaRecoverAmount;
  const newStamina = Math.min(maxStamina, currentStamina + totalRecovery);
  const actualRecovered = newStamina - currentStamina;
  
  // 计算下次恢复时间
  const usedTime = recoveries * config.staminaRecoverInterval;
  const newLastRecoverTime = lastRecoverTime + usedTime;
  
  return {
    recovered: actualRecovered,
    newStamina,
    lastRecoverTime: newLastRecoverTime,
  };
}

/**
 * 计算自动修炼收益
 */
function calculateAutoCultivationRewards(
  protagonist: Protagonist,
  offlineDuration: number,
  config: OfflineConfig
): { experience: number; spiritStones: number } {
  // 只有主角等级和属性决定基础收益
  const baseExpPerCultivation = 10 + protagonist.level * 2;
  const baseSpiritStonesPerCultivation = Math.floor(1 + protagonist.level * 0.5);
  
  // 计算可以修炼的次数
  const cultivationCount = Math.floor(offlineDuration / config.autoCultivationInterval);
  
  // 应用离线效率
  const totalExp = Math.floor(baseExpPerCultivation * cultivationCount * config.offlineCultivationEfficiency);
  const totalSpiritStones = Math.floor(baseSpiritStonesPerCultivation * cultivationCount * config.offlineCultivationEfficiency);
  
  return {
    experience: totalExp,
    spiritStones: totalSpiritStones,
  };
}

// ============================================
// 主要导出函数
// ============================================

/**
 * 处理离线期间的所有事务
 */
export function processOfflineTime(
  protagonist: Protagonist,
  realTime: RealTimeState,
  autoCultivating: boolean,
  config: OfflineConfig = DEFAULT_OFFLINE_CONFIG
): OfflineProcessResult {
  const currentTime = Date.now();
  // 处理 lastLogoutTime 为 0 或 undefined 的情况
  const lastLogout = realTime.lastLogoutTime || currentTime;
  const rawOfflineDuration = currentTime - lastLogout;
  
  // 限制最大离线时长
  const offlineDuration = Math.min(rawOfflineDuration, config.maxOfflineDuration);
  const offlineDurationText = formatOfflineDuration(offlineDuration);
  
  // 处理过期冷却（确保 customCooldowns 存在）
  const expiredCooldowns = processOfflineCooldowns(
    realTime.customCooldowns || {}, 
    currentTime
  );
  
  // 检查每日刷新（确保 dailyTaskRefreshTime 存在）
  const needsDailyRefresh = shouldDailyRefresh(
    realTime.dailyTaskRefreshTime || currentTime, 
    currentTime
  );
  
  // 计算体力恢复（处理 lastStaminaRecover 可能为 undefined 的情况）
  const staminaResult = calculateStaminaRecovery(
    protagonist.stamina ?? 100,
    protagonist.maxStamina ?? 100,
    protagonist.lastStaminaRecover ?? currentTime,
    currentTime,
    config
  );
  
  // 初始化收益
  const rewards: OfflineReward = {
    experience: 0,
    spiritStones: 0,
    staminaRecovered: staminaResult.recovered,
    items: [],
  };
  
  // 计算自动修炼收益（仅当开启自动修炼时）
  let autoCultivationCount = 0;
  if (autoCultivating) {
    const cultivationRewards = calculateAutoCultivationRewards(protagonist, offlineDuration, config);
    rewards.experience += cultivationRewards.experience;
    rewards.spiritStones += cultivationRewards.spiritStones;
    autoCultivationCount = Math.floor(offlineDuration / config.autoCultivationInterval);
  }
  
  return {
    offlineDuration,
    offlineDurationText,
    rewards,
    expiredCooldowns,
    needsDailyRefresh,
    staminaRecovered: staminaResult.recovered,
    currentStamina: staminaResult.newStamina,
    hasAutoCultivation: autoCultivating,
    autoCultivationCount,
  };
}

/**
 * 应用离线处理结果到主角数据
 */
export function applyOfflineResult(
  protagonist: Protagonist,
  result: OfflineProcessResult
): Protagonist {
  const updated = { ...protagonist };
  
  // 应用经验
  if (result.rewards.experience > 0) {
    updated.experience = (updated.experience || 0) + result.rewards.experience;
  }
  
  // 应用灵石（添加到背包）
  if (result.rewards.spiritStones > 0) {
    // 查找背包中是否有灵石
    const spiritStoneIndex = updated.inventory.findIndex(
      item => item.definition.type === '灵石'
    );
    
    if (spiritStoneIndex >= 0) {
      // 增加数量
      updated.inventory = [...updated.inventory];
      updated.inventory[spiritStoneIndex] = {
        ...updated.inventory[spiritStoneIndex],
        quantity: updated.inventory[spiritStoneIndex].quantity + result.rewards.spiritStones,
      };
    } else {
      // 添加新的灵石物品
      updated.inventory = [...updated.inventory, createInventoryItem({
        id: 'spirit_stone',
        name: '灵石',
        type: '灵石',
        rarity: '普通',
        description: '修炼的基础货币',
        effects: [],
        stackable: true,
        maxStack: 999999,
      }, result.rewards.spiritStones)];
    }
  }
  
  // 应用体力
  updated.stamina = result.currentStamina;
  updated.lastStaminaRecover = Date.now();
  
  return updated;
}

/**
 * 更新实时状态（登录时调用）
 */
export function updateRealTimeOnLogin(
  realTime: RealTimeState,
  expiredCooldowns: string[]
): RealTimeState {
  const currentTime = Date.now();
  const newCustomCooldowns = { ...realTime.customCooldowns };
  
  // 清除过期的冷却
  for (const id of expiredCooldowns) {
    delete newCustomCooldowns[id];
  }
  
  return {
    ...realTime,
    lastLoginTime: currentTime,
    customCooldowns: newCustomCooldowns,
    // 清除已过期的历练冷却
    exploreCooldown: isCooldownEnded(realTime.exploreCooldown, currentTime) 
      ? null 
      : realTime.exploreCooldown,
  };
}

/**
 * 更新实时状态（登出时调用）
 */
export function updateRealTimeOnLogout(realTime: RealTimeState): RealTimeState {
  return {
    ...realTime,
    lastLogoutTime: Date.now(),
  };
}

/**
 * 生成离线收益消息
 */
export function generateOfflineMessage(result: OfflineProcessResult): string {
  const parts: string[] = [];
  
  parts.push(`离线${result.offlineDurationText}`);
  
  if (result.rewards.staminaRecovered > 0) {
    parts.push(`恢复体力${result.rewards.staminaRecovered}点`);
  }
  
  if (result.rewards.experience > 0) {
    parts.push(`获得经验${result.rewards.experience}`);
  }
  
  if (result.rewards.spiritStones > 0) {
    parts.push(`获得灵石${result.rewards.spiritStones}`);
  }
  
  return parts.join('，');
}
