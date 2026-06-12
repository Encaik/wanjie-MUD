'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { CharacterSelect } from '@/views/character-select/CharacterSelect';
import { useGame, getRouteGuard } from '@/views/game/useGameState';
import { useCharacterTemplates, useCharacterSave } from '@/modules/identity/hooks';

export default function CharacterSelectPage() {
  const router = useRouter();
  const { gameState } = useGame();
  const redirectedRef = useRef(false);
  const loadedRef = useRef(false);

  const { templates, loading, error, generateTemplates } = useCharacterTemplates();
  const { saveCharacter } = useCharacterSave();

  // 路由守卫
  const redirectTo = getRouteGuard('/character-select', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 加载角色模板（后端 API，确定性的）
  useEffect(() => {
    if (redirectTo || loadedRef.current) return;
    const world = gameState.selectedWorld;
    if (world?.id && world?.worldviewId) {
      loadedRef.current = true;
      generateTemplates(world.id, world.worldviewId);
    }
  }, [redirectTo, gameState.selectedWorld, generateTemplates]);

  if (redirectTo) return null;

  const handleSelect = async (index: number) => {
    const world = gameState.selectedWorld;
    if (!world) return;

    const template = templates[index];
    if (!template) return;

    // 保存角色到后端
    const result = await saveCharacter({
      worldSeed: world.id,
      worldviewId: world.worldviewId,
      templateIndex: index,
    });

    if (result) {
      router.push(`/backstory?seed=${result.characterSeed}`);
    }
  };

  return (
    <CharacterSelect
      characters={templates}
      loading={loading}
      error={error}
      worldType={gameState.selectedWorld?.type}
      worldName={gameState.selectedWorld?.name}
      visualConfig={gameState.selectedWorld?.visualConfig}
      attributeDefinitions={gameState.selectedWorld?.attributeDefinitions}
      attributeCount={gameState.selectedWorld?.attributeDefinitions?.length ?? 0}
      onSelect={handleSelect}
      onBack={() => router.push('/world-select')}
    />
  );
}
