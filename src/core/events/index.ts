/**
 * core/events — 游戏事件系统
 *
 * 事件驱动架构的核心，管理游戏内所有事件的发布和订阅。
 * GameEventManager 是单例模式，用于跨模块通信。
 */

export type {
  EventRecord,
  EventPrerequisite,
  EventBranch,
  NPCRelationChange,
  FlagChange,
  Consequence,
} from './types';

export { GameEventType } from './eventManager';
export type { EventPayloadMap } from './eventManager';
export { gameEventManager, triggerEvent } from './eventManager';
export {
  checkPrerequisite,
  matchEventBranch,
  applyConsequences,
  getChainProgress,
  isChainCompleted,
} from './eventMatcher';
