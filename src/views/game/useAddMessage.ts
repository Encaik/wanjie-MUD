/**
 * useAddMessage — 共享的消息添加 Hook
 *
 * 从 useGameState 中提取，供所有领域 Hook 和组件使用。
 */

'use client';

import { useCallback } from 'react';

import type { MessageRecord } from '@/core/types';

import { useGameStore } from './GameStore';

/**
 * 向游戏消息列表添加一条消息
 *
 * @returns addMessage 函数
 */
export function useAddMessage() {
  const { dispatch } = useGameStore();

  return useCallback(
    (type: MessageRecord['type'], title: string, content: string, details?: string, rewards?: MessageRecord['rewards']) => {
      dispatch(prev => ({
        ...prev,
        messages: addMessageToArray(prev.messages, type, title, content, details, rewards),
      }));
    },
    [dispatch],
  );
}

/**
 * 纯函数：向消息数组添加一条消息（也可被其他纯逻辑调用）
 */
export function addMessageToArray(
  messages: MessageRecord[],
  type: MessageRecord['type'],
  title: string,
  content: string,
  details?: string,
  rewards?: MessageRecord['rewards'],
): MessageRecord[] {
  const newMessage: MessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    title,
    content,
    details,
    rewards,
  };
  return [newMessage, ...messages].slice(0, 100);
}
