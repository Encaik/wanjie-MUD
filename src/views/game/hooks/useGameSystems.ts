/**
 * useGameSystems — 游戏核心系统初始化 Hook
 *
 * 从 useGameState.tsx 提取，仅在实际游戏路由（/game）中按需加载。
 * 避免首页加载 @/core/engine 及其游戏事件监听器。
 */

'use client';

import { useEffect, useRef } from 'react';
import { createLogger } from '@/core/logger';

const log = createLogger('GameSystems');

/**
 * 初始化游戏核心系统（事件监听器、引擎集成等）
 *
 * 在组件挂载时动态导入 @/core/engine 并初始化，
 * 卸载时清理事件监听器防止内存泄漏。
 *
 * @example
 * // 在 MainGame 或 GameLayout 中调用
 * useGameSystems();
 */
export function useGameSystems(): void {
  const systemsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('@/core/engine')
      .then((module) => {
        if (cancelled) return;
        module.gameSystems.initialize();
        systemsRef.current = module.gameSystems;
      })
      .catch((err) => {
        log.warn('GameSystems initialization skipped:', err);
      });

    return () => {
      cancelled = true;
      if (systemsRef.current) {
        systemsRef.current.destroy();
        systemsRef.current = null;
      }
    };
  }, []);
}
