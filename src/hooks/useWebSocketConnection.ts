/**
 * WebSocket 连接管理 Hook
 * 
 * 功能：
 * 1. 自动连接/重连
 * 2. 心跳检测
 * 3. 状态同步
 * 4. 排行榜更新
 * 5. 公告接收
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { WS_CONFIG, WSMessage, WSConnectionState, WSAuthPayload, WSAuthSuccessPayload } from '@/lib/websocket/types';
import type { Announcement, AnnouncementRequest } from '@/types/announcement';
import type { PlayerOnlineState, AllLeaderboards } from '@/types/multiplayer';

/** Hook 配置 */
interface UseWebSocketConnectionOptions {
  /** 玩家 ID */
  playerId: string;
  /** 玩家名称 */
  playerName: string;
  /** 世界类型 */
  worldType: PlayerOnlineState['worldType'];
  /** 等级 */
  level: number;
  /** 境界 */
  realm: string;
  /** 战力 */
  combatPower: number;
  /** 统计数据 */
  statistics?: PlayerOnlineState['statistics'];
  /** 连接状态变化回调 */
  onConnectionStateChange?: (state: WSConnectionState) => void;
  /** 排行榜更新回调 */
  onLeaderboardUpdate?: (leaderboards: AllLeaderboards) => void;
  /** 公告回调 */
  onAnnouncement?: (announcement: Announcement) => void;
  /** 玩家进入回调 */
  onPlayerJoin?: (player: PlayerOnlineState, onlineCount: number) => void;
  /** 玩家离开回调 */
  onPlayerLeave?: (playerId: string, playerName: string, reason: string, onlineCount: number) => void;
  /** 错误回调 */
  onError?: (error: string) => void;
}

/** Hook 返回值 */
interface UseWebSocketConnectionReturn {
  /** 连接状态 */
  connectionState: WSConnectionState;
  /** 在线人数 */
  onlineCount: number;
  /** 在线玩家列表 */
  onlinePlayers: PlayerOnlineState[];
  /** 排行榜数据 */
  leaderboards: AllLeaderboards | null;
  /** 发送消息 */
  send: <T>(message: WSMessage<T>) => void;
  /** 请求公告 */
  requestAnnouncement: (request: AnnouncementRequest) => void;
  /** 删除玩家 */
  deletePlayer: (reason: 'restart' | 'manual') => void;
  /** 手动重连 */
  reconnect: () => void;
}

/**
 * WebSocket 连接管理 Hook
 */
export function useWebSocketConnection(options: UseWebSocketConnectionOptions): UseWebSocketConnectionReturn {
  const {
    playerId,
    playerName,
    worldType,
    level,
    realm,
    combatPower,
    statistics,
    onConnectionStateChange,
    onLeaderboardUpdate,
    onAnnouncement,
    onPlayerJoin,
    onPlayerLeave,
    onError,
  } = options;

  // 状态
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected');
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerOnlineState[]>([]);
  const [leaderboards, setLeaderboards] = useState<AllLeaderboards | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // 更新连接状态
  const updateConnectionState = useCallback((state: WSConnectionState) => {
    if (!mountedRef.current) return;
    setConnectionState(state);
    onConnectionStateChange?.(state);
  }, [onConnectionStateChange]);

  // 发送消息
  const send = useCallback(<T,>(message: WSMessage<T>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // 请求公告
  const requestAnnouncement = useCallback((request: AnnouncementRequest) => {
    send({
      type: 'announcement_request',
      payload: { request },
      timestamp: Date.now(),
    });
  }, [send]);

  // 删除玩家
  const deletePlayer = useCallback((reason: 'restart' | 'manual') => {
    send({
      type: 'delete_player',
      payload: { playerId, reason },
      timestamp: Date.now(),
    });
  }, [send, playerId]);

  // 处理消息
  const handleMessage = useCallback((raw: string) => {
    try {
      const message: WSMessage = JSON.parse(raw);
      console.log('[WS] Received message type:', message.type);

      switch (message.type) {
        case 'welcome': {
          console.log('[WS] Received welcome, sending auth...');
          // 收到欢迎消息后发送认证
          const authPayload: WSAuthPayload = {
            playerId,
            playerName,
            worldType,
            level,
            realm,
            combatPower,
            statistics,
          };
          send({
            type: 'auth',
            payload: authPayload,
            timestamp: Date.now(),
          });
          break;
        }

        case 'auth_success': {
          const payload = message.payload as WSAuthSuccessPayload;
          console.log('[WS] Auth success:', payload);
          setOnlineCount(payload.onlineCount);
          break;
        }

        case 'heartbeat_ack': {
          // 心跳响应，无需处理
          break;
        }

        case 'leaderboard_sync': {
          const payload = message.payload as {
            leaderboards: AllLeaderboards;
            onlinePlayers: PlayerOnlineState[];
            onlineCount: number;
          };
          setLeaderboards(payload.leaderboards);
          setOnlinePlayers(payload.onlinePlayers);
          setOnlineCount(payload.onlineCount);
          onLeaderboardUpdate?.(payload.leaderboards);
          break;
        }

        case 'leaderboard_update': {
          const payload = message.payload as {
            leaderboards: AllLeaderboards;
          };
          setLeaderboards(payload.leaderboards);
          onLeaderboardUpdate?.(payload.leaderboards);
          break;
        }

        case 'announcement': {
          const payload = message.payload as {
            announcement: Announcement;
            onlineCount: number;
          };
          setOnlineCount(payload.onlineCount);
          onAnnouncement?.(payload.announcement);
          break;
        }

        case 'announcement_history': {
          const payload = message.payload as {
            announcements: Announcement[];
          };
          // 处理历史公告（可选）
          payload.announcements.forEach(a => onAnnouncement?.(a));
          break;
        }

        case 'player_join': {
          const payload = message.payload as {
            player: PlayerOnlineState;
            onlineCount: number;
          };
          setOnlinePlayers(prev => [...prev, payload.player]);
          setOnlineCount(payload.onlineCount);
          onPlayerJoin?.(payload.player, payload.onlineCount);
          break;
        }

        case 'player_leave': {
          const payload = message.payload as {
            playerId: string;
            playerName: string;
            reason: string;
            onlineCount: number;
          };
          setOnlinePlayers(prev => prev.filter(p => p.id !== payload.playerId));
          setOnlineCount(payload.onlineCount);
          onPlayerLeave?.(payload.playerId, payload.playerName, payload.reason, payload.onlineCount);
          break;
        }

        case 'player_deleted': {
          // 自己被删除，关闭连接
          if (wsRef.current) {
            wsRef.current.close();
          }
          break;
        }

        case 'error': {
          const payload = message.payload as { message: string };
          onError?.(payload.message);
          break;
        }

        case 'pong': {
          // Ping 响应，无需处理
          break;
        }

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }, [onAnnouncement, onError, onLeaderboardUpdate, onPlayerJoin, onPlayerLeave]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateConnectionState('connecting');

    // 构建 WebSocket URL（不再使用 URL 参数，改为消息认证）
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5000';
    const wsUrl = `${protocol}//${host}/ws/game`;

    console.log('[WS] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connection opened, waiting for welcome...');
        if (!mountedRef.current) return;
        
        updateConnectionState('connected');
        
        // 启动心跳
        heartbeatTimerRef.current = setInterval(() => {
          send({
            type: 'heartbeat',
            payload: {},
            timestamp: Date.now(),
          });
        }, WS_CONFIG.HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        console.log('[WS] Received message:', event.data.substring(0, 100));
        handleMessage(event.data as string);
      };

      ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason);
        if (!mountedRef.current) return;
        
        // 清理心跳
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }

        updateConnectionState('disconnected');

        // 非正常关闭，尝试重连
        if (event.code !== 1000 && event.code !== 1001) {
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, WS_CONFIG.RECONNECT_INTERVAL);
        }
      };

      ws.onerror = () => {
        console.error('WebSocket error');
        updateConnectionState('error');
        onError?.('WebSocket connection error');
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      updateConnectionState('error');
      onError?.('Failed to create WebSocket connection');
    }
  }, [
    playerId,
    playerName,
    worldType,
    level,
    realm,
    combatPower,
    statistics,
    updateConnectionState,
    send,
    handleMessage,
    onError,
  ]);

  // 手动重连
  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  // 初始化连接
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      
      // 清理定时器
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      // 关闭连接
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  return {
    connectionState,
    onlineCount,
    onlinePlayers,
    leaderboards,
    send,
    requestAnnouncement,
    deletePlayer,
    reconnect,
  };
}
