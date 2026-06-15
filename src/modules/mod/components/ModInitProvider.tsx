'use client';

/**
 * 组件：ModInitProvider
 *
 * 客户端组件，在应用根布局中包裹所有子组件。
 * 提供 Mod 加载状态的 Context 供子组件读取。
 *
 * Mod 数据包已在服务端完成加载（通过 instrumentation.ts）。
 *
 * TODO: 客户端 Mod 加载（主题/样式包）已临时停用。
 * 等后续有客户端加载 Mod 的需求时再启用并完善 ClientModLoader 逻辑。
 * 启用步骤：
 *   1. 取消注释下方的 useEffect 中的 loadClientMods() 调用
 *   2. 恢复 ClientModLoader 导入
 *
 * @module modules/mod
 */

import { createContext, useContext, useState } from 'react';
// import { ClientModLoader } from '@/core/mod/loader/client-loader';
import type { ModLoaderState } from '../types';
import { ModErrorBanner } from './ModErrorBanner';

/** Mod 加载状态 Context（供子组件读取加载进度） */
const ModContext = createContext<ModLoaderState | null>(null);

/** 就绪状态（客户端 Mod 加载已停用，直接标记为 ready） */
const READY_STATE: ModLoaderState = {
  phase: 'ready',
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
  return ctx ?? READY_STATE;
}

interface ModInitProviderProps {
  children: React.ReactNode;
}

export function ModInitProvider({ children }: ModInitProviderProps) {
  // 客户端 Mod 加载已临时停用，直接设为就绪状态
  const [state] = useState<ModLoaderState>(READY_STATE);

  // ============================================================
  // TODO: 客户端 Mod 加载逻辑 — 临时停用
  // 等后续有客户端加载 Mod 的需求时取消注释以下代码块，
  // 并删除上面的 useState(READY_STATE)，恢复下方的 useEffect。
  // ============================================================
  //
  // useEffect(() => {
  //   let cancelled = false;
  //
  //   async function loadClientMods() {
  //     const loader = new ClientModLoader();
  //     const warnings: ModLoadWarning[] = [];
  //
  //     loader.setProgressCallback((progress) => {
  //       if (!cancelled) {
  //         setState(prev => ({
  //           ...prev,
  //           phase: 'loading' as const,
  //           progress: { current: progress.current, total: progress.total },
  //         }));
  //       }
  //     });
  //
  //     try {
  //       const result = await loader.loadAll();
  //
  //       if (!cancelled) {
  //         for (const mod of loader.getFailedMods()) {
  //           warnings.push({
  //             id: mod.id,
  //             name: mod.name,
  //             error: mod.error,
  //           });
  //         }
  //
  //         setState({
  //           phase: 'ready',
  //           progress: { current: result.total, total: result.total },
  //           fatalError: null,
  //           warnings,
  //         });
  //       }
  //     } catch (err) {
  //       if (!cancelled) {
  //         setState({
  //           phase: 'ready',
  //           progress: { current: 0, total: 0 },
  //           fatalError: err instanceof Error ? err.message : '未知错误',
  //           warnings,
  //         });
  //       }
  //     }
  //   }
  //
  //   loadClientMods();
  //
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);

  return (
    <ModContext.Provider value={state}>
      <ModErrorBanner warnings={state.warnings} />
      {children}
    </ModContext.Provider>
  );
}
