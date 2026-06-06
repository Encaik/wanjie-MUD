/**
 * 聊天工具函数
 * 用于发送系统公告等
 */

import { ChatMessage } from '@/types/chat';

// 发送系统公告
export async function sendSystemAnnouncement(
  type: 'breakthrough' | 'legendary_item' | 'boss_kill' | 'tribulation_success' | 'faction_join',
  playerName: string,
  detail: string
): Promise<void> {
  try {
    await fetch('/api/chat/announce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': 'game-server'
      },
      body: JSON.stringify({ type, playerName, detail })
    });
  } catch (error) {
    console.error('Failed to send announcement:', error);
  }
}
