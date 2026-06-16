/**
 * useGameFlow — 游戏流程阶段转换 Hook
 *
 * 管理 startNewGame / selectWorld / startGameWithCharacter / confirmBackstory 等流程
 */

'use client';

import { useCallback, useRef } from 'react';
import type { World } from '@/core/types';
import { useGameStore, useGameDispatch } from '../state/GameStore';
import { createInitialGameState } from '../state/initialState';
import { post } from '@/shared/utils/api-client';
import { createLogger } from '@/core/logger';
import { emit } from '@/core/events';
import { worldEvents } from '@/modules/theme';
import { getTemplate } from '@/modules/item/data';

const log = createLogger('GameFlow');

export function useGameFlow() {
  const { gameState } = useGameStore();
  const dispatch = useGameDispatch();
  const worldviewCacheRef = useRef<Array<{ id: string; name: string; description: string }> | null>(null);

  const fetchWorldviews = useCallback(async () => {
    if (worldviewCacheRef.current) return worldviewCacheRef.current;
    try {
      const res = await fetch('/api/v1/worldviews');
      if (res.ok) {
        const json = await res.json();
        worldviewCacheRef.current = json.data?.worldviews ?? [];
        return worldviewCacheRef.current!;
      }
    } catch { /* ignore */ }
    return [] as Array<{ id: string; name: string; description: string }>;
  }, []);

  const startNewGame = useCallback(async (worldviewId?: string) => {
    // 清除旧世界的主题（CSS 变量、localStorage 缓存、data-world 属性）
    emit(worldEvents.events.new_game_started, {});
    dispatch(() => ({ ...createInitialGameState(), phase: 'world-select', worlds: [] }));
    const body: Record<string, unknown> = { count: 8 };
    if (worldviewId) body.worldviewId = worldviewId;
    const { code, data } = await post<{ worlds: World[] }>('/api/v1/worlds/generate/basic', body);
    if (code === 200 && data) {
      dispatch(prev => ({ ...prev, worlds: data.worlds }));
    }
  }, [dispatch]);

  const selectWorld = useCallback(async (world: World) => {
    let fullWorld = world;
    if (world.dangers.length === 0 && world.factions.length === 0) {
      const { code, data } = await post<{ world: World }>('/api/v1/worlds/generate/details', { seed: world.id, worldviewId: world.worldviewId });
      if (code === 200 && data) fullWorld = data.world;
    }
    dispatch(prev => ({ ...prev, selectedWorld: fullWorld, phase: 'character-select' }));
  }, [dispatch]);

  const startGameWithCharacter = useCallback(async (
    characterData: { name: string; gender: string; raceId: string; attributes: Record<string, number | string>; coreStats: Record<string, number>; talentIds: string[] },
    world: World,
  ) => {
    const { createProtagonistFromSaved } = await import('@/modules/identity/logic/protagonistAdapter');
    const protagonist = createProtagonistFromSaved(
      { seed: '', worldSeed: world.id, worldviewId: world.worldviewId, name: characterData.name, gender: characterData.gender, raceId: characterData.raceId, talentIds: characterData.talentIds, attributes: characterData.attributes, coreStats: characterData.coreStats, npcTemplateVersion: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      world,
    );
    dispatch(prev => ({ ...prev, protagonist, phase: 'playing' }));
  }, [dispatch]);

  const confirmBackstory = useCallback(() => {
    let worldId: string | undefined;
    let worldType: string | undefined;

    dispatch(prev => {
      if (!prev.protagonist) return prev;
      worldId = prev.protagonist.world.worldviewId;
      worldType = prev.protagonist.world.type;

      const now = Date.now();
      const makeId = () => `msg_${now}_${Math.random().toString(36).substr(2, 9)}`;

      // 游戏开始消息
      const welcomeMsg = { id: makeId(), timestamp: now, type: 'success' as const, title: '游戏开始', content: '欢迎来到修仙世界！', details: undefined, rewards: undefined };

      // 初始物品获得消息
      const items = prev.protagonist.items ?? [];
      const itemNames = items.map(i => {
        try { return `${getTemplate(i.templateId).name} x${i.quantity}`; }
        catch { return `${i.templateId} x${i.quantity}`; }
      }).join('、');
      const itemMsgs = items.length > 0
        ? [{ id: makeId(), timestamp: now, type: 'info' as const, title: '初始物品', content: `获得初始物品：${itemNames}`, details: undefined, rewards: undefined }]
        : [];

      return { ...prev, phase: 'playing', messages: [...itemMsgs, welcomeMsg, ...prev.messages].slice(0, 100) };
    });

    if (worldId || worldType) {
      emit(worldEvents.events.world_changed, { worldviewId: worldId, worldType: worldType });
    }
  }, [dispatch]);

  return { startNewGame, selectWorld, startGameWithCharacter, confirmBackstory, fetchWorldviews };
}
