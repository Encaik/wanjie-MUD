'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { BackstoryView } from '@/views/backstory/BackstoryView';
import { useGame } from '@/views/game/useGameState';

interface CharacterInfo {
  name: string;
  gender: string;
  raceId: string;
  talentIds: string[];
  attributes: Record<string, number | string>;
  coreStats: Record<string, number>;
}

function BackstoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { gameState, startGameWithCharacter } = useGame();

  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [backstory, setBackstory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const characterSeed = searchParams.get('seed');

  useEffect(() => {
    if (!characterSeed) {
      router.replace('/world-select');
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch(`/api/v1/characters/${characterSeed}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const char = json.data.character;
          setCharacter(char);
          // 生成背景故事
          fetch('/api/v1/backstory/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: char.name,
              gender: char.gender,
              raceId: char.raceId,
              attributes: char.attributes,
              worldName: '万界',
            }),
          }).then(r => r.json()).then(r => {
            if (r.success) setBackstory(r.data.backstory);
          }).catch(() => {});
        } else {
          setError(json.error || '加载角色失败');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [characterSeed, router]);

  const handleConfirm = useCallback(async () => {
    if (!character || !gameState.selectedWorld) return;

    await startGameWithCharacter(character, gameState.selectedWorld);
    router.push('/game');
  }, [character, gameState.selectedWorld, startGameWithCharacter, router]);

  if (!characterSeed) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">加载角色数据...</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">{error || '角色数据加载失败'}</p>
        <button onClick={() => router.push('/world-select')} className="text-primary underline">
          返回世界选择
        </button>
      </div>
    );
  }

  return (
    <BackstoryView
      backstory={backstory || `万界之中，${character.name}踏上了修行之路...`}
      onConfirm={handleConfirm}
      characterName={character.name}
      worldName={gameState.selectedWorld?.name || '万界'}
      worldType={gameState.selectedWorld?.type || ''}
    />
  );
}

export default function BackstoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    }>
      <BackstoryContent />
    </Suspense>
  );
}
