'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import type { World } from '@/core/types';
import { useGameFlow } from '@/views/game/domainHooks/useGameFlow';
import { useGameStore } from '@/views/game/state/GameStore';
import { getRouteGuard } from '@/views/game/state/routeGuard';
import { WorldSelect } from '@/views/world-select/WorldSelect';

export default function WorldSelectPage() {
  const router = useRouter();
  const { gameState } = useGameStore();
  const { selectWorld } = useGameFlow();
  const redirectedRef = useRef(false);

  const redirectTo = getRouteGuard('/world-select', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (redirectTo) return null;

  const handleSelect = async (world: World) => {
    await selectWorld(world);
    router.push('/character-select');
  };

  return <WorldSelect worlds={gameState.worlds} onSelect={handleSelect} />;
}
