/**
 * 统计更新函数映射
 *
 * 纯函数集合：每个函数接收 GameStatistics + payload，返回新的 GameStatistics。
 * 从 `modules/collection/logic/statistics/statisticsSystem.ts` 迁移而来，
 * 事件类型从旧枚举名改为新 `domain:action` 格式。
 *
 * @module core/statistics
 */

import type { GameStatistics } from '@/core/types';
import type { StatisticsEventType, StatisticsEventPayloadMap } from './types';

// ============================================
// 更新函数类型
// ============================================

/**
 * 统计更新纯函数
 *
 * @param stats - 当前统计数据
 * @param payload - 事件负载
 * @returns 更新后的统计数据（新对象，不修改输入）
 */
export type StatisticsUpdater<T extends StatisticsEventType = StatisticsEventType> = (
  stats: GameStatistics,
  payload: StatisticsEventPayloadMap[T] | undefined,
) => GameStatistics;

// ============================================
// 更新函数映射表
// ============================================

/**
 * 所有事件类型 → 更新函数的映射
 *
 * 每个函数都是纯函数，不修改输入参数，返回新对象。
 */
export const statisticsUpdaters: {
  [K in StatisticsEventType]: StatisticsUpdater<K>;
} = {
  // ========== 玩家域 ==========

  'player:level_up': (stats, payload) => ({
    ...stats,
    maxLevel: Math.max(stats.maxLevel, payload?.newLevel ?? stats.maxLevel + 1),
  }),

  // ========== 战斗域 ==========

  'combat:enemy_killed': (stats, payload) => ({
    ...stats,
    totalEnemiesKilled: stats.totalEnemiesKilled + (payload?.count ?? 1),
  }),

  'combat:boss_killed': (stats, payload) => ({
    ...stats,
    totalBossKilled: stats.totalBossKilled + (payload?.count ?? 1),
  }),

  'combat:elite_killed': (stats, payload) => ({
    ...stats,
    totalEliteKilled: stats.totalEliteKilled + (payload?.count ?? 1),
  }),

  // ========== 修炼域 ==========

  'cultivation:performed': (stats, payload) => ({
    ...stats,
    totalCultivations: stats.totalCultivations + (payload?.count ?? 1),
  }),

  'cultivation:breakthrough': (stats, payload) => ({
    ...stats,
    totalBreakthroughs: stats.totalBreakthroughs + (payload?.count ?? 1),
  }),

  // ========== 物品域 ==========

  'item:used': (stats, payload) => ({
    ...stats,
    totalItemsUsed: stats.totalItemsUsed + (payload?.count ?? 1),
  }),

  'item:obtained': (stats) => stats, // 获得物品不直接增加统计计数（在具体子事件中处理）

  // ========== 经济域 ==========

  'economy:spirit_stones_gained': (stats, payload) => ({
    ...stats,
    totalSpiritStonesGained: stats.totalSpiritStonesGained + (payload?.amount ?? 0),
  }),

  'economy:spirit_stones_spent': (stats, payload) => ({
    ...stats,
    totalSpiritStonesSpent: stats.totalSpiritStonesSpent + (payload?.amount ?? 0),
  }),

  // ========== 探索域 ==========

  'adventure:completed': (stats, payload) => {
    const newClearedDifficulties = payload?.difficulty !== undefined
      ? (stats.clearedDifficulties?.includes(payload.difficulty)
          ? stats.clearedDifficulties
          : [...(stats.clearedDifficulties || []), payload.difficulty])
      : stats.clearedDifficulties;
    return {
      ...stats,
      totalAdventuresCompleted: stats.totalAdventuresCompleted + (payload?.count ?? 1),
      clearedDifficulties: newClearedDifficulties,
    };
  },

  'adventure:entered': (stats) => stats, // 进入机缘不改变统计计数

  // ========== 收集域 ==========

  'collection:technique_obtained': (stats, payload) => {
    if (!payload?.name) return stats;
    if (stats.collectedTechniqueNames.includes(payload.name)) return stats;
    return {
      ...stats,
      totalTechniquesCollected: stats.totalTechniquesCollected + 1,
      collectedTechniqueNames: [...stats.collectedTechniqueNames, payload.name],
    };
  },

  'collection:equipment_obtained': (stats, payload) => {
    if (!payload?.name) return stats;
    if (stats.collectedEquipmentNames.includes(payload.name)) return stats;
    return {
      ...stats,
      totalEquipmentsCollected: stats.totalEquipmentsCollected + 1,
      collectedEquipmentNames: [...stats.collectedEquipmentNames, payload.name],
    };
  },

  'collection:legendary_obtained': (stats, payload) => ({
    ...stats,
    legendaryItemsObtained: stats.legendaryItemsObtained + (payload?.count ?? 1),
  }),

  'collection:material_obtained': (stats, payload) => ({
    ...stats,
    totalMaterialsCollected: stats.totalMaterialsCollected + (payload?.count ?? 1),
  }),

  'collection:fragment_obtained': (stats, payload) => ({
    ...stats,
    totalFragmentsCollected: stats.totalFragmentsCollected + (payload?.count ?? 1),
  }),

  // ========== 势力域 ==========

  'faction:joined': (stats) => ({
    ...stats,
    factionJoined: true,
  }),

  'faction:reputation_changed': (stats, payload) => {
    const newStats = { ...stats };
    if (payload?.level === 'friendly') {
      newStats.reputationFriendly = true;
    } else if (payload?.level === 'honored') {
      newStats.reputationHonored = true;
    } else if (payload?.level === 'exalted') {
      newStats.reputationExalted = true;
    }
    return newStats;
  },

  'faction:contribution_gained': (stats, payload) => ({
    ...stats,
    totalContribution: stats.totalContribution + (payload?.amount ?? 0),
  }),

  'faction:donation_made': (stats, payload) => ({
    ...stats,
    totalDonations: stats.totalDonations + 1,
    totalSpiritStonesDonated: stats.totalSpiritStonesDonated + (payload?.spiritStones ?? 0),
  }),

  // ========== 成就域 ==========

  'achievement:claimed': (stats, payload) => ({
    ...stats,
    achievementRewardsClaimed: stats.achievementRewardsClaimed + (payload?.count ?? 1),
  }),

  // ========== 流派域 ==========

  'path:selected': (stats) => ({
    ...stats,
    pathSelected: true,
  }),

  'path:level_up': (stats, payload) => ({
    ...stats,
    pathLevel: Math.max(stats.pathLevel, payload?.newLevel ?? stats.pathLevel + 1),
  }),

  // ========== 功法域 ==========

  'technique:proficiency_up': (stats, payload) => {
    const newStats = { ...stats };
    if (payload?.level === 'xiaocheng') {
      newStats.techniqueProficiencyXiaocheng++;
    } else if (payload?.level === 'dacheng') {
      newStats.techniqueProficiencyDacheng++;
    } else if (payload?.level === 'huajing') {
      newStats.techniqueProficiencyHuajing++;
    }
    return newStats;
  },

  // ========== 装备域 ==========

  'equipment:enhanced': (stats, payload) => ({
    ...stats,
    maxEnhancementLevel: Math.max(stats.maxEnhancementLevel, payload?.newLevel ?? 0),
  }),

  'equipment:crafted': (stats, payload) => ({
    ...stats,
    totalEquipmentsCrafted: stats.totalEquipmentsCrafted + (payload?.count ?? 1),
  }),

  // ========== 羁绊域 ==========

  'bond:activated': (stats, payload) => ({
    ...stats,
    bondsActivated: stats.bondsActivated + 1,
    bondLevel3Activated: (payload?.level ?? 0) >= 3 || stats.bondLevel3Activated,
  }),

  // ========== 合成域 ==========

  'crafting:technique_synthesized': (stats, payload) => ({
    ...stats,
    totalTechniquesSynthesized: stats.totalTechniquesSynthesized + (payload?.count ?? 1),
  }),

  'crafting:fragment_synthesized': (stats, payload) => ({
    ...stats,
    totalFragmentsSynthesized: stats.totalFragmentsSynthesized + (payload?.count ?? 1),
  }),

  // ========== 引导域 ==========
  // 引导事件不修改统计数据（仅触发任务进度检查）

  'tutorial:step_completed': (stats) => stats,
  'tutorial:phase_completed': (stats) => stats,
  'tutorial:completed': (stats) => stats,
  'tutorial:game_started': (stats) => stats,
  'tutorial:dialog_closed': (stats) => stats,
};
