'use client';

/**
 * 组件：ModInitProvider
 *
 * 客户端组件，在应用根布局中包裹所有子组件。
 * 负责初始化 Mod 加载流程并通过 Context 向下传递加载状态。
 * 不再渲染全屏遮罩——加载状态的展示由各子组件自行决定。
 *
 * @module modules/mod
 */

import { createContext, useContext } from 'react';
import { useModLoader } from '../hooks/useModLoader';
import type { ModLoaderState } from '../hooks/useModLoader';
import { ModErrorBanner } from './ModErrorBanner';

/** Mod 加载状态 Context（供子组件读取加载进度） */
const ModContext = createContext<ModLoaderState | null>(null);

/**
 * 获取 Mod 加载状态
 *
 * 必须在 ModInitProvider 内部使用。
 * @returns ModLoaderState（加载阶段、进度、错误信息等）
 */
export function useModContext(): ModLoaderState {
  const ctx = useContext(ModContext);
  if (!ctx) {
    // 未包裹 ModInitProvider 时返回 safe default
    return {
      phase: 'ready',
      progress: { current: 0, total: 0 },
      fatalError: null,
      warnings: [],
    };
  }
  return ctx;
}

interface ModInitProviderProps {
  children: React.ReactNode;
}

export function ModInitProvider({ children }: ModInitProviderProps) {
  const state = useModLoader();

  return (
    <ModContext.Provider value={state}>
      <ModErrorBanner warnings={state.warnings} />
      {children}
    </ModContext.Provider>
  );
}
