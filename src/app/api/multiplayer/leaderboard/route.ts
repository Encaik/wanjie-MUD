/**
 * 排行榜 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionManager } from '@/lib/multiplayer';

export async function GET(request: NextRequest) {
  try {
    const connectionManager = getConnectionManager();
    
    const leaderboards = connectionManager.getAllLeaderboards();
    const onlinePlayers = connectionManager.getOnlinePlayers();
    const onlineCount = connectionManager.getOnlineCount();

    return NextResponse.json({
      success: true,
      data: {
        leaderboards,
        onlinePlayers,
        onlineCount,
      },
    });
  } catch (error) {
    console.error('[API] Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
