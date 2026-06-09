/**
 * useGameMessages - 消息系统 Hook
 * 管理游戏消息的添加、加载和存储
 */

'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { generateId } from '@/modules/identity/logic/generators';
import {
  addMessage as dbAddMessage,
  getMessagesPage,
} from '@/shared/lib/messageDB';
import { MessageRecord } from '@/shared/lib/types';
import { MESSAGE_CONFIG } from '@/shared/lib/types';

interface UseGameMessagesProps {
  gameId: string;
  gameState: { messages: MessageRecord[] };
  setGameState: Dispatch<SetStateAction<any>>;
  isLoadingMessages: boolean;
  setIsLoadingMessages: (value: boolean) => void;
  hasMoreMessages: boolean;
  setHasMoreMessages: (value: boolean) => void;
  currentMessagePage: number;
  setCurrentMessagePage: (page: number) => void;
}

export interface UseGameMessagesReturn {
  addMessage: (
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => void;
  addMessageInternal: (
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => MessageRecord[];
  loadMoreMessages: () => Promise<boolean>;
}

/**
 * 消息系统 Hook
 */
export function useGameMessages({
  gameId,
  gameState,
  setGameState,
  isLoadingMessages,
  setIsLoadingMessages,
  hasMoreMessages,
  setHasMoreMessages,
  currentMessagePage,
  setCurrentMessagePage,
}: UseGameMessagesProps): UseGameMessagesReturn {
  
  // 内部函数：创建新消息并添加到消息列表
  const addMessageInternal = useCallback((
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ): MessageRecord[] => {
    const message: MessageRecord = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      title,
      content,
      details,
      rewards
    };
    
    // 异步存储到 IndexedDB + Supabase（不阻塞UI）
    dbAddMessage(gameId, message).catch(err => {
      console.error('Failed to save message:', err);
    });
    
    return [message, ...messages];
  }, [gameId]);

  // 添加消息（外部接口）
  const addMessage = useCallback((
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => {
    setGameState((prev: any) => ({
      ...prev,
      messages: addMessageInternal(prev.messages, type, title, content, details, rewards)
    }));
  }, [addMessageInternal, setGameState]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async (): Promise<boolean> => {
    if (isLoadingMessages || !hasMoreMessages) {
      return false;
    }
    
    setIsLoadingMessages(true);
    
    try {
      const nextPage = currentMessagePage + 1;
      const result = await getMessagesPage(gameId, nextPage, MESSAGE_CONFIG.memoryLimit);
      
      if (result.messages.length > 0) {
        // 将历史消息追加到列表末尾（保持时间顺序）
        setGameState((prev: any) => ({
          ...prev,
          messages: [...prev.messages, ...result.messages],
        }));
        
        setCurrentMessagePage(nextPage);
        setHasMoreMessages(result.hasMore);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to load more messages:', error);
      return false;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [
    isLoadingMessages, 
    hasMoreMessages, 
    currentMessagePage, 
    gameId, 
    setGameState,
    setIsLoadingMessages,
    setHasMoreMessages,
    setCurrentMessagePage
  ]);

  return {
    addMessage,
    addMessageInternal,
    loadMoreMessages,
  };
}
