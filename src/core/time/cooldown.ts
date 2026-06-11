/**
 * 冷却管理器 — 纯函数命名空间
 *
 * 统一管理所有游戏冷却时间。
 * 冷却记录存储 "startTime + duration"，便于动态调整持续时间。
 * 所有函数接受 serverNow 参数，禁止内部调用 Date.now()。
 */

import type { CooldownRecord, CooldownMap, TimeState } from './types';

// ============================================
// 冷却 CRUD
// ============================================

/**
 * 设置冷却
 *
 * @param time - 当前 TimeState
 * @param id - 冷却标识（如 'explore'、'skill:fireball'）
 * @param durationMs - 冷却持续毫秒数
 * @param serverNow - 服务端当前时间戳
 * @returns 更新后的 TimeState
 */
export function set(
  time: TimeState,
  id: string,
  durationMs: number,
  serverNow: number,
): TimeState {
  const record: CooldownRecord = {
    startTime: serverNow,
    duration: durationMs,
  };

  return {
    ...time,
    real: {
      ...time.real,
      cooldowns: {
        ...time.real.cooldowns,
        [id]: record,
      },
    },
  };
}

/**
 * 移除冷却
 *
 * @param time - 当前 TimeState
 * @param id - 冷却标识
 * @returns 更新后的 TimeState
 */
export function remove(time: TimeState, id: string): TimeState {
  if (!(id in time.real.cooldowns)) return time;

  const newCooldowns = { ...time.real.cooldowns };
  delete newCooldowns[id];

  return {
    ...time,
    real: {
      ...time.real,
      cooldowns: newCooldowns,
    },
  };
}

// ============================================
// 冷却查询
// ============================================

/**
 * 检查冷却是否处于激活状态
 *
 * @param time - 当前 TimeState
 * @param id - 冷却标识
 * @param serverNow - 服务端当前时间戳
 * @returns true 表示冷却仍在进行中
 */
export function isActive(time: TimeState, id: string, serverNow: number): boolean {
  const record = time.real.cooldowns[id];
  if (!record) return false;
  return serverNow < record.startTime + record.duration;
}

/**
 * 获取冷却剩余时间
 *
 * @param time - 当前 TimeState
 * @param id - 冷却标识
 * @param serverNow - 服务端当前时间戳
 * @returns 剩余毫秒数。冷却不存在或已过期时返回 0
 */
export function remaining(time: TimeState, id: string, serverNow: number): number {
  const record = time.real.cooldowns[id];
  if (!record) return 0;
  const remain = record.startTime + record.duration - serverNow;
  return Math.max(0, remain);
}

/**
 * 获取冷却进度（0-1）
 *
 * @param time - 当前 TimeState
 * @param id - 冷却标识
 * @param serverNow - 服务端当前时间戳
 * @returns 0 表示刚设置，1 表示已过期。冷却不存在时返回 1
 */
export function progress(time: TimeState, id: string, serverNow: number): number {
  const record = time.real.cooldowns[id];
  if (!record || record.duration <= 0) return 1;
  const elapsed = serverNow - record.startTime;
  return Math.min(1, Math.max(0, elapsed / record.duration));
}

// ============================================
// 批量操作
// ============================================

/**
 * 批量清理过期冷却
 *
 * @param time - 当前 TimeState
 * @param serverNow - 服务端当前时间戳
 * @returns { time: 清理后的 TimeState, expired: 过期冷却 ID 列表 }
 */
export function clearExpired(
  time: TimeState,
  serverNow: number,
): { time: TimeState; expired: string[] } {
  const expired: string[] = [];

  for (const [id, record] of Object.entries(time.real.cooldowns)) {
    if (serverNow >= record.startTime + record.duration) {
      expired.push(id);
    }
  }

  if (expired.length === 0) return { time, expired };

  const newCooldowns = { ...time.real.cooldowns };
  for (const id of expired) {
    delete newCooldowns[id];
  }

  return {
    time: {
      ...time,
      real: {
        ...time.real,
        cooldowns: newCooldowns,
      },
    },
    expired,
  };
}
