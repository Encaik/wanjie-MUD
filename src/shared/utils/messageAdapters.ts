/**
 * 消息格式适配器
 *
 * 将不同来源的消息（聊天、公告）适配为统一的 MessageRecord 格式，
 * 以便在 MessagePanel 中统一展示。
 *
 * @module shared/utils
 */

import type { MessageRecord } from '@/core/types';
import type { ChatMessage } from '@/modules/social/chatTypes';
import type { Announcement } from '@/modules/social/announcementTypes';

/**
 * 将聊天消息适配为 MessageRecord
 *
 * 映射关系：senderName → title，content → content，channel 固定为 'chat'
 *
 * @param msg - 聊天消息
 * @returns MessageRecord 格式的消息
 */
export function chatToMessageRecord(msg: ChatMessage): MessageRecord {
  return {
    id: msg.id,
    timestamp: msg.timestamp,
    type: 'info',
    title: msg.senderName,
    content: msg.content,
    channel: 'chat',
  };
}

/**
 * 将公告适配为 MessageRecord
 *
 * 保留原始 title 和 content，channel 固定为 'announcement'
 *
 * @param ann - 公告数据
 * @returns MessageRecord 格式的消息
 */
export function announcementToMessageRecord(ann: Announcement): MessageRecord {
  return {
    id: ann.id,
    timestamp: ann.timestamp,
    type: 'info',
    title: ann.title,
    content: ann.content,
    channel: 'announcement',
  };
}
