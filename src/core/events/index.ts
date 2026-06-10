/**
 * core/events — 游戏事件系统
 *
 * 事件驱动架构的核心，管理游戏内所有事件的发布和订阅。
 * EventBus 是单例模式，用于跨模块通信。
 * EventRegistry 是模块事件注册中心，用于声明式添加事件类型。
 */

// ============================================
// 新事件总线 API
// ============================================

// 类型
export type {
  EventType,
  EventMatcher,
  GameEvent,
  EventListener,
  EventBusOptions,
} from './types';

// 事件总线核心
export {
  EventBus,
  gameEventBus,
  on,
  once,
  off,
  emit,
} from './eventBus';

// 事件注册中心
export {
  EventRegistry,
  eventRegistry,
} from './eventRegistry';
export type {
  EventDef,
  ModuleEventDefs,
  EventNameConstants,
  ModuleEventEmitter,
} from './eventRegistry';

// 模式匹配工具
export {
  matchPattern,
  isWildcardPattern,
  getWildcardPrefix,
  findMatchingEntries,
} from './patternMatcher';

// ============================================
// 叙事事件链类型（保留）
// ============================================

export type {
  EventRecord,
  EventPrerequisite,
  EventBranch,
  NPCRelationChange,
  FlagChange,
  Consequence,
} from './types';

export {
  checkPrerequisite,
  matchEventBranch,
  applyConsequences,
  getChainProgress,
  isChainCompleted,
} from './eventMatcher';

