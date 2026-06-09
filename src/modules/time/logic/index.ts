/** Barrel export for lib/game/time — time system and offline processing */

export * from './timeSystem';

// 旧版离线处理器
export {
  processOfflineTime as processOfflineTimeLegacy,
  formatOfflineDuration as formatOfflineDurationLegacy,
} from './offlineProcessor';
export type { OfflineProcessResult } from './offlineProcessor';

// 统一离线时间处理器（推荐使用）
export {
  processOfflineTime,
  applyOfflineTimeToProtagonist,
  shouldShowOfflineDialog,
  DEFAULT_OFFLINE_TIME_CONFIG,
} from './offlineTimeProcessor';
export type { OfflineTimeResult } from './offlineTimeProcessor';
