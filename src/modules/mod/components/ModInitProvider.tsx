'use client';

/**
 * 组件：ModInitProvider
 *
 * 客户端组件，在应用根布局中包裹所有子组件。
 * 提供 Mod 加载状态的 Context 供子组件读取。
 *
 * Mod 数据已在服务端完成加载（通过 instrumentation.ts），
 * 客户端不再独立执行 fetch 加载管线，始终返回 ready 状态。
 *
 * @module modules/mod
 */

import { createContext, useContext } from 'react';
import type { ModLoaderState } from '../types';
import { ModErrorBanner } from './ModErrorBanner';

/** Mod 加载状态 Context（供子组件读取加载进度） */
const ModContext = createContext<ModLoaderState | null>(null);

/** 安全默认值：始终就绪（Mod 数据已由服务端加载） */
const SAFE_DEFAULT: ModLoaderState = {
  phase: 'ready',
  progress: { current: 0, total: 0 },
  fatalError: null,
  warnings: [],
};

/**
 * 获取 Mod 加载状态
 *
 * 必须在 ModInitProvider 内部使用。
 * @returns ModLoaderState（始终为 ready，Mod 数据已在服务端加载完成）
 */
export function useModContext(): ModLoaderState {
  const ctx = useContext(ModContext);
  return ctx ?? SAFE_DEFAULT;
}

interface ModInitProviderProps {
  children: React.ReactNode;
}

export function ModInitProvider({ children }: ModInitProviderProps) {
  return (
    <ModContext.Provider value={SAFE_DEFAULT}>
      <ModErrorBanner warnings={[]} />
      {children}
    </ModContext.Provider>
  );
}
