'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { useGame, getRouteGuard } from '@/views/game/useGameState';
import { WorldSelect } from '@/views/world-select/WorldSelect';

export default function WorldSelectPage() {
  const router = useRouter();
  const { gameState, selectWorld } = useGame();
  const redirectedRef = useRef(false);

  // 同步计算重定向目标
  const redirectTo = getRouteGuard('/world-select', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 需要重定向时不渲染页面内容
  if (redirectTo) return null;

  const handleSelect = (world: Parameters<typeof selectWorld>[0]) => {
    selectWorld(world);
    router.push('/character-select');
  };

  return (
    <WorldSelect
      worlds={gameState.worlds}
      onSelect={handleSelect}
    />
  );
}
