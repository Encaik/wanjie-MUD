/**
 * 玩家状态管理器
 * 
 * 职责：
 * 1. 管理所有玩家状态（在线+离线历史）
 * 2. 定时清理不活跃玩家
 * 3. 提供排行榜数据
 */

import type {
  PlayerOnlineState,
  PlayerState,
  PlayerStatistics,
  LeaderboardEntry,
  LeaderboardType,
  AllLeaderboards,
} from '@/types/multiplayer';
import type { WorldType } from '@/types/base';
import { WS_CONFIG } from '../websocket/types';

/** 玩家状态管理器（全局单例） */
export class PlayerStateManager {
  private static instance: PlayerStateManager;

  // 在线玩家
  private onlinePlayers: Map<string, PlayerOnlineState> = new Map();

  // 离线玩家历史（用于排行榜）
  private offlinePlayers: Map<string, PlayerState> = new Map();

  // 排行榜缓存
  private leaderboardCache: Map<LeaderboardType, LeaderboardEntry[]> = new Map();

  // 清理定时器
  private cleanupTimer?: ReturnType<typeof setInterval>;

  private constructor() {
    this.startCleanupScheduler();
  }

  /** 获取单例实例 */
  static getInstance(): PlayerStateManager {
    if (!PlayerStateManager.instance) {
      PlayerStateManager.instance = new PlayerStateManager();
    }
    return PlayerStateManager.instance;
  }

  // ========== 玩家管理 ==========

  /** 玩家上线 */
  playerJoin(state: PlayerOnlineState): void {
    // 如果是离线玩家回归，从离线列表移除
    this.offlinePlayers.delete(state.id);

    // 添加到在线列表
    this.onlinePlayers.set(state.id, {
      ...state,
      lastActive: Date.now(),
      joinedAt: Date.now(),
    });

    // 更新排行榜
    this.recalculateLeaderboards();
  }

  /** 玩家下线 */
  playerLeave(playerId: string): void {
    const state = this.onlinePlayers.get(playerId);
    if (!state) return;

    // 从在线列表移除
    this.onlinePlayers.delete(playerId);

    // 添加到离线列表（保留排行榜位置）
    this.offlinePlayers.set(playerId, {
      ...state,
      status: 'offline',
    });

    // 更新排行榜
    this.recalculateLeaderboards();
  }

  /** 删除玩家 */
  deletePlayer(playerId: string, reason: 'inactive' | 'restart' | 'manual'): boolean {
    const wasOnline = this.onlinePlayers.has(playerId);

    // 从所有列表移除
    this.onlinePlayers.delete(playerId);
    this.offlinePlayers.delete(playerId);

    // 更新排行榜
    this.recalculateLeaderboards();

    return wasOnline || this.offlinePlayers.has(playerId);
  }

  /** 更新玩家状态 */
  updatePlayerState(playerId: string, updates: Partial<PlayerOnlineState>): boolean {
    const state = this.onlinePlayers.get(playerId);
    if (!state) return false;

    Object.assign(state, updates, { lastActive: Date.now() });

    // 检查是否需要更新排行榜
    if (this.shouldUpdateLeaderboard(updates)) {
      this.recalculateLeaderboards();
    }

    return true;
  }

  /** 获取玩家状态 */
  getPlayer(playerId: string): PlayerOnlineState | PlayerState | undefined {
    return this.onlinePlayers.get(playerId) || this.offlinePlayers.get(playerId);
  }

  /** 检查玩家是否在线 */
  isPlayerOnline(playerId: string): boolean {
    return this.onlinePlayers.has(playerId);
  }

  // ========== 查询接口 ==========

  /** 获取在线玩家列表 */
  getOnlinePlayers(): PlayerOnlineState[] {
    return Array.from(this.onlinePlayers.values());
  }

  /** 获取排行榜 */
  getLeaderboard(type: LeaderboardType): LeaderboardEntry[] {
    return this.leaderboardCache.get(type) || [];
  }

  /** 获取所有排行榜 */
  getAllLeaderboards(): AllLeaderboards {
    return {
      level: this.getLeaderboard('level'),
      combat: this.getLeaderboard('combat'),
      boss_kills: this.getLeaderboard('boss_kills'),
      legendary: this.getLeaderboard('legendary'),
      adventure: this.getLeaderboard('adventure'),
    };
  }

  /** 获取在线人数 */
  getOnlineCount(): number {
    return this.onlinePlayers.size;
  }

  /** 获取总玩家数（在线+离线） */
  getTotalCount(): number {
    return this.onlinePlayers.size + this.offlinePlayers.size;
  }

  // ========== 内部方法 ==========

  /** 检查是否需要更新排行榜 */
  private shouldUpdateLeaderboard(updates: Partial<PlayerOnlineState>): boolean {
    const leaderboardFields: (keyof PlayerOnlineState)[] = [
      'level', 'combatPower', 'statistics'
    ];
    return leaderboardFields.some(field => field in updates);
  }

  /** 重新计算排行榜 */
  private recalculateLeaderboards(): void {
    // 合并在线和离线玩家
    const allPlayers = [
      ...Array.from(this.onlinePlayers.values()).map(p => ({ ...p, isOnline: true })),
      ...Array.from(this.offlinePlayers.values()).map(p => ({ ...p, isOnline: false })),
    ];

    // 计算各维度排行榜
    this.leaderboardCache.set('level', this.rankPlayers(allPlayers, p => p.level));
    this.leaderboardCache.set('combat', this.rankPlayers(allPlayers, p => p.combatPower));
    this.leaderboardCache.set('boss_kills', this.rankPlayers(allPlayers, p => p.statistics.totalBossKilled));
    this.leaderboardCache.set('legendary', this.rankPlayers(allPlayers, p => p.statistics.legendaryItems));
    this.leaderboardCache.set('adventure', this.rankPlayers(allPlayers, p => p.statistics.adventuresCompleted));
  }

  /** 排名玩家 */
  private rankPlayers(
    players: (PlayerOnlineState & { isOnline: boolean })[],
    getValue: (p: PlayerOnlineState) => number
  ): LeaderboardEntry[] {
    return players
      .sort((a, b) => getValue(b) - getValue(a))
      .slice(0, WS_CONFIG.MAX_LEADERBOARD_SIZE)
      .map((p, index) => ({
        rank: index + 1,
        playerId: p.id,
        playerName: p.name,
        worldType: p.worldType,
        level: p.level,
        combatPower: p.combatPower,
        realm: p.realm,
        achievements: {
          bossKills: p.statistics.totalBossKilled,
          legendaryItems: p.statistics.legendaryItems,
          adventuresCompleted: p.statistics.adventuresCompleted,
        },
        isOnline: p.isOnline,
        lastActive: p.lastActive,
        displayName: p.name,
      }));
  }

  /** 启动定时清理 */
  private startCleanupScheduler(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactivePlayers();
    }, WS_CONFIG.CLEANUP_INTERVAL);
  }

  /** 清理不活跃玩家 */
  private cleanupInactivePlayers(): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, player] of this.offlinePlayers) {
      if (now - player.lastActive > WS_CONFIG.OFFLINE_KEEP_TIME) {
        expiredIds.push(id);
      }
    }

    // 删除过期玩家
    for (const id of expiredIds) {
      this.deletePlayer(id, 'inactive');
    }

    if (expiredIds.length > 0) {
      console.log(`[PlayerStateManager] Cleaned up ${expiredIds.length} inactive players`);
    }
  }

  /** 销毁实例（用于测试） */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.onlinePlayers.clear();
    this.offlinePlayers.clear();
    this.leaderboardCache.clear();
  }
}

// 导出单例获取函数
export const getPlayerStateManager = () => PlayerStateManager.getInstance();
