'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useGame, getRouteGuard } from '@/views/game/useGameState';
import { WorldSelect } from '@/views/world-select/WorldSelect';
import { post } from '@/shared/utils/api-client';
import type { World } from '@/core/types';

/** 世界观摘要 */
interface WorldviewOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export default function WorldSelectPage() {
  const router = useRouter();
  const { gameState, selectWorld } = useGame();
  const redirectedRef = useRef(false);

  // 世界观选择状态
  const [worldviews, setWorldviews] = useState<WorldviewOption[]>([]);
  const [selectedWorldviewId, setSelectedWorldviewId] = useState<string>('');
  const [worlds, setWorlds] = useState<World[]>(gameState.worlds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 同步计算重定向目标
  const redirectTo = getRouteGuard('/world-select', gameState);

  useEffect(() => {
    if (redirectTo && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  // 初始化：加载世界观列表
  useEffect(() => {
    if (worldviews.length > 0) return; // 已加载

    const fetchWorldviews = async () => {
      try {
        const res = await fetch('/api/v1/worldviews');
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.worldviews ?? [];
          setWorldviews(list);
        }
      } catch {
        // 静默失败，世界观选择器将不显示
      }
    };
    fetchWorldviews();
  }, [worldviews.length]);

  // 同步初始 worlds
  useEffect(() => {
    if (gameState.worlds.length > 0 && worlds.length === 0) {
      setWorlds(gameState.worlds);
    }
  }, [gameState.worlds, worlds.length]);

  /** 根据世界观重新生成世界列表 */
  const regenerateWorlds = useCallback(async (worldviewId: string) => {
    setLoading(true);
    setError(null);
    setSelectedWorldviewId(worldviewId);

    try {
      const { code, data } = await post<{ worlds: World[] }>(
        '/api/v1/worlds/generate/basic',
        { count: 8, worldviewId },
      );

      if (code === 200 && data) {
        setWorlds(data.worlds);
      } else {
        setError('世界生成失败，请重试');
      }
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 需要重定向时不渲染页面内容
  if (redirectTo) return null;

  const handleSelect = (world: World) => {
    selectWorld(world);
    router.push('/character-select');
  };

  return (
    <div>
      {/* 世界观选择器 */}
      {worldviews.length > 1 && (
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground mr-2">世界观：</span>
            <button
              onClick={() => regenerateWorlds('')}
              disabled={loading}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedWorldviewId === ''
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50'
              }`}
            >
              全部
            </button>
            {worldviews.map(wv => (
              <button
                key={wv.id}
                onClick={() => regenerateWorlds(wv.id)}
                disabled={loading}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedWorldviewId === wv.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/50'
                }`}
              >
                {wv.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-center py-2">
          <span className="text-sm text-red-500">{error}</span>
          <button
            onClick={() => regenerateWorlds(selectedWorldviewId)}
            className="ml-2 text-sm text-primary underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Loading 状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">正在生成世界...</span>
          </div>
        </div>
      )}

      {/* 世界选择列表 */}
      {!loading && (
        <WorldSelect
          worlds={worlds.length > 0 ? worlds : gameState.worlds}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
