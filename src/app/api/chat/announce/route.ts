/**
 * 系统公告 API
 * 用于广播玩家的重要成就
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, ChatMessageType } from '@/types/chat';

// 使用全局消息存储
declare global {
  // eslint-disable-next-line no-var
  var chatMessages: ChatMessage[] | undefined;
}

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// POST: 发送系统公告（内部使用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, playerName, detail } = body;
    
    // 验证请求来源（简单的内部验证）
    const authHeader = request.headers.get('x-internal-auth');
    if (authHeader !== 'game-server') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!global.chatMessages) {
      global.chatMessages = [];
    }
    
    // 根据类型生成公告内容
    let content = '';
    switch (type) {
      case 'breakthrough':
        content = `🎉 恭喜 ${playerName} 突破至 ${detail}！`;
        break;
      case 'legendary_item':
        content = `✨ ${playerName} 获得了传说级装备「${detail}」！`;
        break;
      case 'boss_kill':
        content = `⚔️ ${playerName} 成功击败了 ${detail}！`;
        break;
      case 'tribulation_success':
        content = `⚡ 恭喜 ${playerName} 成功渡劫，境界大涨！`;
        break;
      case 'faction_join':
        content = `🏛️ ${playerName} 加入了 ${detail}！`;
        break;
      default:
        content = detail;
    }
    
    // 创建系统消息
    const message: ChatMessage = {
      id: generateId(),
      senderId: 'system',
      senderName: '系统',
      senderLevel: 0,
      senderRealm: '',
      content,
      timestamp: Date.now(),
      type: 'announcement' as ChatMessageType
    };
    
    global.chatMessages.push(message);
    
    // 限制消息数量（与主API保持一致）
    const MAX_MESSAGES = 200;
    if (global.chatMessages.length > MAX_MESSAGES) {
      global.chatMessages.splice(0, global.chatMessages.length - MAX_MESSAGES);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement API error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
