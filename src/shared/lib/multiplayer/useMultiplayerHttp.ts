/**
 * 多人游戏 HTTP 轮询 Hook
 *
 * 注意：静态导出模式下无服务端 API，多人功能已禁用。
 * 此 Hook 返回空状态，保留接口兼容性。
 */

'use client';

import { useCallback, useState } from 'react';

import type { Announcement, AnnouncementRequest } from '@/modules/social/announcementTypes';
import type { PlayerOnlineState, AllLeaderboards } from '@/modules/social/multiplayerTypes';

/** Hook 配置 */
interface UseMultiplayerHttpOptions {
  playerId: string;
  playerName: string;
  worldType: PlayerOnlineState['worldType'];
  level: number;
  realm: string;
  combatPower: number;
  statistics?: PlayerOnlineState['statistics'];
  onConnectionStateChange?: (connected: boolean) => void;
  onLeaderboardUpdate?: (leaderboards: AllLeaderboards) => void;
  onAnnouncement?: (announcement: Announcement) => void;
  onPlayerJoin?: (player: PlayerOnlineState, onlineCount: number) => void;
  onPlayerLeave?: (playerId: string, playerName: string, reason: string, onlineCount: number) => void;
  onError?: (error: string) => void;
}

/** Hook 返回值 */
interface UseMultiplayerHttpReturn {
  isConnected: boolean;
  onlineCount: number;
  onlinePlayers: PlayerOnlineState[];
  leaderboards: AllLeaderboards | null;
  requestAnnouncement: (request: AnnouncementRequest) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  setActiveMode: (active: boolean) => void;
}

/**
 * 多人游戏 HTTP 轮询 Hook（静态模式下返回空状态）
 */
export function useMultiplayerHttp(_options: UseMultiplayerHttpOptions): UseMultiplayerHttpReturn {
  const [isConnected] = useState(false);
  const [onlineCount] = useState(0);
  const [onlinePlayers] = useState<PlayerOnlineState[]>([]);
  const [leaderboards] = useState<AllLeaderboards | null>(null);

  const requestAnnouncement = useCallback(async (_request: AnnouncementRequest) => {
    // 静态模式下不发送公告
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    // 静态模式下不刷新排行榜
  }, []);

  const setActiveMode = useCallback((_active: boolean) => {
    // 静态模式下不切换模式
  }, []);

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
