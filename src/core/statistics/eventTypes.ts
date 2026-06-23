/**
 * 统计事件类型常量 — EventRegistry 注册
 *
 * 所有统计相关事件通过 EventRegistry 声明式注册，
 * 按域划分命名空间，提供类型安全的事件名常量。
 *
 * @module core/statistics
 */

import { eventRegistry } from '@/core/events';

import type { StatisticsEventType } from './types';

// ============================================
// 按域注册事件
// ============================================

/** 战斗域事件 */
export const combatEvents = eventRegistry.registerModule('combat', {
  enemy_killed: { description: '击败敌人（普通/精英/Boss）' },
  boss_killed: { description: '击败 Boss' },
  elite_killed: { description: '击败精英敌人' },
});

/** 修炼域事件 */
export const cultivationEvents = eventRegistry.registerModule('cultivation', {
  performed: { description: '执行修炼' },
  breakthrough: { description: '突破成功' },
});

/** 物品域事件 */
export const itemEvents = eventRegistry.registerModule('item', {
  used: { description: '使用物品' },
  obtained: { description: '获得物品' },
});

/** 经济域事件 */
export const economyEvents = eventRegistry.registerModule('economy', {
  spirit_stones_gained: { description: '获得灵石' },
  spirit_stones_spent: { description: '消耗灵石' },
});

/** 探索域事件 */
export const adventureEvents = eventRegistry.registerModule('adventure', {
  completed: { description: '完成机缘探索' },
  entered: { description: '进入机缘探索' },
});

/** 收集域事件 */
export const collectionEvents = eventRegistry.registerModule('collection', {
  technique_obtained: { description: '获得功法' },
  equipment_obtained: { description: '获得装备' },
  legendary_obtained: { description: '获得传说物品' },
  material_obtained: { description: '获得材料' },
  fragment_obtained: { description: '获得碎片' },
});

/** 势力域事件 */
export const factionEvents = eventRegistry.registerModule('faction', {
  joined: { description: '加入势力' },
  reputation_changed: { description: '声望变化' },
  contribution_gained: { description: '获得贡献' },
  donation_made: { description: '进行捐献' },
});

/** 成就域事件 */
export const achievementEvents = eventRegistry.registerModule('achievement', {
  claimed: { description: '领取成就奖励' },
});

/** 流派域事件 */
export const pathEvents = eventRegistry.registerModule('path', {
  selected: { description: '选择流派' },
  level_up: { description: '流派升级' },
});

/** 功法域事件 */
export const techniqueEvents = eventRegistry.registerModule('technique', {
  proficiency_up: { description: '功法熟练度提升' },
});

/** 装备域事件 */
export const equipmentEvents = eventRegistry.registerModule('equipment', {
  enhanced: { description: '装备强化' },
  crafted: { description: '合成装备' },
});

/** 羁绊域事件 */
export const bondEvents = eventRegistry.registerModule('bond', {
  activated: { description: '激活羁绊' },
});

/** 合成域事件 */
export const craftingEvents = eventRegistry.registerModule('crafting', {
  technique_synthesized: { description: '合成功法' },
  fragment_synthesized: { description: '碎片合成' },
});

/** 玩家域事件 */
export const playerEvents = eventRegistry.registerModule('player', {
  level_up: { description: '等级提升' },
});

/** 引导域事件 */
export const tutorialEvents = eventRegistry.registerModule('tutorial', {
  game_started: { description: '游戏正式开始（自动完成阶段0）' },
  step_completed: { description: '引导步骤完成' },
  phase_completed: { description: '引导阶段完成' },
  completed: { description: '引导全部完成' },
  dialog_closed: { description: '引导弹窗关闭' },
});

// ============================================
// 事件类型常量映射（用于运行时查表）
// ============================================

/**
 * 所有统计事件类型 → 注册事件类型字符串的映射
 *
 * 用于 statisticsTracker 中根据事件类型字符串查找对应的 updater。
 * 值来自各模块的 events 常量，确保与 EventRegistry 一致。
 */
export const STATISTICS_EVENT_TYPES: Record<StatisticsEventType, string> = {
  // 战斗域
  'combat:enemy_killed': combatEvents.events.enemy_killed,
  'combat:boss_killed': combatEvents.events.boss_killed,
  'combat:elite_killed': combatEvents.events.elite_killed,
  // 修炼域
  'cultivation:performed': cultivationEvents.events.performed,
  'cultivation:breakthrough': cultivationEvents.events.breakthrough,
  // 物品域
  'item:used': itemEvents.events.used,
  'item:obtained': itemEvents.events.obtained,
  // 经济域
  'economy:spirit_stones_gained': economyEvents.events.spirit_stones_gained,
  'economy:spirit_stones_spent': economyEvents.events.spirit_stones_spent,
  // 探索域
  'adventure:completed': adventureEvents.events.completed,
  'adventure:entered': adventureEvents.events.entered,
  // 收集域
  'collection:technique_obtained': collectionEvents.events.technique_obtained,
  'collection:equipment_obtained': collectionEvents.events.equipment_obtained,
  'collection:legendary_obtained': collectionEvents.events.legendary_obtained,
  'collection:material_obtained': collectionEvents.events.material_obtained,
  'collection:fragment_obtained': collectionEvents.events.fragment_obtained,
  // 势力域
  'faction:joined': factionEvents.events.joined,
  'faction:reputation_changed': factionEvents.events.reputation_changed,
  'faction:contribution_gained': factionEvents.events.contribution_gained,
  'faction:donation_made': factionEvents.events.donation_made,
  // 成就域
  'achievement:claimed': achievementEvents.events.claimed,
  // 流派域
  'path:selected': pathEvents.events.selected,
  'path:level_up': pathEvents.events.level_up,
  // 功法域
  'technique:proficiency_up': techniqueEvents.events.proficiency_up,
  // 装备域
  'equipment:enhanced': equipmentEvents.events.enhanced,
  'equipment:crafted': equipmentEvents.events.crafted,
  // 羁绊域
  'bond:activated': bondEvents.events.activated,
  // 合成域
  'crafting:technique_synthesized': craftingEvents.events.technique_synthesized,
  'crafting:fragment_synthesized': craftingEvents.events.fragment_synthesized,
  // 玩家域
  'player:level_up': playerEvents.events.level_up,
  // 引导域
  'tutorial:game_started': tutorialEvents.events.game_started,
  'tutorial:step_completed': tutorialEvents.events.step_completed,
  'tutorial:phase_completed': tutorialEvents.events.phase_completed,
  'tutorial:completed': tutorialEvents.events.completed,
  'tutorial:dialog_closed': tutorialEvents.events.dialog_closed,
};
