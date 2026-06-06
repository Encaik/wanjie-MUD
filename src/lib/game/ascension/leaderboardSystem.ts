/**
 * 排行榜系统
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 * 管理：多种排行榜、奖励结算、数据持久化
 */

import { 
  LeaderboardType, 
  LeaderboardEntry, 
  LeaderboardReward,
  LeaderboardSettlement
} from './types';

// ============================================
// 排行榜配置数据
// ============================================

/** 排行榜名称配置 */
export const LEADERBOARD_NAMES: Record<LeaderboardType, string> = {
  combat_power: '战力排行',
  speedrun: '通关速度',
  achievement: '成就点数',
  ascension: '飞升境界',
  weekly_damage: '每周Boss伤害'
};

/** 排行榜图标配置 */
export const LEADERBOARD_ICONS: Record<LeaderboardType, string> = {
  combat_power: '⚔️',
  speedrun: '⏱️',
  achievement: '🏆',
  ascension: '🌟',
  weekly_damage: '💥'
};

/** 排行榜描述配置 */
export const LEADERBOARD_DESCRIPTIONS: Record<LeaderboardType, string> = {
  combat_power: '综合战力排名，包含装备、功法、属性等综合评估',
  speedrun: '通关地牢的最快速度记录',
  achievement: '完成成就累计获得的点数',
  ascension: '飞升境界和印记总量排名',
  weekly_damage: '本周对Boss造成的总伤害排名'
};

/** 排行榜默认奖励配置 */
export const DEFAULT_LEADERBOARD_REWARDS: LeaderboardReward[] = [
  {
    rankRange: [1, 1],
    rewards: {
      spiritStones: 10000,
      ascensionMarks: 100,
      title: '榜首'
    }
  },
  {
    rankRange: [2, 3],
    rewards: {
      spiritStones: 5000,
      ascensionMarks: 50,
      title: '三甲'
    }
  },
  {
    rankRange: [4, 10],
    rewards: {
      spiritStones: 2000,
      ascensionMarks: 25
    }
  },
  {
    rankRange: [11, 50],
    rewards: {
      spiritStones: 1000,
      ascensionMarks: 10
    }
  },
  {
    rankRange: [51, 100],
    rewards: {
      spiritStones: 500,
      ascensionMarks: 5
    }
  }
];

/** 排行榜重置周期（毫秒） */
export const LEADERBOARD_RESET_INTERVALS: Record<LeaderboardType, number> = {
  combat_power: 7 * 24 * 60 * 60 * 1000,    // 每周
  speedrun: 30 * 24 * 60 * 60 * 1000,       // 每月
  achievement: 0,                            // 永不重置
  ascension: 0,                              // 永不重置
  weekly_damage: 7 * 24 * 60 * 60 * 1000    // 每周
};

// ============================================
// 排行榜服务
// ============================================

export class LeaderboardService {
  // 内存中的排行榜数据（实际项目应该使用数据库）
  private static leaderboards: Map<LeaderboardType, LeaderboardEntry[]> = new Map();
  private static lastResetTimes: Map<LeaderboardType, number> = new Map();
  
  /**
   * 初始化排行榜
   */
  static initialize(type: LeaderboardType): void {
    if (!this.leaderboards.has(type)) {
      this.leaderboards.set(type, []);
      this.lastResetTimes.set(type, Date.now());
    }
  }
  
  /**
   * 检查是否需要重置排行榜
   */
  static shouldReset(type: LeaderboardType): boolean {
    const interval = LEADERBOARD_RESET_INTERVALS[type];
    if (interval === 0) return false; // 永不重置
    
    const lastReset = this.lastResetTimes.get(type) || 0;
    return Date.now() - lastReset >= interval;
  }
  
  /**
   * 重置排行榜
   */
  static resetLeaderboard(type: LeaderboardType): LeaderboardEntry[] {
    const oldEntries = this.leaderboards.get(type) || [];
    this.leaderboards.set(type, []);
    this.lastResetTimes.set(type, Date.now());
    return oldEntries;
  }
  
  /**
   * 更新或添加玩家分数
   */
  static updateScore(
    type: LeaderboardType,
    playerId: string,
    playerName: string,
    score: number,
    extraData?: Record<string, unknown>
  ): LeaderboardEntry | null {
    this.initialize(type);
    
    // 检查是否需要重置
    if (this.shouldReset(type)) {
      this.resetLeaderboard(type);
    }
    
    const entries = this.leaderboards.get(type)!;
    
    // 查找现有条目
    const existingIndex = entries.findIndex(e => e.playerId === playerId);
    
    const newEntry: LeaderboardEntry = {
      rank: 0, // 重新排序后设置
      playerId,
      playerName,
      score,
      extraData,
      updatedAt: Date.now()
    };
    
    // 对于速度排行榜，只保留最好成绩
    if (type === 'speedrun') {
      if (existingIndex !== -1) {
        const existing = entries[existingIndex];
        // 速度越低越好
        if (score < existing.score) {
          entries[existingIndex] = newEntry;
        } else {
          return existing;
        }
      } else {
        entries.push(newEntry);
      }
    } else {
      // 其他排行榜取最高分
      if (existingIndex !== -1) {
        const existing = entries[existingIndex];
        if (score > existing.score) {
          entries[existingIndex] = newEntry;
        } else {
          return existing;
        }
      } else {
        entries.push(newEntry);
      }
    }
    
    // 重新排序
    this.sortAndRank(type);
    
    // 返回更新后的条目
    return entries.find(e => e.playerId === playerId) || null;
  }
  
  /**
   * 增加分数（用于累计类排行）
   */
  static addScore(
    type: LeaderboardType,
    playerId: string,
    playerName: string,
    scoreToAdd: number,
    extraData?: Record<string, unknown>
  ): LeaderboardEntry | null {
    this.initialize(type);
    
    const entries = this.leaderboards.get(type)!;
    const existingIndex = entries.findIndex(e => e.playerId === playerId);
    
    if (existingIndex !== -1) {
      const existing = entries[existingIndex];
      return this.updateScore(
        type, 
        playerId, 
        playerName, 
        existing.score + scoreToAdd,
        extraData || existing.extraData
      );
    } else {
      return this.updateScore(type, playerId, playerName, scoreToAdd, extraData);
    }
  }
  
  /**
   * 排序并设置排名
   */
  private static sortAndRank(type: LeaderboardType): void {
    const entries = this.leaderboards.get(type)!;
    
    // 速度排行榜升序，其他降序
    const ascending = type === 'speedrun';
    
    entries.sort((a, b) => ascending ? a.score - b.score : b.score - a.score);
    
    // 设置排名
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    this.leaderboards.set(type, entries);
  }
  
  /**
   * 获取排行榜前N名
   */
  static getTopEntries(type: LeaderboardType, count: number = 100): LeaderboardEntry[] {
    this.initialize(type);
    
    if (this.shouldReset(type)) {
      this.resetLeaderboard(type);
    }
    
    const entries = this.leaderboards.get(type)!;
    return entries.slice(0, count);
  }
  
  /**
   * 获取玩家排名
   */
  static getPlayerRank(type: LeaderboardType, playerId: string): number | null {
    this.initialize(type);
    
    const entries = this.leaderboards.get(type)!;
    const entry = entries.find(e => e.playerId === playerId);
    return entry ? entry.rank : null;
  }
  
  /**
   * 获取玩家排行详情
   */
  static getPlayerEntry(type: LeaderboardType, playerId: string): LeaderboardEntry | null {
    this.initialize(type);
    
    const entries = this.leaderboards.get(type)!;
    return entries.find(e => e.playerId === playerId) || null;
  }
  
  /**
   * 获取玩家周围的排名（用于显示上下文）
   */
  static getPlayerSurroundings(
    type: LeaderboardType, 
    playerId: string, 
    range: number = 5
  ): { above: LeaderboardEntry[]; current: LeaderboardEntry | null; below: LeaderboardEntry[] } {
    this.initialize(type);
    
    const entries = this.leaderboards.get(type)!;
    const playerIndex = entries.findIndex(e => e.playerId === playerId);
    
    if (playerIndex === -1) {
      return { above: [], current: null, below: [] };
    }
    
    const above = entries.slice(Math.max(0, playerIndex - range), playerIndex);
    const current = entries[playerIndex];
    const below = entries.slice(playerIndex + 1, playerIndex + 1 + range);
    
    return { above, current, below };
  }
  
  /**
   * 获取排行榜奖励
   */
  static getRewardForRank(rank: number, customRewards?: LeaderboardReward[]): LeaderboardReward | null {
    const rewards = customRewards || DEFAULT_LEADERBOARD_REWARDS;
    
    for (const reward of rewards) {
      if (rank >= reward.rankRange[0] && rank <= reward.rankRange[1]) {
        return reward;
      }
    }
    
    return null;
  }
  
  /**
   * 结算排行榜
   */
  static settleLeaderboard(
    type: LeaderboardType,
    customRewards?: LeaderboardReward[]
  ): LeaderboardSettlement {
    const entries = this.getTopEntries(type, 100);
    const rewardsMap = new Map<string, LeaderboardReward>();
    
    entries.forEach(entry => {
      const reward = this.getRewardForRank(entry.rank, customRewards);
      if (reward) {
        rewardsMap.set(entry.playerId, reward);
      }
    });
    
    const settlement: LeaderboardSettlement = {
      type,
      entries,
      rewards: rewardsMap,
      settledAt: Date.now()
    };
    
    // 重置排行榜（如果需要）
    if (LEADERBOARD_RESET_INTERVALS[type] > 0) {
      this.resetLeaderboard(type);
    }
    
    return settlement;
  }
  
  /**
   * 获取排行榜统计信息
   */
  static getLeaderboardStats(type: LeaderboardType): {
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    lastReset: number | null;
  } {
    this.initialize(type);
    
    const entries = this.leaderboards.get(type)!;
    
    if (entries.length === 0) {
      return {
        totalPlayers: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        lastReset: this.lastResetTimes.get(type) || null
      };
    }
    
    const scores = entries.map(e => e.score);
    
    return {
      totalPlayers: entries.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      lastReset: this.lastResetTimes.get(type) || null
    };
  }
  
  /**
   * 清除所有排行榜数据（用于测试）
   */
  static clearAll(): void {
    this.leaderboards.clear();
    this.lastResetTimes.clear();
  }
}

// ============================================
// 导出
// ============================================

export const LeaderboardSystem = {
  NAMES: LEADERBOARD_NAMES,
  ICONS: LEADERBOARD_ICONS,
  DESCRIPTIONS: LEADERBOARD_DESCRIPTIONS,
  DEFAULT_REWARDS: DEFAULT_LEADERBOARD_REWARDS,
  RESET_INTERVALS: LEADERBOARD_RESET_INTERVALS,
  Service: LeaderboardService
};
