/**
 * 统计摘要计算
 *
 * 纯函数：从 GameStatistics 计算 StatisticsSummary 展示用数据。
 * 不依赖任何外部状态，不产生副作用。
 *
 * @module core/statistics
 */

import type { GameStatistics } from '@/core/types';

// ============================================
// 类型定义
// ============================================

/** 统计摘要（用于 UI 展示） */
export interface StatisticsSummary {
  /** 总体数据 */
  totalPlayTime: string;
  totalActions: number;

  /** 战斗统计 */
  combat: {
    totalKills: number;
    bossKills: number;
    eliteKills: number;
    normalKills: number;
  };

  /** 成长统计 */
  growth: {
    cultivations: number;
    breakthroughs: number;
    itemsUsed: number;
  };

  /** 收集统计 */
  collection: {
    techniques: number;
    equipments: number;
    legendaryItems: number;
  };

  /** 探索统计 */
  exploration: {
    adventuresCompleted: number;
  };

  /** 扩展系统 */
  extended: {
    pathSelected: boolean;
    pathLevel: number;
    bondsActivated: number;
    factionJoined: boolean;
    achievementsClaimed: number;
  };
}

// ============================================
// 计算函数
// ============================================

/**
 * 计算统计摘要
 *
 * 从完整的 GameStatistics 中提取展示用摘要数据。
 * 纯函数，不修改输入。
 *
 * @param stats - 完整统计数据
 * @returns 统计摘要
 */
export function calculateStatisticsSummary(stats: GameStatistics): StatisticsSummary {
  return {
    totalPlayTime: '-', // 需要外部计算（游戏时间）
    totalActions:
      stats.totalCultivations +
      stats.totalBreakthroughs +
      stats.totalEnemiesKilled +
      stats.totalItemsUsed +
      stats.totalAdventuresCompleted,

    combat: {
      totalKills: stats.totalEnemiesKilled,
      bossKills: stats.totalBossKilled,
      eliteKills: stats.totalEliteKilled,
      normalKills: stats.totalEnemiesKilled - stats.totalBossKilled - stats.totalEliteKilled,
    },

    growth: {
      cultivations: stats.totalCultivations,
      breakthroughs: stats.totalBreakthroughs,
      itemsUsed: stats.totalItemsUsed,
    },

    collection: {
      techniques: stats.totalTechniquesCollected,
      equipments: stats.totalEquipmentsCollected,
      legendaryItems: stats.legendaryItemsObtained,
    },

    exploration: {
      adventuresCompleted: stats.totalAdventuresCompleted,
    },

    extended: {
      pathSelected: stats.pathSelected,
      pathLevel: stats.pathLevel,
      bondsActivated: stats.bondsActivated,
      factionJoined: stats.factionJoined,
      achievementsClaimed: stats.achievementRewardsClaimed,
    },
  };
}
