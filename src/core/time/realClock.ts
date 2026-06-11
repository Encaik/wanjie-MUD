/**
 * 现实时钟 — 纯函数命名空间
 *
 * 负责登录/登出时间追踪、离线时长计算、每日/每周刷新检测。
 * 所有函数接受 serverNow 参数，禁止内部调用 Date.now()。
 */

import type { RealClock, TimeState } from './types';

// ============================================
// 默认值
// ============================================

/** 创建默认现实时钟 */
export function createDefaultRealClock(serverNow: number): RealClock {
  return {
    lastLoginAt: serverNow,
    lastLogoutAt: 0,
    cooldowns: {},
    dailyRefreshAt: serverNow,
    weeklyRefreshAt: serverNow,
  };
}

// ============================================
// 登录 / 登出
// ============================================

/**
 * 登录时更新 TimeState
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns 更新后的 TimeState
 */
export function login(time: TimeState, serverNow: number): TimeState {
  return {
    ...time,
    real: {
      ...time.real,
      lastLoginAt: serverNow,
    },
  };
}

/**
 * 登出时更新 TimeState
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns 更新后的 TimeState
 */
export function logout(time: TimeState, serverNow: number): TimeState {
  return {
    ...time,
    real: {
      ...time.real,
      lastLogoutAt: serverNow,
    },
  };
}

// ============================================
// 离线时长
// ============================================

/**
 * 计算离线时长
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns 离线毫秒数。无有效登出记录时返回 0
 */
export function getOfflineDuration(time: TimeState, serverNow: number): number {
  const { lastLogoutAt } = time.real;
  if (lastLogoutAt <= 0) return 0;
  return Math.max(0, serverNow - lastLogoutAt);
}

// ============================================
// 刷新检测
// ============================================

/**
 * 检查是否需要每日刷新（跨午夜）
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns true 表示已跨越午夜，需要刷新
 */
export function needsDailyRefresh(time: TimeState, serverNow: number): boolean {
  const lastRefresh = time.real.dailyRefreshAt;
  const lastDate = new Date(lastRefresh);
  const nowDate = new Date(serverNow);

  return (
    lastDate.getFullYear() !== nowDate.getFullYear() ||
    lastDate.getMonth() !== nowDate.getMonth() ||
    lastDate.getDate() !== nowDate.getDate()
  );
}

/**
 * 检查是否需要每周刷新（跨周一 00:00）
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns true 表示已跨越周一 00:00，需要刷新
 */
export function needsWeeklyRefresh(time: TimeState, serverNow: number): boolean {
  const lastRefresh = time.real.weeklyRefreshAt;
  const lastDate = new Date(lastRefresh);
  const nowDate = new Date(serverNow);

  // 计算上周一的日期和本周一的日期
  const getMonday = (d: Date): string => {
    const dd = new Date(d);
    const day = dd.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 周日视为上一周
    dd.setDate(dd.getDate() + diff);
    dd.setHours(0, 0, 0, 0);
    return dd.toISOString().split('T')[0];
  };

  return getMonday(lastDate) !== getMonday(nowDate);
}

/**
 * 计算到下一个午夜的剩余时间（毫秒）
 *
 * @param serverNow - 服务端当前时间戳
 * @returns 到下一个午夜 00:00:00 的毫秒数
 */
export function timeUntilMidnight(serverNow: number): number {
  const now = new Date(serverNow);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}
