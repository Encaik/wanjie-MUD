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

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// import { ClientModLoader } from '@/core/mod/loader/client-loader';
import { ItemRegistry } from '@/core/registry/ItemRegistry';
import { invalidateTemplateCache } from '@/modules/item/data';

import { ModErrorBanner } from './ModErrorBanner';

import type { ModLoaderState } from '../types';

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
  const itemsPreloaded = useRef(false);

  // ============================================================
  // 客户端物品模板预加载
  //
  // 物品模板定义在 Mod 数据文件中（如 wanjie-core 的 cultivation.json）。
  // 由于客户端 Mod 加载已临时停用，这里做最小化的物品模板预加载，
  // 确保背包、奖励等系统能正常查询物品模板。
  // ============================================================
  useEffect(() => {
    if (itemsPreloaded.current) return;
    itemsPreloaded.current = true;

    let cancelled = false;

    /** 加载单个物品文件并注册到 ItemRegistry，返回注册数量 */
    async function loadOneItemFile(modId: string, itemPath: string): Promise<number> {
      const itemRes = await fetch(`/mods/${modId}/${itemPath}`);
      if (!itemRes.ok) return 0;
      const items = await itemRes.json();
      if (!Array.isArray(items) || items.length === 0) return 0;
      ItemRegistry.getInstance().registerAll(items);
      return items.length;
    }

    /** 加载单个 Mod 的所有物品文件，返回注册总数 */
    async function loadModItems(modId: string): Promise<number> {
      const manifestRes = await fetch(`/mods/${modId}/mod.json`);
      if (!manifestRes.ok) return 0;
      const manifest = await manifestRes.json() as {
        dataFiles?: Record<string, string | string[]>;
      };

      const itemPaths = manifest.dataFiles?.items;
      if (!itemPaths) return 0;

      const paths = Array.isArray(itemPaths) ? itemPaths : [itemPaths];
      let total = 0;

      for (const itemPath of paths) {
        if (cancelled) return total;
        total += await loadOneItemFile(modId, itemPath).catch(() => 0);
      }

      return total;
    }

    async function preloadItemTemplates() {
      try {
        const listRes = await fetch('/mods/mod-list.json');
        if (!listRes.ok || cancelled) return;
        const { mods } = await listRes.json() as { mods?: Array<{ id: string; path: string }> };
        if (!mods || !Array.isArray(mods)) return;

        let totalLoaded = 0;

        for (const mod of mods) {
          if (cancelled) return;
          totalLoaded += await loadModItems(mod.id).catch(() => 0);
        }

        if (totalLoaded > 0) {
          invalidateTemplateCache();
          console.log(`[ModInit] 预加载了 ${totalLoaded} 个物品模板`);
        }
      } catch {
        console.warn('[ModInit] 物品模板预加载失败，游戏内 Mod 物品可能不可用');
      }
    }

    preloadItemTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

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
