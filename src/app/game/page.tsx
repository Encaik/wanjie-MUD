'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useGameStore } from '@/views/game/state/GameStore';
import { getRouteGuard } from '@/views/game/state/routeGuard';
import { GameLayout } from '@/views/game/GameLayout';

export default function GamePage() {
  const router = useRouter();
  const { gameState } = useGameStore();
  const redirectedRef = useRef(false);

  const redirectTo = getRouteGuard('/game', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (redirectTo) return null;
  if (!gameState.protagonist) return null;

  return <GameLayout />;
}
