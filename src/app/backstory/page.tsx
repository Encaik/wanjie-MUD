'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import type { World } from '@/core/types';
import { post } from '@/shared/utils/api-client';
import { BackstoryView } from '@/views/backstory/BackstoryView';
import { useGameStore } from '@/views/game/GameStore';
import { useGameFlow } from '@/views/game/domainHooks/useGameFlow';

interface CharacterInfo {
  name: string;
  gender: string;
  raceId: string;
  talentIds: string[];
  attributes: Record<string, number | string>;
  coreStats: Record<string, number>;
  worldSeed: string;
  worldviewId: string;
}

/**
 * 加载角色数据、背景故事、以及关联的世界数据。
 * 不依赖 gameState — 完全通过 API 自给自足。
 */
function useCharacterData(characterSeed: string | null) {
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [backstory, setBackstory] = useState<string>('');
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

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
        if (json.code !== 200) {
          setError(json.message || '加载角色失败');
          return;
        }
        const char: CharacterInfo = json.data.character;
        setCharacter(char);

        // 并行：生成背景故事 + 获取世界数据
        const backstoryPromise = fetch('/api/v1/backstory/generate', {
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
          if (r.code === 200) setBackstory(r.data.backstory);
        });

        const worldPromise = post<{ world: World }>(
          '/api/v1/worlds/generate/details',
          { seed: char.worldSeed, worldviewId: char.worldviewId },
        ).then(({ code, data }) => {
          if (code === 200 && data) setWorld(data.world);
        });

        return Promise.all([backstoryPromise, worldPromise]);
      })
      .then(() => setLoading(false))
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [characterSeed, router]);

  return { character, backstory, world, loading, error, setError };
}

// eslint-disable-next-line complexity -- 数据加载已提取到 useCharacterData，剩余分支为必要 UI 状态处理
function BackstoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { gameState } = useGameStore();
  const { startGameWithCharacter } = useGameFlow();

  const characterSeed = searchParams.get('seed');

  const { character, backstory, world: apiWorld, loading, error, setError } = useCharacterData(characterSeed);

  const handleConfirm = useCallback(async () => {
    const world = apiWorld ?? null;
    if (!character || !world) {
      console.error('[Backstory] 缺少角色或世界数据', {
        character: !!character,
        world: !!world,
      });
      return;
    }

    try {
      console.log('[Backstory] 开始启动游戏...', { name: character.name, world: world.name });
      await startGameWithCharacter(character, world);
      console.log('[Backstory] startGameWithCharacter 完成，准备跳转 /game');
      router.push('/game');
    } catch (err) {
      console.error('[Backstory] 启动游戏失败:', err);
      setError(`启动游戏失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [character, apiWorld, startGameWithCharacter, router, setError]);

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

  // 展示用：优先 API 返回的世界，回退到 gameState
  const displayWorld = apiWorld || gameState.selectedWorld;
  const displayWorldName = displayWorld?.name || '万界';
  const displayWorldType = displayWorld?.type || '';
  const displayVisualConfig = displayWorld?.visualConfig;
  const displayStatNames = displayWorld?.statDisplayNames;

  return (
    <BackstoryView
      backstory={backstory || `万界之中，${character.name}踏上了修行之路...`}
      onConfirm={handleConfirm}
      characterName={character.name}
      worldName={displayWorldName}
      worldType={displayWorldType}
      statDisplayNames={displayStatNames}
      visualConfig={displayVisualConfig}
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
