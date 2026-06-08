/**
 * 游戏状态上下文
 * 提供全局状态管理和基础操作
 */

'use client';

import { createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

import { GameState, MessageRecord, DungeonConfig, ActionTab } from '@/types';

// ============================================
// Context 接口定义
// ============================================

/**
 * 游戏上下文接口
 * 包含所有游戏状态和操作方法
 */
export interface GameContextValue {
  // 状态
  gameState: GameState;
  
  // 状态设置器（供内部 hooks 使用）
  setGameState: Dispatch<SetStateAction<GameState>>;
  
  // 消息系统
  addMessage: (
    type: MessageRecord['type'], 
    title: string, 
    content: string, 
    details?: string, 
    rewards?: MessageRecord['rewards']
  ) => void;
  
  // 游戏流程
  startNewGame: () => void;
  resetGame: () => void;
  
  // Tab 切换
  setCurrentTab: (tab: ActionTab) => void;
  
  // 加载更多消息
  loadMoreMessages: () => Promise<boolean>;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
}

// ============================================
// Context 创建
// ============================================

const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// Provider 组件（占位，实际实现在 useGameState.tsx）
// ============================================

export function GameProvider({ children }: { children: ReactNode }) {
  // 这里只是一个占位实现
  // 实际实现在 useGameState.tsx 中，通过组合 hooks 实现
  throw new Error('GameProvider should be implemented in useGameState.tsx');
}

// ============================================
// Hook 导出
// ============================================

/**
 * 获取游戏上下文
 * 必须在 GameProvider 内部使用
 */
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}

/**
 * 获取游戏状态（便捷方法）
 */
export function useGameState(): GameState {
  const { gameState } = useGameContext();
  return gameState;
}

// 导出 Context 供高级用途
export { GameContext };
