/**
 * 消息存储服务 - 内存存储
 * 用于管理游戏消息记录，支持分页查询
 */

import { MessageRecord } from './types';

// 消息存储接口
interface MessageStore {
  messages: MessageRecord[];
  total: number;
}

// 全局消息存储（按游戏会话ID分组）
const messageStores = new Map<string, MessageStore>();

// 默认会话ID
const DEFAULT_SESSION_ID = 'default';

/**
 * 获取或创建消息存储
 */
function getStore(sessionId: string = DEFAULT_SESSION_ID): MessageStore {
  if (!messageStores.has(sessionId)) {
    messageStores.set(sessionId, { messages: [], total: 0 });
  }
  return messageStores.get(sessionId)!;
}

/**
 * 添加消息
 */
export function addMessage(sessionId: string, message: MessageRecord): void {
  const store = getStore(sessionId);
  store.messages.unshift(message); // 新消息插入到前面
  store.total = store.messages.length;
}

/**
 * 批量添加消息（用于初始化）
 */
export function addMessages(sessionId: string, messages: MessageRecord[]): void {
  const store = getStore(sessionId);
  // 按时间戳降序排列后插入
  const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
  store.messages = [...sortedMessages, ...store.messages];
  store.total = store.messages.length;
}

/**
 * 获取消息总数
 */
export function getTotalMessages(sessionId: string = DEFAULT_SESSION_ID): number {
  return getStore(sessionId).total;
}

/**
 * 分页获取消息
 * @param sessionId 会话ID
 * @param page 页码（从1开始）
 * @param pageSize 每页数量
 * @returns 消息列表和分页信息
 */
export function getMessages(
  sessionId: string = DEFAULT_SESSION_ID,
  page: number = 1,
  pageSize: number = 20
): {
  messages: MessageRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
} {
  const store = getStore(sessionId);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const messages = store.messages.slice(startIndex, endIndex);
  
  return {
    messages,
    total: store.total,
    page,
    pageSize,
    hasMore: endIndex < store.total,
  };
}

/**
 * 清空消息
 */
export function clearMessages(sessionId: string = DEFAULT_SESSION_ID): void {
  const store = getStore(sessionId);
  store.messages = [];
  store.total = 0;
}

/**
 * 替换所有消息（用于同步前端状态）
 */
export function setMessages(sessionId: string, messages: MessageRecord[]): void {
  const store = getStore(sessionId);
  store.messages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
  store.total = store.messages.length;
}
