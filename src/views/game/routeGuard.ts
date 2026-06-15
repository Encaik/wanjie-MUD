/**
 * 路由守卫 — 同步判断当前路径是否允许访问
 *
 * 从 useGameState.tsx 提取，供首页（HomeProvider）和游戏页（GameProvider）共用。
 * 守卫不触发任何数据生成函数 — 仅检查已有数据是否存在。
 */

import type { GameState } from '@/core/types';

/**
 * 同步路由守卫：根据 gameState 和当前路径返回应重定向的目标路径
 *
 * 在各路由页面的渲染阶段同步调用，避免 useEffect 异步守卫造成的先渲染后跳转闪烁。
 *
 * @param currentPath - 当前页面路径（如 '/world-select'）
 * @param state - 当前 GameState
 * @returns 应重定向到的路径，或 null 表示允许访问当前页面
 */
export function getRouteGuard(currentPath: string, state: GameState): string | null {
  const hasWorlds = state.worlds.length > 0;
  const hasSelectedWorld = !!state.selectedWorld;
  const hasProtagonist = !!state.protagonist;
  const isPlaying = state.phase === 'playing' && hasProtagonist;

  // 已在游戏中 — 所有非游戏页面都重定向到 /game
  if (isPlaying && currentPath !== '/game') {
    return '/game';
  }

  switch (currentPath) {
    case '/':
      // 首页始终允许访问，但在游戏中时重定向
      if (isPlaying) return '/game';
      return null;

    case '/world-select':
      if (!hasWorlds) return '/';
      return null;

    case '/character-select':
      if (!hasSelectedWorld) return '/world-select';
      return null;

    case '/backstory':
      return null;

    case '/game':
      if (!hasProtagonist) {
        if (hasSelectedWorld) return '/character-select';
        if (hasWorlds) return '/world-select';
        return '/';
      }
      return null;

    default:
      return null;
  }
}
