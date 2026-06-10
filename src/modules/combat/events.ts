/**
 * 战斗模块事件声明
 *
 * 通过 EventRegistry 声明式注册战斗相关事件，
 * 无需修改 core/events/ 中的任何代码即可扩建新事件。
 *
 * @module modules/combat
 */

import { eventRegistry } from '@/core/events';

/**
 * 战斗事件命名空间和定义
 *
 * 使用方式：
 * - 触发事件：`emit(combatEvents.events.monster_killed, { enemyName: '...', ... })`
 * - 订阅事件：`on(combatEvents.events.monster_killed, handler)`
 */
export const combatEvents = eventRegistry.registerModule('combat', {
  monster_killed: { description: '击杀怪物' },
  boss_killed: { description: '击杀 Boss' },
  elite_killed: { description: '击杀精英怪物' },
});

/** 战斗事件类型 */
export type CombatEventType = keyof typeof combatEvents.events;
