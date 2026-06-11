/**
 * 游戏世界时钟 — 纯函数命名空间
 *
 * 负责游戏虚拟时间的推进、年龄计算和格式化显示。
 * 游戏时间绑定于玩家主动行为，不随现实时间流逝。
 */

import type { GameClock, GameAction, TimeState } from './types';
import {
  ACTION_TIME_COST,
  DEFAULT_BASE_AGE,
  DEFAULT_ERA_NAME,
  GAME_YEAR_SECONDS,
  SHICHEN_SECONDS,
  GAME_DAY_SECONDS,
  GAME_MONTH_SECONDS,
  GAME_YEAR_SECONDS_COMPUTED,
  SHICHEN_NAMES,
  MONTH_NAMES,
} from './constants';

// ============================================
// 默认值
// ============================================

/** 创建默认游戏时钟 */
export function createDefaultGameClock(baseAge: number = DEFAULT_BASE_AGE): GameClock {
  return {
    year: 1,
    month: 1,
    day: 1,
    shichen: 6, // 默认从午时开始
    totalSeconds: 0,
    baseAge,
    eraName: DEFAULT_ERA_NAME,
  };
}

// ============================================
// 时间推进
// ============================================

/**
 * 推进游戏时间
 *
 * @param time - 当前 TimeState
 * @param action - 触发时间消耗的行为类型
 * @returns 新的 TimeState
 */
export function advance(time: TimeState, action: GameAction): TimeState {
  return advanceBySeconds(time, ACTION_TIME_COST[action]);
}

/**
 * 按秒数推进游戏时间（用于可变时长的行为如闭关）
 *
 * @param time - 当前 TimeState
 * @param seconds - 消耗的游戏秒数
 * @returns 新的 TimeState
 */
export function advanceBySeconds(time: TimeState, seconds: number): TimeState {
  const newTotalSeconds = time.game.totalSeconds + seconds;
  let remaining = newTotalSeconds;

  const year = Math.floor(remaining / GAME_YEAR_SECONDS_COMPUTED) + 1;
  remaining %= GAME_YEAR_SECONDS_COMPUTED;

  const month = Math.floor(remaining / GAME_MONTH_SECONDS) + 1;
  remaining %= GAME_MONTH_SECONDS;

  const day = Math.floor(remaining / GAME_DAY_SECONDS) + 1;
  remaining %= GAME_DAY_SECONDS;

  const shichen = Math.floor(remaining / SHICHEN_SECONDS) + 1;

  return {
    ...time,
    game: {
      ...time.game,
      year,
      month,
      day,
      shichen,
      totalSeconds: newTotalSeconds,
    },
  };
}

// ============================================
// 年龄计算
// ============================================

/**
 * 计算主角当前年龄
 *
 * @param time - 当前 TimeState
 * @returns 当前年龄（整数）
 */
export function getAge(time: TimeState): number {
  const totalYears = Math.floor(time.game.totalSeconds / GAME_YEAR_SECONDS);
  return time.game.baseAge + totalYears;
}

// ============================================
// 时辰查询
// ============================================

/**
 * 时辰名称映射
 *
 * @param shichen - 时辰编号（1-12）
 * @returns 中文时辰名
 */
function shichenName(shichen: number): string {
  const index = ((shichen - 1) % 12 + 12) % 12;
  return SHICHEN_NAMES[index];
}

/**
 * 获取当前时辰信息
 *
 * @param time - 当前 TimeState
 * @returns 时辰索引和名称
 */
export function getShichen(time: TimeState): { index: number; name: string } {
  return {
    index: time.game.shichen,
    name: shichenName(time.game.shichen),
  };
}

// ============================================
// 格式化显示
// ============================================

/**
 * 获取完整时间字符串
 *
 * @param time - 当前 TimeState
 * @returns 如 "初元3年七月十五 午时 (18岁)"
 */
export function format(time: TimeState): string {
  const { game } = time;
  const sname = shichenName(game.shichen);
  const age = getAge(time);
  return `${game.eraName}${game.year}年${MONTH_NAMES[game.month - 1]}${game.day}日 ${sname}时 (${age}岁)`;
}

/**
 * 获取简短时间字符串（用于顶栏显示）
 *
 * @param time - 当前 TimeState
 * @returns 如 "第3年7月15日 午时 · 18岁"
 */
export function formatShort(time: TimeState): string {
  const { game } = time;
  const sname = shichenName(game.shichen);
  const age = getAge(time);
  return `第${game.year}年${game.month}月${game.day}日 ${sname}时 · ${age}岁`;
}
