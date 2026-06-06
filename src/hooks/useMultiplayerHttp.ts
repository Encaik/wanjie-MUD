/**
 * 多人游戏 HTTP 轮询 Hook
 * 
 * 使用 HTTP API 替代 WebSocket 实现：
 * 1. 玩家在线状态同步
 * 2. 排行榜实时更新
 * 3. 公告获取
 * 
 * 特性：
 * - 支持"活跃模式"：用户查看排行榜时更频繁刷新（5秒）
 * - 支持"普通模式"：后台时降低刷新频率（15秒）
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerOnlineState, AllLeaderboards } from '@/types/multiplayer';
import type { Announcement, AnnouncementRequest } from '@/types/announcement';

/** 配置 - 更频繁的轮询以实现准实时体验 */
const CONFIG = {
  HEARTBEAT_INTERVAL: 10 * 1000, // 心跳间隔：10秒
  LEADERBOARD_POLL_ACTIVE: 5 * 1000, // 活跃模式排行榜刷新：5秒
  LEADERBOARD_POLL_IDLE: 15 * 1000, // 空闲模式排行榜刷新：15秒
  ANNOUNCEMENT_POLL_INTERVAL: 10 * 1000, // 公告轮询：10秒
  OFFLINE_TIMEOUT: 30 * 1000, // 离线超时：30秒无心跳视为离线
};

/** Hook 配置 */
interface UseMultiplayerHttpOptions {
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
  onConnectionStateChange?: (connected: boolean) => void;
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
interface UseMultiplayerHttpReturn {
  /** 是否已连接 */
  isConnected: boolean;
  /** 在线人数 */
  onlineCount: number;
  /** 在线玩家列表 */
  onlinePlayers: PlayerOnlineState[];
  /** 排行榜数据 */
  leaderboards: AllLeaderboards | null;
  /** 请求公告 */
  requestAnnouncement: (request: AnnouncementRequest) => Promise<void>;
  /** 手动刷新排行榜 */
  refreshLeaderboard: () => Promise<void>;
  /** 设置活跃模式（查看排行榜时启用，5秒刷新） */
  setActiveMode: (active: boolean) => void;
}

/**
 * 多人游戏 HTTP 轮询 Hook
 */
export function useMultiplayerHttp(options: UseMultiplayerHttpOptions): UseMultiplayerHttpReturn {
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
    onError,
  } = options;

  // 状态
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerOnlineState[]>([]);
  const [leaderboards, setLeaderboards] = useState<AllLeaderboards | null>(null);
  const [isActiveMode, setIsActiveMode] = useState(false);

  // Refs
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const leaderboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastAnnouncementIdRef = useRef<string>('');
  const isActiveModeRef = useRef<boolean>(false);

  // 同步活跃模式状态
  useEffect(() => {
    isActiveModeRef.current = isActiveMode;
    
    // 切换模式时重新设置排行榜轮询间隔
    if (leaderboardTimerRef.current) {
      clearInterval(leaderboardTimerRef.current);
      const interval = isActiveMode ? CONFIG.LEADERBOARD_POLL_ACTIVE : CONFIG.LEADERBOARD_POLL_IDLE;
      leaderboardTimerRef.current = setInterval(refreshLeaderboard, interval);
    }
  }, [isActiveMode]);

  // 发送心跳
  const sendHeartbeat = useCallback(async () => {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          playerData: {
            id: playerId,
            name: playerName,
            worldType,
            level,
            realm,
            combatPower,
            statistics,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Heartbeat failed');
      }

      const data = await response.json();
      setOnlineCount(data.onlineCount || 0);
    } catch (error) {
      console.error('[Multiplayer] Heartbeat error:', error);
    }
  }, [playerId, playerName, worldType, level, realm, combatPower, statistics]);

  // 刷新排行榜
  const refreshLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/multiplayer/leaderboard');

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeaderboards(data.data.leaderboards);
        setOnlinePlayers(data.data.onlinePlayers);
        setOnlineCount(data.data.onlineCount);
        onLeaderboardUpdate?.(data.data.leaderboards);
      }
    } catch (error) {
      console.error('[Multiplayer] Leaderboard refresh error:', error);
    }
  }, [onLeaderboardUpdate]);

  // 获取公告
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/multiplayer/announcements');

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();

      if (data.success && data.data.announcements) {
        // 只处理新公告
        const lastId = lastAnnouncementIdRef.current;
        const newAnnouncements = data.data.announcements.filter(
          (a: Announcement) => a.id > lastId
        );

        if (newAnnouncements.length > 0) {
          // 更新最后公告 ID
          lastAnnouncementIdRef.current = newAnnouncements[newAnnouncements.length - 1].id;
          
          // 触发回调
          newAnnouncements.forEach((a: Announcement) => onAnnouncement?.(a));
        }
      }
    } catch (error) {
      console.error('[Multiplayer] Announcement fetch error:', error);
    }
  }, [onAnnouncement]);

  // 请求创建公告
  const requestAnnouncement = useCallback(async (request: AnnouncementRequest) => {
    try {
      const response = await fetch('/api/multiplayer/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        onError?.(error.error || 'Failed to create announcement');
        return;
      }

      const data = await response.json();
      if (data.success) {
        onAnnouncement?.(data.data);
      }
    } catch (error) {
      console.error('[Multiplayer] Announcement request error:', error);
      onError?.('Failed to create announcement');
    }
  }, [onAnnouncement, onError]);

  // 设置活跃模式
  const setActiveMode = useCallback((active: boolean) => {
    setIsActiveMode(active);
  }, []);

  // 初始化连接
  useEffect(() => {
    mountedRef.current = true;

    const connect = async () => {
      try {
        // 注册玩家
        const response = await fetch('/api/multiplayer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'connect',
            playerData: {
              id: playerId,
              name: playerName,
              worldType,
              level,
              realm,
              combatPower,
              statistics,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Connection failed');
        }

        const data = await response.json();
        setIsConnected(true);
        setOnlineCount(data.onlineCount || 0);
        onConnectionStateChange?.(true);

        // 立即刷新排行榜
        await refreshLeaderboard();

        // 启动心跳定时器
        heartbeatTimerRef.current = setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL);

        // 启动排行榜轮询（初始使用空闲模式间隔）
        leaderboardTimerRef.current = setInterval(refreshLeaderboard, CONFIG.LEADERBOARD_POLL_IDLE);

        console.log('[Multiplayer] Connected successfully');
      } catch (error) {
        console.error('[Multiplayer] Connection error:', error);
        setIsConnected(false);
        onConnectionStateChange?.(false);
        onError?.('Failed to connect to multiplayer service');
      }
    };

    connect();

    return () => {
      mountedRef.current = false;

      // 清理定时器
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (leaderboardTimerRef.current) {
        clearInterval(leaderboardTimerRef.current);
      }

      // 断开连接
      fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          playerData: { id: playerId },
        }),
      }).catch(console.error);
    };
  }, [playerId]); // 只在 playerId 变化时重新连接

  return {
    isConnected,
    onlineCount,
    onlinePlayers,
    leaderboards,
    requestAnnouncement,
    refreshLeaderboard,
    setActiveMode,
  };
}
