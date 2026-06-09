'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { BackstoryView } from '@/views/backstory/BackstoryView';
import { useGame, getRouteGuard } from '@/views/game/useGameState';

export default function BackstoryPage() {
  const router = useRouter();
  const { gameState, confirmBackstory } = useGame();
  const redirectedRef = useRef(false);

  // 同步计算重定向目标
  const redirectTo = getRouteGuard('/backstory', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 需要重定向时不渲染页面内容
  if (redirectTo) return null;

  // protagonist 在守卫通过后一定存在
  if (!gameState.protagonist) return null;

  const handleConfirm = () => {
    confirmBackstory();
    router.push('/game');
  };

  return (
    <BackstoryView
      backstory={gameState.protagonist.backstory}
      onConfirm={handleConfirm}
      characterName={gameState.protagonist.character.name}
      worldName={gameState.protagonist.world.name}
      worldType={gameState.protagonist.world.type}
    />
  );
}
