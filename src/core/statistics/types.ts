/**
 * 统计追踪器 — 类型定义
 *
 * 定义所有统计事件类型、payload 映射和事件对象接口。
 * 按域划分事件类型，命名格式 `domain:action`。
 *
 * @module core/statistics
 */

import type { Quality } from '@/core/types';
import type { GameEvent } from '@/core/events';

// ============================================
// 统计事件类型联合
// ============================================

/**
 * 所有统计相关事件类型
 *
 * 按域划分：
 * - combat: 战斗相关
 * - cultivation: 修炼相关
 * - item: 物品相关
 * - economy: 经济相关
 * - adventure: 探索相关
 * - collection: 收集相关
 * - faction: 势力相关
 * - achievement: 成就相关
 * - path: 流派相关
 * - technique: 功法相关
 * - equipment: 装备相关
 * - bond: 羁绊相关
 * - crafting: 合成相关
 * - player: 玩家相关
 * - tutorial: 引导相关
 */
export type StatisticsEventType =
  // 战斗域
  | 'combat:enemy_killed'
  | 'combat:boss_killed'
  | 'combat:elite_killed'
  // 修炼域
  | 'cultivation:performed'
  | 'cultivation:breakthrough'
  // 物品域
  | 'item:used'
  | 'item:obtained'
  // 经济域
  | 'economy:spirit_stones_gained'
  | 'economy:spirit_stones_spent'
  // 探索域
  | 'adventure:completed'
  | 'adventure:entered'
  // 收集域
  | 'collection:technique_obtained'
  | 'collection:equipment_obtained'
  | 'collection:legendary_obtained'
  | 'collection:material_obtained'
  | 'collection:fragment_obtained'
  // 势力域
  | 'faction:joined'
  | 'faction:reputation_changed'
  | 'faction:contribution_gained'
  | 'faction:donation_made'
  // 成就域
  | 'achievement:claimed'
  // 流派域
  | 'path:selected'
  | 'path:level_up'
  // 功法域
  | 'technique:proficiency_up'
  // 装备域
  | 'equipment:enhanced'
  | 'equipment:crafted'
  // 羁绊域
  | 'bond:activated'
  // 合成域
  | 'crafting:technique_synthesized'
  | 'crafting:fragment_synthesized'
  // 玩家域
  | 'player:level_up'
  // 引导域
  | 'tutorial:step_completed'
  | 'tutorial:phase_completed'
  | 'tutorial:completed'
  | 'tutorial:game_started'
  | 'tutorial:dialog_closed';

// ============================================
// 统计事件 Payload 映射
// ============================================

/**
 * 统计事件 Payload 类型映射
 *
 * 每个事件类型对应其 payload 的结构。
 */
export interface StatisticsEventPayloadMap {
  'combat:enemy_killed': { enemyId?: string; enemyName?: string; tier?: 'normal' | 'elite' | 'miniboss' | 'boss'; enemyLevel?: number; count?: number };
  'combat:boss_killed': { enemyId?: string; enemyName?: string; count?: number };
  'combat:elite_killed': { enemyId?: string; enemyName?: string; count?: number };
  'cultivation:performed': { count?: number };
  'cultivation:breakthrough': { oldRealm?: string; newRealm?: string; count?: number };
  'item:used': { templateId: string; count?: number };
  'item:obtained': { templateId: string; rarity?: Quality; count?: number };
  'economy:spirit_stones_gained': { amount: number };
  'economy:spirit_stones_spent': { amount: number };
  'adventure:completed': { difficulty?: number; count?: number };
  'adventure:entered': { difficulty?: number };
  'collection:technique_obtained': { name: string };
  'collection:equipment_obtained': { name: string };
  'collection:legendary_obtained': { count?: number };
  'collection:material_obtained': { count?: number };
  'collection:fragment_obtained': { count?: number };
  'faction:joined': Record<string, never>;
  'faction:reputation_changed': { level: 'friendly' | 'honored' | 'exalted' };
  'faction:contribution_gained': { amount: number };
  'faction:donation_made': { spiritStones: number };
  'achievement:claimed': { count?: number };
  'path:selected': Record<string, never>;
  'path:level_up': { newLevel: number };
  'technique:proficiency_up': { level: 'xiaocheng' | 'dacheng' | 'huajing' };
  'equipment:enhanced': { newLevel: number };
  'equipment:crafted': { count?: number };
  'bond:activated': { level: number };
  'crafting:technique_synthesized': { count?: number };
  'crafting:fragment_synthesized': { count?: number };
  'player:level_up': { oldLevel?: number; newLevel: number };
  'tutorial:step_completed': { stepId: string };
  'tutorial:phase_completed': { phaseId: string };
  'tutorial:completed': Record<string, never>;
  'tutorial:game_started': Record<string, never>;
  'tutorial:dialog_closed': { stepId: string };
}

// ============================================
// 统计事件对象
// ============================================

/**
 * 类型化统计事件
 *
 * 继承 GameEvent，增加统计特定的事件类型约束。
 */
export interface StatisticsEvent<T extends StatisticsEventType = StatisticsEventType>
  extends GameEvent<StatisticsEventPayloadMap[T]> {
  type: T;
}

/**
 * 从 GameEvent 中提取统计 payload 的类型工具
 */
export type StatisticsEventPayload<T extends StatisticsEventType> =
  StatisticsEventPayloadMap[T];
