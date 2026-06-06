/**
 * 公告 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionManager } from '@/lib/multiplayer';
import type { AnnouncementRequest } from '@/types/announcement';

export async function GET(request: NextRequest) {
  try {
    const connectionManager = getConnectionManager();
    const history = connectionManager.getAnnouncementHistory();

    return NextResponse.json({
      success: true,
      data: {
        announcements: history,
      },
    });
  } catch (error) {
    console.error('[API] Announcement history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const announcementRequest = body as AnnouncementRequest;

    if (!announcementRequest.type || !announcementRequest.playerId || !announcementRequest.playerName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, playerId, playerName' },
        { status: 400 }
      );
    }

    const connectionManager = getConnectionManager();
    const announcement = connectionManager.createAnnouncement(announcementRequest);

    if (!announcement) {
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('[API] Announcement create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
