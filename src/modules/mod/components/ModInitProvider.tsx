'use client';

/**
 * 组件：ModInitProvider
 *
 * 客户端组件，在应用根布局中包裹所有子组件。
 * 提供 Mod 加载状态的 Context 供子组件读取。
 *
 * Mod 数据包已在服务端完成加载（通过 instrumentation.ts），
 * 客户端 ClientModLoader 负责加载主题/样式包（如有）。
 *
 * @module modules/mod
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ClientModLoader } from '@/core/mod/loader/client-loader';
import type { ModLoaderState, ModLoadWarning } from '../types';
import { ModErrorBanner } from './ModErrorBanner';

/** Mod 加载状态 Context（供子组件读取加载进度） */
const ModContext = createContext<ModLoaderState | null>(null);

/** 初始状态 */
const INITIAL_STATE: ModLoaderState = {
  phase: 'loading',
  progress: { current: 0, total: 0 },
  fatalError: null,
  warnings: [],
};

/**
 * 获取 Mod 加载状态
 *
 * 必须在 ModInitProvider 内部使用。
 */
export function useModContext(): ModLoaderState {
  const ctx = useContext(ModContext);
  return ctx ?? INITIAL_STATE;
}

interface ModInitProviderProps {
  children: React.ReactNode;
}

export function ModInitProvider({ children }: ModInitProviderProps) {
  const [state, setState] = useState<ModLoaderState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadClientMods() {
      const loader = new ClientModLoader();
      const warnings: ModLoadWarning[] = [];

      loader.setProgressCallback((progress) => {
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            phase: 'loading' as const,
            progress: { current: progress.current, total: progress.total },
          }));
        }
      });

      try {
        const result = await loader.loadAll();

        if (!cancelled) {
          // 收集失败的 Mod 作为警告
          for (const mod of loader.getFailedMods()) {
            warnings.push({
              id: mod.id,
              name: mod.name,
              error: mod.error,
            });
          }

          setState({
            phase: 'ready',
            progress: { current: result.total, total: result.total },
            fatalError: null,
            warnings,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            phase: 'ready',
            progress: { current: 0, total: 0 },
            fatalError: err instanceof Error ? err.message : '未知错误',
            warnings,
          });
        }
      }
    }

    loadClientMods();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModContext.Provider value={state}>
      <ModErrorBanner warnings={state.warnings} />
      {children}
    </ModContext.Provider>
  );
}
