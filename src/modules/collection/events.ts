/**
 * 收集模块事件声明
 *
 * 通过 EventRegistry 声明式注册收集/图鉴相关事件，
 * 无需修改 core/events/ 中的任何代码。
 *
 * @module modules/collection
 */

import { eventRegistry } from '@/core/events';

/**
 * 收集事件命名空间和定义
 *
 * 使用方式：
 * - 触发事件：`emit(collectionEvents.events.item_collected, { itemId: '...', ... })`
 * - 订阅事件：`on(collectionEvents.events.item_collected, handler)`
 */
export const collectionEvents = eventRegistry.registerModule('collection', {
  item_collected: { description: '获得道具' },
  technique_collected: { description: '获得功法' },
  equipment_collected: { description: '获得装备' },
  legendary_obtained: { description: '获得传说品质物品' },
  full_equipped: { description: '全身装备完整' },
  technique_max_level: { description: '功法升至满级' },
  equipment_max_level: { description: '装备升至满级' },
});

/** 收集事件类型 */
export type CollectionEventType = keyof typeof collectionEvents.events;
