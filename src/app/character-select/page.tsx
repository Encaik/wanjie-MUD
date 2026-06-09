'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { CharacterSelect } from '@/views/character-select/CharacterSelect';
import { useGame, getRouteGuard } from '@/views/game/useGameState';

export default function CharacterSelectPage() {
  const router = useRouter();
  const { gameState, selectCharacter, refreshCharacters } = useGame();
  const redirectedRef = useRef(false);

  // 同步计算重定向目标
  const redirectTo = getRouteGuard('/character-select', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 需要重定向时不渲染页面内容
  if (redirectTo) return null;

  const handleSelect = (character: Parameters<typeof selectCharacter>[0]) => {
    selectCharacter(character);
    router.push('/backstory');
  };

  return (
    <CharacterSelect
      characters={gameState.characters}
      onSelect={handleSelect}
      onRefresh={refreshCharacters}
      worldType={gameState.selectedWorld?.type}
      worldName={gameState.selectedWorld?.name}
      onBack={() => router.push('/world-select')}
    />
  );
}
