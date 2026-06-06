/**
 * 地牢随机事件系统
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

// 类型定义
export type {
  DungeonEventType,
  EventTypeConfig,
  ChoiceRequirements,
  RequirementCheckResult,
  EventEffectType,
  EventEffect,
  DungeonOutcome,
  DungeonChoice,
  EventConditions,
  DungeonEvent,
  EventTriggerConfig,
  EventExecutionContext,
  EventExecutionResult,
  EventStatistics,
  EventPreview,
  EventLogEntry,
} from './types';

export {
  EVENT_TYPE_CONFIGS,
  DEFAULT_TRIGGER_CONFIG,
} from './types';

// 事件配置
export {
  DUNGEON_EVENTS,
  EVENTS_BY_TYPE,
  EVENTS_BY_ID,
  EVENT_ANCIENT_ALTAR,
  EVENT_MYSTERIOUS_SPRING,
  EVENT_MYSTERY_CHEST,
  EVENT_GOLDEN_CHEST,
  EVENT_WANDERING_MERCHANT,
  EVENT_BLACK_MARKET_MERCHANT,
  EVENT_CULTIVATION_SHRINE,
  EVENT_DIVINE_BLESSING,
  EVENT_SPIRIT_SPRING,
  EVENT_POISON_TRAP,
  EVENT_ROCK_TRAP,
  EVENT_HIDDEN_VAULT,
  EVENT_SLEEPING_GUARDIAN,
  getEventById,
  getEventsByType,
  getAvailableEvents,
} from './eventConfigs';

// 事件触发服务
export {
  EventTriggerService,
  getEventTriggerService,
  resetEventTriggerService,
  checkRequirements,
  isChoiceAvailable,
  getAvailableChoices,
  calculateExpectedValue,
  getRecommendedChoice,
} from './eventTrigger';

// 事件系统主入口
export {
  applyEffect,
  executeEvent,
  handleEventCell,
  getEventPreview,
  autoExecuteEvent,
  quickHandleEvent,
  logEvent,
  getEventLogs,
  clearEventLogs,
} from './eventSystem';
