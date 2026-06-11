/**
 * 离线时间处理器 — 纯函数命名空间
 *
 * 统一处理离线期间的所有变更：
 * 1. 体力/HP/MP 恢复
 * 2. 冷却过期清理
 * 3. 每日/每周刷新检测
 * 4. 自动修炼收益计算（含批量升级）
 *
 * 合并了旧版 3 个离线处理器（offlineProcessor / offlineTimeProcessor / idleSystem）。
 */

import type { Protagonist } from '@/core/types';

import type { TimeState, OfflineConfig, OfflineResult, AutoCultivateResult } from './types';
import { DEFAULT_OFFLINE_CONFIG, EXP_BASE, EXP_GROWTH_FACTOR, MAX_LEVEL } from './constants';
import { getOfflineDuration, needsDailyRefresh, needsWeeklyRefresh } from './realClock';
import { clearExpired } from './cooldown';
import { duration as formatDuration } from './formatter';

// ============================================
// 工具函数
// ============================================

/** 获取指定等级所需经验 */
function expForLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(EXP_GROWTH_FACTOR, level - 1));
}

/** 获取从 level1 升到 level2 所需的总经验（等比数列求和） */
function totalExpBetween(level1: number, level2: number): number {
  if (level1 >= level2) return 0;
  const a1 = EXP_BASE * Math.pow(EXP_GROWTH_FACTOR, level1);
  const n = level2 - level1;
  return Math.floor(a1 * (Math.pow(EXP_GROWTH_FACTOR, n) - 1) / (EXP_GROWTH_FACTOR - 1));
}

/**
 * 批量计算升级结果（二分查找，避免逐级循环）
 */
function calculateBatchLevelUp(
  currentLevel: number,
  currentExp: number,
  totalExpGained: number,
  maxLevel: number = MAX_LEVEL,
): { newLevel: number; newExp: number; levelsGained: number } {
  if (currentLevel >= maxLevel) {
    const maxExp = expForLevel(maxLevel);
    return { newLevel: maxLevel, newExp: Math.min(currentExp + totalExpGained, maxExp), levelsGained: 0 };
  }

  const currentLevelMaxExp = expForLevel(currentLevel);
  const expAfterCurrentLevel = currentExp + totalExpGained;

  if (expAfterCurrentLevel < currentLevelMaxExp) {
    return { newLevel: currentLevel, newExp: expAfterCurrentLevel, levelsGained: 0 };
  }

  // 二分查找最终等级
  let low = currentLevel;
  let high = maxLevel;
  let targetLevel = currentLevel;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const needed = totalExpBetween(currentLevel, mid)
      + (mid > currentLevel ? expForLevel(currentLevel) - currentExp : 0);

    if (needed <= totalExpGained) {
      targetLevel = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  targetLevel = Math.min(targetLevel, maxLevel);

  // 计算消耗的经验
  let totalExpConsumed = 0;
  for (let level = currentLevel; level < targetLevel; level++) {
    const levelMaxExp = expForLevel(level);
    totalExpConsumed += levelMaxExp - (level === currentLevel ? currentExp : 0);
  }

  const remainingExp = totalExpGained - totalExpConsumed;
  const targetLevelMaxExp = expForLevel(targetLevel);
  const newExp = Math.min(remainingExp, targetLevelMaxExp);

  return { newLevel: targetLevel, newExp, levelsGained: targetLevel - currentLevel };
}

// ============================================
// 恢复计算
// ============================================

/** 通用恢复计算 */
function calculateRecovery(
  current: number,
  max: number,
  lastRecoverTime: number | undefined,
  currentTime: number,
  interval: number,
  amount: (iteration: number) => number,
): { recovered: number; newValue: number; newLastRecoverTime: number } {
  if (current >= max) {
    return { recovered: 0, newValue: current, newLastRecoverTime: currentTime };
  }

  const lastRecover = lastRecoverTime ?? currentTime;
  const timePassed = currentTime - lastRecover;
  const recoveries = Math.floor(timePassed / interval);

  if (recoveries <= 0) {
    return { recovered: 0, newValue: current, newLastRecoverTime: lastRecover };
  }

  let totalRecovery = 0;
  for (let i = 0; i < recoveries; i++) {
    const add = amount(i);
    if (current + totalRecovery + add > max) {
      totalRecovery = max - current;
      break;
    }
    totalRecovery += add;
  }

  const newValue = Math.min(max, current + totalRecovery);
  const actualRecovered = newValue - current;
  const usedTime = Math.ceil(actualRecovered / (totalRecovery > 0 ? totalRecovery / recoveries : 1)) * interval;
  const newLastRecoverTime = Math.min(lastRecover + usedTime, currentTime);

  return { recovered: actualRecovered, newValue, newLastRecoverTime };
}

/** 计算离线体力恢复 */
function calcStaminaRecovery(
  protagonist: Protagonist,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineConfig,
) {
  return calculateRecovery(
    protagonist.stamina ?? 100,
    protagonist.maxStamina ?? 100,
    lastRecoverTime,
    currentTime,
    config.staminaRecoverInterval,
    () => config.staminaRecoverAmount,
  );
}

/** 计算离线 HP 恢复 */
function calcHpRecovery(
  protagonist: Protagonist,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineConfig,
) {
  return calculateRecovery(
    protagonist.currentHp,
    protagonist.maxHp,
    lastRecoverTime,
    currentTime,
    config.hpRecoverInterval,
    () => Math.max(1, Math.floor(protagonist.maxHp * config.hpRecoverPercent)),
  );
}

/** 计算离线 MP 恢复 */
function calcMpRecovery(
  protagonist: Protagonist,
  lastRecoverTime: number | undefined,
  currentTime: number,
  config: OfflineConfig,
) {
  return calculateRecovery(
    protagonist.currentMp,
    protagonist.maxMp,
    lastRecoverTime,
    currentTime,
    config.mpRecoverInterval,
    () => Math.max(1, Math.floor(protagonist.maxMp * config.mpRecoverPercent)),
  );
}

// ============================================
// 自动修炼计算
// ============================================

/** 计算离线自动修炼收益 */
function calcAutoCultivation(
  protagonist: Protagonist,
  offlineDuration: number,
  config: OfflineConfig,
): AutoCultivateResult {
  const defaultResult: AutoCultivateResult = {
    executed: false,
    count: 0,
    spiritStonesSpent: 0,
    totalExpGained: 0,
    startLevel: protagonist.level,
    endLevel: protagonist.level,
    endExperience: protagonist.experience || 0,
    stoppedByResource: false,
  };

  const maxCount = Math.floor(offlineDuration / config.autoCultivateInterval);
  if (maxCount <= 0) return defaultResult;

  // 查找灵石
  const spiritStoneItem = protagonist.inventory.find(
    (item) => item.definition?.id === 'spirit_stone' || item.definition?.type === '灵石',
  );
  const currentStones = spiritStoneItem?.quantity ?? 0;

  const possibleByStones = Math.floor(currentStones / config.autoCultivateSpiritStoneCost);
  const actualCount = Math.min(maxCount, possibleByStones);

  if (actualCount <= 0) {
    return { ...defaultResult, stoppedByResource: true };
  }

  const expPerCultivation = config.autoCultivateExpBase + protagonist.level * config.autoCultivateExpPerLevel;
  const totalExpGained = Math.floor(expPerCultivation * actualCount * config.offlineCultivateEfficiency);

  const levelUpResult = calculateBatchLevelUp(
    protagonist.level,
    protagonist.experience ?? 0,
    totalExpGained,
  );

  return {
    executed: true,
    count: actualCount,
    spiritStonesSpent: actualCount * config.autoCultivateSpiritStoneCost,
    totalExpGained,
    startLevel: protagonist.level,
    endLevel: levelUpResult.newLevel,
    endExperience: levelUpResult.newExp,
    stoppedByResource: actualCount < maxCount,
  };
}

// ============================================
// 主处理函数
// ============================================

/**
 * 处理离线期间的所有变化
 *
 * @param time - 当前 TimeState
 * @param protagonist - 主角数据
 * @param serverNow - 服务端当前时间戳
 * @param autoCultivating - 是否开启了自动修炼
 * @param config - 离线配置（可选，使用默认值）
 * @returns 离线处理结果
 */
export function process(
  time: TimeState,
  protagonist: Protagonist,
  serverNow: number,
  autoCultivating: boolean = false,
  config: OfflineConfig = DEFAULT_OFFLINE_CONFIG,
): OfflineResult {
  // 计算离线时长（限制最大值）
  const rawOffline = getOfflineDuration(time, serverNow);
  const offlineDuration = Math.min(rawOffline, config.maxOfflineDuration);
  const offlineDurationText = formatDuration(offlineDuration);

  // 1. 体力恢复（基于最近一次登出时间或登录时间）
  const lastActiveTime = time.real.lastLogoutAt > 0 ? time.real.lastLogoutAt : time.real.lastLoginAt;
  const staminaResult = calcStaminaRecovery(
    protagonist,
    lastActiveTime,
    serverNow,
    config,
  );

  // 2. HP 恢复
  const hpResult = calcHpRecovery(
    protagonist,
    lastActiveTime,
    serverNow,
    config,
  );

  // 3. MP 恢复
  const mpResult = calcMpRecovery(
    protagonist,
    lastActiveTime,
    serverNow,
    config,
  );

  // 4. 冷却过期清理
  const { expired } = clearExpired(time, serverNow);

  // 5. 刷新检测
  const dailyRefresh = needsDailyRefresh(time, serverNow);
  const weeklyRefresh = needsWeeklyRefresh(time, serverNow);

  // 6. 自动修炼
  const autoCultivate = autoCultivating
    ? calcAutoCultivation(protagonist, offlineDuration, config)
    : {
        executed: false,
        count: 0,
        spiritStonesSpent: 0,
        totalExpGained: 0,
        startLevel: protagonist.level,
        endLevel: protagonist.level,
        endExperience: protagonist.experience ?? 0,
        stoppedByResource: false,
      } as AutoCultivateResult;

  return {
    offlineDuration,
    offlineDurationText,
    staminaRecovered: staminaResult.recovered,
    hpRecovered: hpResult.recovered,
    mpRecovered: mpResult.recovered,
    expiredCooldownIds: expired,
    needsDailyRefresh: dailyRefresh,
    needsWeeklyRefresh: weeklyRefresh,
    autoCultivate,
  };
}

/**
 * 应用离线结果到主角数据
 *
 * @param protagonist - 主角数据
 * @param result - 离线处理结果
 * @returns 更新后的主角数据
 */
export function applyResult(
  protagonist: Protagonist,
  result: OfflineResult,
): Protagonist {
  let updated = { ...protagonist };

  // 应用体力恢复
  if (result.staminaRecovered > 0) {
    updated = {
      ...updated,
      stamina: Math.min(
        updated.maxStamina ?? 100,
        (updated.stamina ?? 100) + result.staminaRecovered,
      ),
    };
  }

  // 应用 HP 恢复
  if (result.hpRecovered > 0) {
    updated = {
      ...updated,
      currentHp: Math.min(updated.maxHp, updated.currentHp + result.hpRecovered),
    };
  }

  // 应用 MP 恢复
  if (result.mpRecovered > 0) {
    updated = {
      ...updated,
      currentMp: Math.min(updated.maxMp, updated.currentMp + result.mpRecovered),
    };
  }

  // 应用自动修炼收益
  if (result.autoCultivate.executed) {
    const { spiritStonesSpent, endLevel, endExperience } = result.autoCultivate;

    updated = {
      ...updated,
      level: endLevel,
      experience: endExperience,
    };

    // 扣除灵石
    const newInventory = [...updated.inventory];
    const spiritStoneIndex = newInventory.findIndex(
      (item) => item.definition?.id === 'spirit_stone' || item.definition?.type === '灵石',
    );

    if (spiritStoneIndex >= 0 && spiritStonesSpent > 0) {
      const item = newInventory[spiritStoneIndex];
      newInventory[spiritStoneIndex] = {
        ...item,
        quantity: Math.max(0, item.quantity - spiritStonesSpent),
      };
      updated = { ...updated, inventory: newInventory };
    }
  }

  return updated;
}

/**
 * 判断是否应该显示离线收益弹窗
 *
 * @param result - 离线处理结果
 * @param config - 离线配置（可选）
 * @returns true 表示应该弹窗
 */
export function shouldShowDialog(
  result: OfflineResult,
  config: OfflineConfig = DEFAULT_OFFLINE_CONFIG,
): boolean {
  return result.offlineDuration >= config.minOfflineTimeForDialog;
}
