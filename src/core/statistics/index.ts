/**
 * core/statistics — 统一统计追踪基础设施
 *
 * 提供事件驱动的游戏统计更新机制。所有统计变更通过 EventBus 事件触发，
 * 由纯函数 processStatisticsEvent() 处理，消除分散在各 Hook 中的直接 state 修改。
 *
 * 职责：
 * - 定义统计事件类型和 payload 映射
 * - 提供事件→统计的纯函数更新映射
 * - 批量事件处理
 *
 * 本模块是纯基础设施，不依赖 React/浏览器 API，不依赖 modules/。
 *
 * @module core/statistics
 */

// 类型
export type {
  StatisticsEventType,
  StatisticsEventPayloadMap,
  StatisticsEvent,
  StatisticsEventPayload,
} from './types';

// 事件类型常量 + EventRegistry 注册
export {
  combatEvents,
  cultivationEvents,
  itemEvents,
  economyEvents,
  adventureEvents,
  collectionEvents as statCollectionEvents,
  factionEvents,
  achievementEvents,
  pathEvents,
  techniqueEvents,
  equipmentEvents,
  bondEvents,
  craftingEvents,
  playerEvents,
  tutorialEvents,
  STATISTICS_EVENT_TYPES,
} from './eventTypes';

// 更新函数
export type { StatisticsUpdater } from './updaters';
export { statisticsUpdaters } from './updaters';

// 核心追踪器
export {
  processStatisticsEvent,
  processStatisticsEvents,
  isStatisticsEvent,
} from './statisticsTracker';

export {
  emitPlayerLevelUp,
  emitEnemyKilled,
  emitCultivationPerformed,
  emitCultivationBreakthrough,
  emitAdventureEntered,
  emitAdventureCompleted,
  emitItemObtained,
  emitItemUsed,
  emitSpiritStonesGained,
  emitSpiritStonesSpent,
  emitTechniqueObtained,
  emitEquipmentObtained,
  emitLegendaryObtained,
} from './emitters';

// 统计摘要
export type { StatisticsSummary } from './summary';
export { calculateStatisticsSummary } from './summary';
