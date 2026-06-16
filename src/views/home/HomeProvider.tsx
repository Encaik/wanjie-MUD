/**
 * HomeProvider — 首页轻量游戏状态管理
 *
 * 职责：为首页提供最小化的 gameState + startNewGame + importSave，
 * 不导入任何 @/modules/ 游戏逻辑，大幅减少首页 JS bundle。
 *
 * 当用户点击"踏入万界"进入 /world-select 后，PathAwareProvider
 * 会切换为完整的 GameProvider（懒加载），GameProvider 通过 localStorage 恢复状态。
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { GameState } from '@/core/types';
import { safeSaveGameState } from '@/shared/utils/saveUtils';
import { createInitialGameState } from '@/views/game/state/initialState';

// ============================================
// Context
// ============================================

interface HomeGameContextType {
  gameState: GameState;
  startNewGame: (worldviewId?: string) => Promise<void>;
  importSave: (jsonString: string) => void;
}

const HomeGameContext = createContext<HomeGameContextType | null>(null);

// ============================================
// Provider
// ============================================

/**
 * 首页专用轻量 Provider
 *
 * 仅包含首页和过渡到世界选择页所需的最小功能：
 * - gameState（世界列表、阶段等）
 * - startNewGame（调用 API 生成世界，存入 localStorage，跳转到 /world-select）
 * - importSave（导入存档 JSON）
 */
export function HomeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // 初始状态始终为 createInitialGameState()，确保 SSR 与客户端首次渲染一致，避免水合不匹配
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const isInitialized = useRef(false);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // ========================================
  // 客户端挂载后从 localStorage 恢复存档状态
  // ========================================

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gameState');
      if (raw) {
        const saved = JSON.parse(raw) as GameState;
        if (saved && typeof saved === 'object') {
          setGameState(saved);
        }
      }
    } catch { /* 存档损坏时使用默认状态 */ }
    isInitialized.current = true;
  }, []);

  // ========================================
  // 自动保存（gameState 变更时）
  // ========================================

  useEffect(() => {
    if (!isInitialized.current) return;
    safeSaveGameState(gameState);
  }, [gameState]);

  // ========================================
  // 开始新游戏
  // ========================================

  const startNewGame = useCallback(async (worldviewId?: string) => {
    // 延迟导入 api-client，避免首屏加载
    const { post } = await import('@/shared/utils/api-client');

    // 清除旧世界的主题（CSS 变量、localStorage 缓存、data-world 属性）
    const { emit } = await import('@/core/events');
    const { worldEvents } = await import('@/modules/theme');
    emit(worldEvents.events.new_game_started, {});

    // 1. 重置为初始状态，进入世界选择阶段
    const newState: GameState = {
      ...createInitialGameState(),
      phase: 'world-select',
      worlds: [],
    };

    // 2. 调用 API 生成世界
    const body: Record<string, unknown> = { count: 8 };
    if (worldviewId) body.worldviewId = worldviewId;

    const { code, data } = await post<{ worlds: GameState['worlds'] }>(
      '/api/v1/worlds/generate/basic',
      body,
    );

    if (code === 200 && data) {
      // 3. 更新状态并同步写入 localStorage（确保跨 Provider 持久化）
      const finalState: GameState = { ...newState, worlds: data.worlds };
      setGameState(finalState);
      safeSaveGameState(finalState);

      // 4. 跳转到世界选择页（此时 PathAwareProvider 会切换为完整 GameProvider）
      router.push('/world-select');
    } else {
      // 失败时仍跳转，显示空世界列表
      setGameState(newState);
      safeSaveGameState(newState);
      router.push('/world-select');
    }
  }, [router]);

  // ========================================
  // 导入存档
  // ========================================

  const importSave = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as GameState;
      if (imported && typeof imported === 'object') {
        setGameState(imported);
        safeSaveGameState(imported);
        // 如果存档中有主角，跳转到游戏页
        if (imported.protagonist && imported.phase === 'playing') {
          router.push('/game');
        }
      }
    } catch {
      // 忽略无效 JSON
    }
  }, [router]);

  return (
    <HomeGameContext.Provider value={{ gameState, startNewGame, importSave }}>
      {children}
    </HomeGameContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/** 首页专用 useGame 替代 Hook */
export function useHomeGame(): HomeGameContextType {
  const ctx = useContext(HomeGameContext);
  if (!ctx) {
    throw new Error('useHomeGame must be used within a HomeProvider');
  }
  return ctx;
}
