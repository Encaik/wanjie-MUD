/**
 * core/time/ — 统一时间系统对外 API
 *
 * 使用方式：
 * ```typescript
 * import { gameClock, cooldown, realClock, offline, formatter, timerService, fetchServerTime } from '@/core/time';
 *
 * // 游戏时间
 * setGameState(prev => ({ ...prev, time: gameClock.advance(prev.time, 'cultivate') }));
 * const age = gameClock.getAge(gameState.time);
 *
 * // 冷却管理
 * setGameState(prev => ({ ...prev, time: cooldown.set(prev.time, 'explore', 30000, serverNow) }));
 * const isReady = !cooldown.isActive(gameState.time, 'explore', serverNow);
 *
 * // 离线处理
 * const result = offline.process(savedState.time, protagonist, serverNow, autoCultivating);
 *
 * // 格式化
 * formatter.remaining(cooldown.remaining(gameState.time, 'explore', serverNow));
 * ```
 */

// ── 类型 ──
export type {
  TimeState,
  GameClock,
  RealClock,
  CooldownRecord,
  CooldownMap,
  OfflineConfig,
  OfflineResult,
  AutoCultivateResult,
  GameAction,
} from './types';

// ── 常量 ──
export {
  SHICHEN_NAMES,
  MONTH_NAMES,
  GAME_TIME_SCALE,
  DEFAULT_BASE_AGE,
  ACTION_TIME_COST,
  DEFAULT_ERA_NAME,
  DEFAULT_OFFLINE_CONFIG,
  TIMER_TICK_INTERVAL,
} from './constants';

// ── 游戏时钟 ──
export {
  createDefaultGameClock,
  advance as gameAdvance,
  advanceBySeconds as gameAdvanceBySeconds,
  getAge,
  getShichen,
  format as formatGameTime,
  formatShort as formatGameTimeShort,
} from './gameClock';

/** gameClock 命名空间 */
export * as gameClock from './gameClock';

// ── 现实时钟 ──
export {
  createDefaultRealClock,
  login as realLogin,
  logout as realLogout,
  getOfflineDuration,
  needsDailyRefresh,
  needsWeeklyRefresh,
} from './realClock';

/** realClock 命名空间 */
export * as realClock from './realClock';

// ── 冷却管理 ──
export {
  set as cooldownSet,
  remove as cooldownRemove,
  isActive as cooldownIsActive,
  remaining as cooldownRemaining,
  progress as cooldownProgress,
  clearExpired as cooldownClearExpired,
} from './cooldown';

/** cooldown 命名空间 */
export * as cooldown from './cooldown';

// ── 离线处理器 ──
export {
  process as offlineProcess,
  applyResult as offlineApplyResult,
  shouldShowDialog as offlineShouldShowDialog,
} from './offlineProcessor';

/** offline 命名空间 */
export * as offline from './offlineProcessor';

// ── 格式化 ──
/** formatter 命名空间 */
export * as formatter from './formatter';

// ── 定时器服务 ──
export { timerService } from './timerService';
export type { TickCallback } from './timerService';

// ── 服务端时间 ──
export { fetchServerTime } from './serverTime';
