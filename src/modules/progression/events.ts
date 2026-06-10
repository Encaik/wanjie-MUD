/**
 * 进度模块事件声明
 *
 * 通过 EventRegistry 声明式注册角色进度相关事件
 * （修炼、突破、秘境等），无需修改 core/events/ 中的任何代码。
 *
 * @module modules/progression
 */

import { eventRegistry } from '@/core/events';

/**
 * 进度事件命名空间和定义
 *
 * 使用方式：
 * - 触发事件：`emit(progressionEvents.events.level_up, { oldLevel: 10, newLevel: 11 })`
 * - 订阅事件：`on(progressionEvents.events.level_up, handler)`
 */
export const progressionEvents = eventRegistry.registerModule('progression', {
  level_up: { description: '等级提升' },
  realm_breakthrough: { description: '境界突破' },
  adventure_completed: { description: '完成秘境' },
  cultivation_done: { description: '完成修炼' },
});

/** 进度事件类型 */
export type ProgressionEventType = keyof typeof progressionEvents.events;
