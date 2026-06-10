/**
 * 统计事件系统
 * 统一管理游戏中的所有统计数据更新
 * 
 * 设计原则：
 * 1. 所有统计更新通过事件触发，便于追踪和调试
 * 2. 支持批量更新，减少状态更新次数
 * 3. 提供统计数据的派生计算
 */

import { GameStatistics } from '@/core/types';

// ============================================
// 统计事件类型定义
// ============================================

export type StatisticsEventType =
  // 等级相关
  | 'level_up'           // 等级提升
  
  // 战斗相关
  | 'enemy_killed'       // 击败敌人
  | 'boss_killed'        // 击败Boss
  | 'elite_killed'       // 击败精英
  
  // 收集相关
  | 'technique_collected'  // 获得功法
  | 'equipment_collected'  // 获得装备
  | 'legendary_item_obtained'  // 获得传说物品
  
  // 探索相关
  | 'adventure_completed'  // 完成机缘探索
  
  // 修炼相关
  | 'cultivation_done'     // 完成修炼
  | 'breakthrough_done'    // 完成突破
  
  // 物品相关
  | 'item_used'           // 使用物品
  
  // 成就相关
  | 'achievement_claimed'  // 领取成就奖励
  
  // 流派相关
  | 'path_selected'       // 选择流派
  | 'path_level_up'       // 流派升级
  
  // 功法相关
  | 'technique_proficiency_up'  // 功法熟练度提升
  
  // 羁绊相关
  | 'bond_activated'      // 激活羁绊
  
  // 装备相关
  | 'equipment_enhanced'  // 装备强化
  
  // 势力相关
  | 'faction_joined'      // 加入势力
  | 'reputation_changed'  // 声望变化
  
  // ========== 新增：势力任务相关事件 ==========
  
  // 资源相关
  | 'spirit_stones_gained'    // 获得灵石
  | 'spirit_stones_spent'     // 消耗灵石
  
  // 材料相关
  | 'material_collected'      // 获得材料
  | 'fragment_collected'      // 获得碎片
  
  // 合成相关
  | 'equipment_crafted'       // 合成装备
  | 'technique_synthesized'   // 合成功法
  | 'fragment_synthesized'    // 碎片合成
  
  // 贡献相关
  | 'contribution_gained'     // 获得贡献
  | 'donation_made'           // 进行捐献
;

// 统计事件载荷
export interface StatisticsEventPayload {
  level_up?: { newLevel: number };
  enemy_killed?: { count?: number };
  boss_killed?: { count?: number };
  elite_killed?: { count?: number };
  technique_collected?: { name: string };
  equipment_collected?: { name: string };
  legendary_item_obtained?: { count?: number };
  adventure_completed?: { count?: number; difficulty?: number };
  cultivation_done?: { count?: number };
  breakthrough_done?: { count?: number };
  item_used?: { count?: number };
  achievement_claimed?: { count?: number };
  path_selected?: {};
  path_level_up?: { newLevel: number };
  technique_proficiency_up?: { level: 'xiaocheng' | 'dacheng' | 'huajing' };
  bond_activated?: { level: number };
  equipment_enhanced?: { newLevel: number };
  faction_joined?: {};
  reputation_changed?: { level: 'friendly' | 'honored' | 'exalted' };
  // 新增：势力任务相关载荷
  spirit_stones_gained?: { amount: number };
  spirit_stones_spent?: { amount: number };
  material_collected?: { count?: number };
  fragment_collected?: { count?: number };
  equipment_crafted?: { count?: number };
  technique_synthesized?: { count?: number };
  fragment_synthesized?: { count?: number };
  contribution_gained?: { amount: number };
  donation_made?: { spiritStones: number };
}

// 统计事件
export interface StatisticsEvent {
  type: StatisticsEventType;
  payload?: StatisticsEventPayload[StatisticsEventType];
  timestamp: number;
}

// ============================================
// 统计更新函数映射
// ============================================

type StatisticsUpdater = (
  stats: GameStatistics,
  payload?: any
) => GameStatistics;

const statisticsUpdaters: Record<StatisticsEventType, StatisticsUpdater> = {
  level_up: (stats, payload) => ({
    ...stats,
    maxLevel: Math.max(stats.maxLevel, payload?.newLevel || stats.maxLevel + 1),
  }),
  
  enemy_killed: (stats, payload) => ({
    ...stats,
    totalEnemiesKilled: stats.totalEnemiesKilled + (payload?.count || 1),
  }),
  
  boss_killed: (stats, payload) => ({
    ...stats,
    totalBossKilled: stats.totalBossKilled + (payload?.count || 1),
  }),
  
  elite_killed: (stats, payload) => ({
    ...stats,
    totalEliteKilled: stats.totalEliteKilled + (payload?.count || 1),
  }),
  
  technique_collected: (stats, payload) => {
    if (!payload?.name) return stats;
    if (stats.collectedTechniqueNames.includes(payload.name)) return stats;
    return {
      ...stats,
      totalTechniquesCollected: stats.totalTechniquesCollected + 1,
      collectedTechniqueNames: [...stats.collectedTechniqueNames, payload.name],
    };
  },
  
  equipment_collected: (stats, payload) => {
    if (!payload?.name) return stats;
    if (stats.collectedEquipmentNames.includes(payload.name)) return stats;
    return {
      ...stats,
      totalEquipmentsCollected: stats.totalEquipmentsCollected + 1,
      collectedEquipmentNames: [...stats.collectedEquipmentNames, payload.name],
    };
  },
  
  legendary_item_obtained: (stats, payload) => ({
    ...stats,
    legendaryItemsObtained: stats.legendaryItemsObtained + (payload?.count || 1),
  }),
  
  adventure_completed: (stats, payload) => {
    const newClearedDifficulties = payload?.difficulty
      ? (stats.clearedDifficulties?.includes(payload.difficulty)
          ? stats.clearedDifficulties
          : [...(stats.clearedDifficulties || []), payload.difficulty])
      : stats.clearedDifficulties;
    return {
      ...stats,
      totalAdventuresCompleted: stats.totalAdventuresCompleted + (payload?.count || 1),
      clearedDifficulties: newClearedDifficulties,
    };
  },
  
  cultivation_done: (stats, payload) => ({
    ...stats,
    totalCultivations: stats.totalCultivations + (payload?.count || 1),
  }),
  
  breakthrough_done: (stats, payload) => ({
    ...stats,
    totalBreakthroughs: stats.totalBreakthroughs + (payload?.count || 1),
  }),
  
  item_used: (stats, payload) => ({
    ...stats,
    totalItemsUsed: stats.totalItemsUsed + (payload?.count || 1),
  }),
  
  achievement_claimed: (stats, payload) => ({
    ...stats,
    achievementRewardsClaimed: stats.achievementRewardsClaimed + (payload?.count || 1),
  }),
  
  path_selected: (stats) => ({
    ...stats,
    pathSelected: true,
  }),
  
  path_level_up: (stats, payload) => ({
    ...stats,
    pathLevel: Math.max(stats.pathLevel, payload?.newLevel || stats.pathLevel + 1),
  }),
  
  technique_proficiency_up: (stats, payload) => {
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
  
  bond_activated: (stats, payload) => ({
    ...stats,
    bondsActivated: stats.bondsActivated + 1,
    bondLevel3Activated: payload?.level >= 3 || stats.bondLevel3Activated,
  }),
  
  equipment_enhanced: (stats, payload) => ({
    ...stats,
    maxEnhancementLevel: Math.max(stats.maxEnhancementLevel, payload?.newLevel || 0),
  }),
  
  faction_joined: (stats) => ({
    ...stats,
    factionJoined: true,
  }),
  
  reputation_changed: (stats, payload) => {
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
  
  // ========== 新增：势力任务相关更新器 ==========
  
  spirit_stones_gained: (stats, payload) => ({
    ...stats,
    totalSpiritStonesGained: stats.totalSpiritStonesGained + (payload?.amount || 0),
  }),
  
  spirit_stones_spent: (stats, payload) => ({
    ...stats,
    totalSpiritStonesSpent: stats.totalSpiritStonesSpent + (payload?.amount || 0),
  }),
  
  material_collected: (stats, payload) => ({
    ...stats,
    totalMaterialsCollected: stats.totalMaterialsCollected + (payload?.count || 1),
  }),
  
  fragment_collected: (stats, payload) => ({
    ...stats,
    totalFragmentsCollected: stats.totalFragmentsCollected + (payload?.count || 1),
  }),
  
  equipment_crafted: (stats, payload) => ({
    ...stats,
    totalEquipmentsCrafted: stats.totalEquipmentsCrafted + (payload?.count || 1),
  }),
  
  technique_synthesized: (stats, payload) => ({
    ...stats,
    totalTechniquesSynthesized: stats.totalTechniquesSynthesized + (payload?.count || 1),
  }),
  
  fragment_synthesized: (stats, payload) => ({
    ...stats,
    totalFragmentsSynthesized: stats.totalFragmentsSynthesized + (payload?.count || 1),
  }),
  
  contribution_gained: (stats, payload) => ({
    ...stats,
    totalContribution: stats.totalContribution + (payload?.amount || 0),
  }),
  
  donation_made: (stats, payload) => ({
    ...stats,
    totalDonations: stats.totalDonations + 1,
    totalSpiritStonesDonated: stats.totalSpiritStonesDonated + (payload?.spiritStones || 0),
  }),
};

// ============================================
// 统计管理器
// ============================================

/**
 * 统计管理器
 * 提供统一的统计更新接口
 */
export class StatisticsManager {
  private static instance: StatisticsManager | null = null;
  private eventLog: StatisticsEvent[] = [];
  
  private constructor() {}
  
  static getInstance(): StatisticsManager {
    if (!StatisticsManager.instance) {
      StatisticsManager.instance = new StatisticsManager();
    }
    return StatisticsManager.instance;
  }
  
  /**
   * 处理统计事件，返回新的统计数据
   */
  processEvent(
    stats: GameStatistics,
    type: StatisticsEventType,
    payload?: StatisticsEventPayload[StatisticsEventType]
  ): GameStatistics {
    const updater = statisticsUpdaters[type];
    if (!updater) {
      console.warn(`[StatisticsManager] Unknown event type: ${type}`);
      return stats;
    }
    
    // 记录事件日志
    this.eventLog.push({
      type,
      payload,
      timestamp: Date.now(),
    });
    
    return updater(stats, payload);
  }
  
  /**
   * 批量处理统计事件
   */
  processEvents(
    stats: GameStatistics,
    events: Array<{ type: StatisticsEventType; payload?: any }>
  ): GameStatistics {
    return events.reduce(
      (currentStats, event) => this.processEvent(currentStats, event.type, event.payload),
      stats
    );
  }
  
  /**
   * 获取事件日志
   */
  getEventLog(): StatisticsEvent[] {
    return [...this.eventLog];
  }
  
  /**
   * 清空事件日志
   */
  clearEventLog(): void {
    this.eventLog = [];
  }
}

// ============================================
// 统计数据派生计算
// ============================================

export interface StatisticsSummary {
  // 总体数据
  totalPlayTime: string; // 需要从外部传入
  totalActions: number;
  
  // 战斗统计
  combat: {
    totalKills: number;
    bossKills: number;
    eliteKills: number;
    normalKills: number;
  };
  
  // 成长统计
  growth: {
    cultivations: number;
    breakthroughs: number;
    itemsUsed: number;
  };
  
  // 收集统计
  collection: {
    techniques: number;
    equipments: number;
    legendaryItems: number;
  };
  
  // 探索统计
  exploration: {
    adventuresCompleted: number;
  };
  
  // 扩展系统
  extended: {
    pathSelected: boolean;
    pathLevel: number;
    bondsActivated: number;
    factionJoined: boolean;
    achievementsClaimed: number;
  };
}

/**
 * 计算统计摘要
 */
export function calculateStatisticsSummary(stats: GameStatistics): StatisticsSummary {
  return {
    totalPlayTime: '-', // 需要外部计算
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

// ============================================
// 便捷函数（用于直接更新统计数据）
// ============================================

/**
 * 创建统计更新函数
 * 返回一个可以批量应用的更新器
 */
export function createStatisticsUpdater() {
  const events: Array<{ type: StatisticsEventType; payload?: any }> = [];
  
  return {
    addEvent(type: StatisticsEventType, payload?: any) {
      events.push({ type, payload });
      return this;
    },
    
    apply(stats: GameStatistics): GameStatistics {
      return StatisticsManager.getInstance().processEvents(stats, events);
    },
    
    getEvents() {
      return [...events];
    },
    
    clear() {
      events.length = 0;
    },
  };
}

// 单例导出
export const statisticsManager = StatisticsManager.getInstance();
