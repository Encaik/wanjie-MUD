/**
 * 聊天系统类型定义
 */

// 聊天消息类型
export type ChatMessageType = 'player' | 'system' | 'announcement';

// 聊天消息
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderLevel: number;
  senderRealm: string;
  content: string;
  timestamp: number;
  type: ChatMessageType;
}

// 发送消息请求
export interface SendChatMessageRequest {
  senderId: string;
  senderName: string;
  senderLevel: number;
  senderRealm: string;
  content: string;
}

// 获取消息响应
export interface GetChatMessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

// 在线玩家
export interface OnlinePlayer {
  id: string;
  name: string;
  level: number;
  realm: string;
  lastActive: number;
}
