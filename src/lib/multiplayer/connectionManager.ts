/**
 * WebSocket 连接管理器
 * 
 * 职责：
 * 1. 管理 WebSocket 连接
 * 2. 心跳检测
 * 3. 状态同步
 * 4. 排行榜更新
 * 5. 公告广播
 */

import { WebSocket } from 'ws';
import type { Announcement, AnnouncementRequest } from '@/types/announcement';
import type { PlayerOnlineState, AllLeaderboards } from '@/types/multiplayer';
import type { WorldType } from '@/types/base';
import {
  WS_CONFIG,
  WSMessage,
  WSPlayerJoinPayload,
  WSPlayerLeavePayload,
  WSAnnouncementPayload,
} from '../websocket/types';
import { getPlayerStateManager, PlayerStateManager } from './playerStateManager';
import { getServerAnnouncementManager, ServerAnnouncementManager } from './serverAnnouncementManager';

/** WebSocket 连接信息 */
interface ConnectionInfo {
  ws: import('ws').WebSocket;
  playerId: string;
  lastActive: number;
  heartbeatTimer?: ReturnType<typeof setTimeout>;
}

/** 连接管理器（全局单例） */
export class ConnectionManager {
  private static instance: ConnectionManager;

  // WebSocket 连接
  private connections: Map<string, ConnectionInfo> = new Map();

  // 管理器
  private playerStateManager: PlayerStateManager;
  private announcementManager: ServerAnnouncementManager;

  private constructor() {
    this.playerStateManager = getPlayerStateManager();
    this.announcementManager = getServerAnnouncementManager();
  }

  /** 获取单例实例 */
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  // ========== 连接管理 ==========

  /** 处理新连接 */
  onConnect(ws: WebSocket, playerId: string, initialState: PlayerOnlineState): void {
    // 如果该玩家已有连接，先断开旧连接
    const existingConnection = this.connections.get(playerId);
    if (existingConnection) {
      this.disconnectPlayer(playerId, 'disconnect');
    }

    // 存储连接
    this.connections.set(playerId, {
      ws,
      playerId,
      lastActive: Date.now(),
    });

    // 更新玩家状态
    this.playerStateManager.playerJoin(initialState);

    // 启动心跳检测
    this.startHeartbeatCheck(playerId);

    // 广播玩家进入（排除自己）
    this.broadcast<WSPlayerJoinPayload>({
      type: 'player_join',
      payload: {
        player: this.playerStateManager.getPlayer(playerId) as PlayerOnlineState,
        onlineCount: this.getOnlineCount(),
      },
      timestamp: Date.now(),
    }, playerId);

    // 发送排行榜同步
    this.sendLeaderboardSync(ws);

    // 发送历史公告
    this.sendAnnouncementHistory(ws);
  }

  /** 处理心跳 */
  onHeartbeat(playerId: string, data?: Partial<PlayerOnlineState>): void {
    const connection = this.connections.get(playerId);
    if (!connection) return;

    // 更新活跃时间
    connection.lastActive = Date.now();

    // 如果有状态更新
    if (data) {
      this.playerStateManager.updatePlayerState(playerId, data);
    }

    // 重置心跳检测
    this.startHeartbeatCheck(playerId);

    // 发送心跳响应
    this.send(playerId, {
      type: 'heartbeat_ack',
      payload: { serverTime: Date.now() },
      timestamp: Date.now(),
    });
  }

  /** 处理断开连接 */
  onDisconnect(playerId: string): void {
    this.disconnectPlayer(playerId, 'disconnect');
  }

  /** 处理删号请求 */
  onDeletePlayer(playerId: string, reason: 'restart' | 'manual'): void {
    const state = this.playerStateManager.getPlayer(playerId);
    const playerName = state?.name || 'Unknown';

    // 广播玩家离开（删号）
    this.broadcast<WSPlayerLeavePayload>({
      type: 'player_leave',
      payload: {
        playerId,
        playerName,
        reason: 'delete',
        onlineCount: this.connections.size - 1,
      },
      timestamp: Date.now(),
    });

    // 删除玩家
    this.playerStateManager.deletePlayer(playerId, reason);

    // 发送确认
    this.send(playerId, {
      type: 'player_deleted',
      payload: { playerId, reason },
      timestamp: Date.now(),
    });

    // 断开连接
    this.disconnectPlayer(playerId, 'delete');
  }

  /** 处理公告请求 */
  onAnnouncementRequest(request: AnnouncementRequest): void {
    const announcement = this.announcementManager.handleAnnouncementRequest(request);
    if (!announcement) return;

    // 广播公告
    this.broadcast<WSAnnouncementPayload>({
      type: 'announcement',
      payload: {
        announcement,
        onlineCount: this.getOnlineCount(),
      },
      timestamp: Date.now(),
    });
  }

  // ========== 查询接口 ==========

  /** 获取在线人数 */
  getOnlineCount(): number {
    return this.connections.size;
  }

  /** 获取所有排行榜 */
  getAllLeaderboards(): AllLeaderboards {
    return this.playerStateManager.getAllLeaderboards();
  }

  /** 获取在线玩家列表 */
  getOnlinePlayers(): PlayerOnlineState[] {
    return this.playerStateManager.getOnlinePlayers();
  }

  // ========== HTTP API 支持 ==========

  /** 注册玩家（HTTP API 模式，不依赖 WebSocket） */
  registerPlayer(state: PlayerOnlineState): void {
    // 创建一个虚拟连接（用于追踪在线状态）
    this.connections.set(state.id, {
      ws: null as any, // HTTP 模式下不需要 WebSocket
      playerId: state.id,
      lastActive: Date.now(),
    });

    // 更新玩家状态
    this.playerStateManager.playerJoin(state);
  }

  /** 更新玩家心跳（HTTP API 模式） */
  updatePlayerHeartbeat(playerId: string, data?: Partial<PlayerOnlineState>): void {
    const connection = this.connections.get(playerId);
    if (!connection) {
      // 如果玩家不存在，可能是重新连接，创建一个新记录
      if (data?.id && data?.name) {
        this.registerPlayer(data as PlayerOnlineState);
      }
      return;
    }

    // 更新活跃时间
    connection.lastActive = Date.now();

    // 如果有状态更新
    if (data) {
      this.playerStateManager.updatePlayerState(playerId, data);
    }
  }

  /** 清理过期连接（HTTP 模式下需要定期调用） */
  cleanupInactivePlayers(): number {
    const now = Date.now();
    const expiredThreshold = WS_CONFIG.HEARTBEAT_TIMEOUT;
    let cleaned = 0;

    for (const [playerId, connection] of this.connections) {
      if (now - connection.lastActive > expiredThreshold) {
        this.disconnectPlayer(playerId, 'timeout');
        cleaned++;
      }
    }

    return cleaned;
  }

  /** 获取公告历史 */
  getAnnouncementHistory() {
    return this.announcementManager.getHistory();
  }

  /** 创建公告（HTTP API 模式） */
  createAnnouncement(request: AnnouncementRequest): Announcement | null {
    const announcement = this.announcementManager.handleAnnouncementRequest(request);
    if (announcement) {
      // 广播公告（如果有 WebSocket 连接）
      this.broadcast<WSAnnouncementPayload>({
        type: 'announcement',
        payload: {
          announcement,
          onlineCount: this.getOnlineCount(),
        },
        timestamp: Date.now(),
      });
    }
    return announcement;
  }

  // ========== 内部方法 ==========

  /** 断开玩家连接 */
  private disconnectPlayer(playerId: string, reason: 'disconnect' | 'timeout' | 'delete'): void {
    const connection = this.connections.get(playerId);
    if (!connection) return;

    // 清理心跳检测
    if (connection.heartbeatTimer) {
      clearTimeout(connection.heartbeatTimer);
    }

    // 从连接列表移除
    this.connections.delete(playerId);

    // 更新玩家状态为离线
    if (reason !== 'delete') {
      this.playerStateManager.playerLeave(playerId);
    }

    // 广播玩家离开
    const state = this.playerStateManager.getPlayer(playerId);
    if (state) {
      this.broadcast<WSPlayerLeavePayload>({
        type: 'player_leave',
        payload: {
          playerId,
          playerName: state.name,
          reason,
          onlineCount: this.connections.size,
        },
        timestamp: Date.now(),
      });
    }

    // 关闭 WebSocket（如果存在）
    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close();
    }
  }

  /** 启动心跳检测 */
  private startHeartbeatCheck(playerId: string): void {
    const connection = this.connections.get(playerId);
    if (!connection) return;

    // 清除旧定时器
    if (connection.heartbeatTimer) {
      clearTimeout(connection.heartbeatTimer);
    }

    // 设置新定时器
    connection.heartbeatTimer = setTimeout(() => {
      const conn = this.connections.get(playerId);
      if (!conn) return;

      const elapsed = Date.now() - conn.lastActive;
      if (elapsed > WS_CONFIG.HEARTBEAT_TIMEOUT) {
        this.disconnectPlayer(playerId, 'timeout');
      }
    }, WS_CONFIG.HEARTBEAT_TIMEOUT);
  }

  /** 发送消息给指定玩家 */
  private send<T>(playerId: string, message: WSMessage<T>): void {
    const connection = this.connections.get(playerId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  /** 广播消息给所有玩家 */
  private broadcast<T>(message: WSMessage<T>, excludePlayerId?: string): void {
    const messageStr = JSON.stringify(message);

    for (const [playerId, connection] of this.connections) {
      if (playerId === excludePlayerId) continue;
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      }
    }
  }

  /** 发送排行榜同步 */
  private sendLeaderboardSync(ws: WebSocket): void {
    const leaderboards = this.playerStateManager.getAllLeaderboards();
    const onlinePlayers = this.playerStateManager.getOnlinePlayers();
    const onlineCount = this.getOnlineCount();
    
    console.log('[ConnectionManager] Sending leaderboard_sync, onlineCount:', onlineCount);
    console.log('[ConnectionManager] Leaderboards:', JSON.stringify(leaderboards).substring(0, 200));
    
    const message: WSMessage = {
      type: 'leaderboard_sync',
      payload: {
        leaderboards,
        onlinePlayers,
        onlineCount,
      },
      timestamp: Date.now(),
    };

    console.log('[ConnectionManager] WebSocket readyState:', ws.readyState, '(OPEN=1)');
    if (ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      ws.send(messageStr);
      console.log('[ConnectionManager] Sent leaderboard_sync, length:', messageStr.length);
    } else {
      console.log('[ConnectionManager] WebSocket not open, cannot send leaderboard_sync');
    }
  }

  /** 发送历史公告 */
  private sendAnnouncementHistory(ws: WebSocket): void {
    const history = this.announcementManager.getHistory();

    const message: WSMessage = {
      type: 'announcement_history',
      payload: {
        announcements: history,
        hasMore: false,
      },
      timestamp: Date.now(),
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /** 销毁实例 */
  destroy(): void {
    // 断开所有连接
    for (const [playerId] of this.connections) {
      this.disconnectPlayer(playerId, 'disconnect');
    }
    this.connections.clear();
  }
}

// 导出单例获取函数
export const getConnectionManager = () => ConnectionManager.getInstance();

// ========== 辅助函数 ==========

/** 从请求中提取初始状态 */
export function extractPlayerState(
  playerId: string,
  playerName: string,
  worldType: WorldType,
  level: number,
  realm: string,
  combatPower: number,
  statistics: PlayerOnlineState['statistics']
): PlayerOnlineState {
  return {
    id: playerId,
    name: playerName,
    worldType,
    level,
    realm,
    combatPower,
    statistics,
    connectionId: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    lastActive: Date.now(),
    joinedAt: Date.now(),
  };
}
