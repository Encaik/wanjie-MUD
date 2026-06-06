/**
 * 多人游戏类型定义
 * 
 * 包含玩家状态、排行榜、在线状态等多人游戏相关类型
 */

import type { WorldType } from './base';

// ========== 玩家状态 ==========

/** 玩家在线状态 */
export interface PlayerOnlineState {
  // 基础信息
  id: string;
  name: string;
  worldType: WorldType;

  // 进度信息
  level: number;
  realm: string;
  combatPower: number;

  // 统计信息（用于排行榜）
  statistics: PlayerStatistics;

  // 连接信息
  connectionId: string;
  lastActive: number;
  joinedAt: number;
}

/** 玩家统计信息 */
export interface PlayerStatistics {
  totalEnemiesKilled: number;
  totalBossKilled: number;
  legendaryItems: number;
  adventuresCompleted: number;
}

/** 玩家状态（包含离线玩家历史记录） */
export interface PlayerState extends PlayerOnlineState {
  status: 'online' | 'offline' | 'deleted';
  deletedAt?: number;
  deletionReason?: 'inactive' | 'restart' | 'manual';
}

// ========== 排行榜 ==========

/** 排行榜类型 */
export type LeaderboardType =
  | 'level'
  | 'combat'
  | 'boss_kills'
  | 'legendary'
  | 'adventure';

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  worldType: WorldType;

  // 排行维度
  level: number;
  combatPower: number;
  realm: string;

  // 成就展示
  achievements: {
    bossKills: number;
    legendaryItems: number;
    adventuresCompleted: number;
  };

  // 状态标识
  isOnline: boolean;
  lastActive: number;

  // 显示字段
  displayName: string;
  title?: string;
}

/** 排行榜数据 */
export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  lastUpdated: number;
}

/** 所有排行榜数据 */
export interface AllLeaderboards {
  level: LeaderboardEntry[];
  combat: LeaderboardEntry[];
  boss_kills: LeaderboardEntry[];
  legendary: LeaderboardEntry[];
  adventure: LeaderboardEntry[];
}

// ========== 在线状态 ==========

/** 在线玩家摘要（用于显示） */
export interface OnlinePlayerSummary {
  id: string;
  name: string;
  level: number;
  realm: string;
  worldType: WorldType;
  isOnline: boolean;
}

// ========== 导出类型映射 ==========

/** 排行榜类型到字段的映射 */
export const LEADERBOARD_FIELD_MAP: Record<LeaderboardType, keyof PlayerStatistics | 'level' | 'combatPower'> = {
  level: 'level',
  combat: 'combatPower',
  boss_kills: 'totalBossKilled',
  legendary: 'legendaryItems',
  adventure: 'adventuresCompleted',
};
