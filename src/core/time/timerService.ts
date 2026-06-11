/**
 * 运行时定时器服务 — 单例
 *
 * 职责：
 * 1. 每 500ms tick 一次，检测冷却过期和每日/每周刷新时机
 * 2. 过期/刷新时通过 GameEventBus 发射事件
 * 3. 支持 UI 层注册 tick 回调（如实时刷新冷却倒计时）
 *
 * 生命周期：
 * - 登录后调用 start()
 * - 登出/卸载时调用 stop()
 * - 可在运行时调用 sync() 同步服务端时间
 */

import { gameEventBus } from '@/core/events';
import { TIMER_TICK_INTERVAL } from './constants';
import { clearExpired } from './cooldown';
import { needsDailyRefresh, needsWeeklyRefresh } from './realClock';
import type { TimeState } from './types';

/** tick 回调类型：接收当前服务端时间 */
export type TickCallback = (serverNow: number) => void;

class TimerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCallbacks: Set<TickCallback> = new Set();
  private currentServerNow: number = 0;
  private lastTimeState: TimeState | null = null;

  // ============================================
  // 生命周期
  // ============================================

  /** 启动定时器 */
  start(serverNow: number, timeState: TimeState): void {
    if (this.intervalId !== null) return; // 已启动

    this.currentServerNow = serverNow;
    this.lastTimeState = timeState;
    this.intervalId = setInterval(() => this.tick(), TIMER_TICK_INTERVAL);
  }

  /** 停止定时器 */
  stop(): void {
    if (this.intervalId === null) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.tickCallbacks.clear();
    this.lastTimeState = null;
  }

  /** 获取运行状态 */
  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  // ============================================
  // 时间同步
  // ============================================

  /** 同步服务端时间基准 */
  sync(serverNow: number): void {
    this.currentServerNow = serverNow;
  }

  /**
   * 更新内部 TimeState 引用（由外部在 setGameState 后调用）
   */
  updateTimeState(time: TimeState): void {
    this.lastTimeState = time;
  }

  // ============================================
  // tick 回调
  // ============================================

  /** 注册 tick 回调（用于 UI 更新） */
  onTick(cb: TickCallback): void {
    this.tickCallbacks.add(cb);
  }

  /** 移除 tick 回调 */
  offTick(cb: TickCallback): void {
    this.tickCallbacks.delete(cb);
  }

  // ============================================
  // 内部 tick 逻辑
  // ============================================

  private tick(): void {
    // 更新当前时间（500ms 增量；调用方可定期 sync 修正）
    this.currentServerNow += TIMER_TICK_INTERVAL;

    if (!this.lastTimeState) return;

    let timeState = this.lastTimeState;

    // 1. 检查冷却过期
    const { time: cleanedTime, expired } = clearExpired(timeState, this.currentServerNow);
    if (expired.length > 0) {
      timeState = cleanedTime;
      for (const id of expired) {
        gameEventBus.emit('CooldownEnded', { cooldownId: id, timestamp: this.currentServerNow });
      }
    }

    // 2. 检查每日刷新
    if (needsDailyRefresh(timeState, this.currentServerNow)) {
      timeState = {
        ...timeState,
        real: { ...timeState.real, dailyRefreshAt: this.currentServerNow },
      };
      gameEventBus.emit('DailyReset', { timestamp: this.currentServerNow });
    }

    // 3. 检查每周刷新
    if (needsWeeklyRefresh(timeState, this.currentServerNow)) {
      timeState = {
        ...timeState,
        real: { ...timeState.real, weeklyRefreshAt: this.currentServerNow },
      };
      gameEventBus.emit('WeeklyReset', { timestamp: this.currentServerNow });
    }

    this.lastTimeState = timeState;

    // 4. 通知 UI 层回调
    for (const cb of this.tickCallbacks) {
      try {
        cb(this.currentServerNow);
      } catch {
        // 回调异常不影响定时器
      }
    }
  }
}

/** 全局单例 */
export const timerService = new TimerService();
