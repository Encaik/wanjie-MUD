/**
 * 万界聊天群 API
 * GET: 获取消息列表（同时更新在线状态）
 * POST: 发送新消息
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, SendChatMessageRequest, GetChatMessagesResponse, OnlinePlayer } from '@/types/chat';

// 内存存储消息（生产环境应使用数据库）
declare global {
  // eslint-disable-next-line no-var
  var chatMessages: ChatMessage[] | undefined;
  // eslint-disable-next-line no-var
  var onlinePlayers: Map<string, { name: string; level: number; realm: string; lastActive: number }> | undefined;
  // eslint-disable-next-line no-var
  var lastCleanupTime: number | undefined;
  // 刷屏检测：记录每个用户的消息时间戳
  // eslint-disable-next-line no-var
  var spamTracker: Map<string, number[]> | undefined;
}

// 初始化全局存储
if (!global.chatMessages) {
  global.chatMessages = [];
}

if (!global.onlinePlayers) {
  global.onlinePlayers = new Map();
}

if (!global.lastCleanupTime) {
  global.lastCleanupTime = Date.now();
}

if (!global.spamTracker) {
  global.spamTracker = new Map();
}

const MESSAGES = global.chatMessages;
const ONLINE_PLAYERS = global.onlinePlayers;
const SPAM_TRACKER = global.spamTracker;

// 配置常量
const MAX_MESSAGES = 200; // 最大消息数量
const PAGE_SIZE = 50; // 每页消息数量
const ONLINE_TIMEOUT = 3 * 60 * 1000; // 在线超时（3分钟）
const MESSAGE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 消息过期（24小时）
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 清理间隔（10分钟）
const SPAM_WINDOW = 30 * 1000; // 刷屏检测窗口（30秒）
const SPAM_LIMIT = 20; // 窗口内最大消息数

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 检查是否刷屏
function checkSpam(senderId: string): boolean {
  const now = Date.now();
  const timestamps = SPAM_TRACKER.get(senderId) || [];
  
  // 过滤掉窗口外的时间戳
  const recentTimestamps = timestamps.filter(t => now - t < SPAM_WINDOW);
  
  // 更新时间戳列表
  SPAM_TRACKER.set(senderId, recentTimestamps);
  
  // 检查是否超过限制
  return recentTimestamps.length >= SPAM_LIMIT;
}

// 记录消息发送
function recordMessage(senderId: string) {
  const timestamps = SPAM_TRACKER.get(senderId) || [];
  timestamps.push(Date.now());
  SPAM_TRACKER.set(senderId, timestamps);
}

// 清理过期数据
function cleanup() {
  const now = Date.now();
  
  // 清理过期玩家
  for (const [id, player] of ONLINE_PLAYERS.entries()) {
    if (now - player.lastActive > ONLINE_TIMEOUT) {
      ONLINE_PLAYERS.delete(id);
    }
  }
  
  // 清理过期消息（保留系统消息和公告）
  const expireThreshold = now - MESSAGE_EXPIRE_TIME;
  const validMessages = MESSAGES.filter(
    m => m.type !== 'player' || m.timestamp > expireThreshold
  );
  
  // 如果消息数量仍然超过上限，删除最旧的消息
  while (validMessages.length > MAX_MESSAGES) {
    const oldestPlayerIndex = validMessages.findIndex(m => m.type === 'player');
    if (oldestPlayerIndex >= 0) {
      validMessages.splice(oldestPlayerIndex, 1);
    } else {
      break;
    }
  }
  
  MESSAGES.length = 0;
  MESSAGES.push(...validMessages);
  
  // 清理刷屏追踪器
  for (const [id, timestamps] of SPAM_TRACKER.entries()) {
    const recent = timestamps.filter(t => now - t < SPAM_WINDOW);
    if (recent.length === 0) {
      SPAM_TRACKER.delete(id);
    } else {
      SPAM_TRACKER.set(id, recent);
    }
  }
  
  global.lastCleanupTime = now;
}

// 检查是否需要清理
function checkCleanup() {
  const now = Date.now();
  if (now - (global.lastCleanupTime || 0) > CLEANUP_INTERVAL) {
    cleanup();
  }
}

// 敏感词过滤
const SENSITIVE_WORDS = ['刷屏', '广告', '外挂', '代练'];
function filterContent(content: string): string {
  let filtered = content;
  for (const word of SENSITIVE_WORDS) {
    filtered = filtered.replace(new RegExp(word, 'gi'), '***');
  }
  return filtered;
}

// 更新玩家在线状态
function updatePlayerOnline(id: string, name: string, level: number, realm: string) {
  ONLINE_PLAYERS.set(id, { name, level, realm, lastActive: Date.now() });
}

// GET: 获取消息列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playerId = searchParams.get('playerId');
  const playerName = searchParams.get('playerName');
  const playerLevel = searchParams.get('playerLevel');
  const playerRealm = searchParams.get('playerRealm');
  const after = searchParams.get('after') ? parseInt(searchParams.get('after')!) : undefined;
  
  // 更新在线状态
  if (playerId && playerName && playerLevel) {
    updatePlayerOnline(playerId, playerName, parseInt(playerLevel) || 0, playerRealm || '');
  }
  
  // 检查清理
  checkCleanup();
  
  // 清理过期玩家
  const now = Date.now();
  for (const [id, player] of ONLINE_PLAYERS.entries()) {
    if (now - player.lastActive > ONLINE_TIMEOUT) {
      ONLINE_PLAYERS.delete(id);
    }
  }
  
  // 获取在线玩家列表
  const onlinePlayersList: OnlinePlayer[] = Array.from(ONLINE_PLAYERS.entries())
    .map(([id, data]) => ({
      id, name: data.name, level: data.level, realm: data.realm, lastActive: data.lastActive
    }))
    .sort((a, b) => b.level - a.level);
  
  // 获取消息
  let recentMessages = [...MESSAGES];
  if (after) {
    // 只获取指定时间之后的新消息
    recentMessages = recentMessages.filter(m => m.timestamp > after);
  } else {
    // 获取最近的消息
    recentMessages = recentMessages.slice(-PAGE_SIZE);
  }
  
  const response: GetChatMessagesResponse & { onlinePlayers: OnlinePlayer[] } = {
    messages: recentMessages,
    total: MESSAGES.length,
    hasMore: MESSAGES.length > PAGE_SIZE,
    onlinePlayers: onlinePlayersList
  };
  
  return NextResponse.json(response);
}

// POST: 发送新消息
export async function POST(request: NextRequest) {
  try {
    const body: SendChatMessageRequest = await request.json();
    
    if (!body.senderId || !body.senderName || !body.content) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }
    
    if (body.content.length > 200) {
      return NextResponse.json({ error: '消息长度不能超过200字' }, { status: 400 });
    }
    
    // 检查刷屏
    if (checkSpam(body.senderId)) {
      return NextResponse.json({ 
        error: '发言过于频繁，请稍后再试',
        spamWarning: true 
      }, { status: 429 });
    }
    
    // 更新在线状态
    updatePlayerOnline(body.senderId, body.senderName, body.senderLevel, body.senderRealm);
    
    // 创建消息
    const message: ChatMessage = {
      id: generateId(),
      senderId: body.senderId,
      senderName: body.senderName,
      senderLevel: body.senderLevel,
      senderRealm: body.senderRealm,
      content: filterContent(body.content),
      timestamp: Date.now(),
      type: 'player'
    };
    
    MESSAGES.push(message);
    
    // 记录发送
    recordMessage(body.senderId);
    
    // 检查清理
    checkCleanup();
    
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
