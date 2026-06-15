'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useGameStore } from '@/views/game/state/GameStore';
import { getRouteGuard } from '@/views/game/state/routeGuard';

/**
 * /game 默认跳转到 /game/cultivation
 */
export default function GamePage() {
  const router = useRouter();
  const { gameState } = useGameStore();
  const redirectedRef = useRef(false);

  const redirectTo = getRouteGuard('/game', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    } else if (!redirectTo && !redirectedRef.current) {
      // 守卫通过，重定向到默认面板
      redirectedRef.current = true;
      router.replace('/game/cultivation');
    }
  }, [redirectTo, router]);

  if (redirectTo) return null;
  if (!gameState.protagonist) return null;

  // layout.tsx 提供外壳，page 重定向到 cultivation
  return null;
}
