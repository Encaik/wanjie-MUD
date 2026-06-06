/**
 * 多人游戏 API - 玩家连接/心跳/断开
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionManager } from '@/lib/multiplayer';
import type { PlayerOnlineState, PlayerStatistics } from '@/types/multiplayer';
import type { WorldType } from '@/types/base';

/** 默认统计数据 */
const DEFAULT_STATISTICS: PlayerStatistics = {
  totalEnemiesKilled: 0,
  totalBossKilled: 0,
  legendaryItems: 0,
  adventuresCompleted: 0,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, playerData } = body as {
      action: 'connect' | 'heartbeat' | 'disconnect';
      playerData: Partial<PlayerOnlineState> & { id: string; name: string };
    };

    const connectionManager = getConnectionManager();

    switch (action) {
      case 'connect': {
        if (!playerData.id || !playerData.name) {
          return NextResponse.json(
            { error: 'Missing required fields: id, name' },
            { status: 400 }
          );
        }

        const state: PlayerOnlineState = {
          id: playerData.id,
          name: playerData.name,
          worldType: (playerData.worldType as WorldType) || '修仙',
          level: playerData.level || 1,
          realm: playerData.realm || '凡人',
          combatPower: playerData.combatPower || 0,
          statistics: playerData.statistics || DEFAULT_STATISTICS,
          connectionId: `http-${playerData.id}-${Date.now()}`,
          lastActive: Date.now(),
          joinedAt: Date.now(),
        };

        // 注册玩家（使用临时 WebSocket 代理）
        connectionManager.registerPlayer(state);

        return NextResponse.json({
          success: true,
          onlineCount: connectionManager.getOnlineCount(),
          playerId: playerData.id,
        });
      }

      case 'heartbeat': {
        if (!playerData.id) {
          return NextResponse.json(
            { error: 'Missing player id' },
            { status: 400 }
          );
        }

        connectionManager.updatePlayerHeartbeat(playerData.id, playerData);
        
        return NextResponse.json({
          success: true,
          onlineCount: connectionManager.getOnlineCount(),
        });
      }

      case 'disconnect': {
        if (!playerData.id) {
          return NextResponse.json(
            { error: 'Missing player id' },
            { status: 400 }
          );
        }

        connectionManager.onDisconnect(playerData.id);
        
        return NextResponse.json({
          success: true,
          onlineCount: connectionManager.getOnlineCount(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Multiplayer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
