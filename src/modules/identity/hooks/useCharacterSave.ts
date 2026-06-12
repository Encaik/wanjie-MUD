/**
 * Hook: useCharacterSave
 *
 * 职责：用户选择模板并自定义后，调用后端 API 持久化角色
 * 依赖：POST /api/v1/characters/save
 */

import { useState, useCallback } from 'react';

interface SaveResult {
  characterSeed: string;
  character: {
    seed: string;
    name: string;
    gender: string;
    raceId: string;
    talentIds: string[];
    attributes: Record<string, number | string>;
    coreStats: Record<string, number>;
  };
}

interface SaveRequest {
  worldSeed: string;
  worldviewId: string;
  templateIndex: number;
  customizations?: {
    name?: string;
    gender?: '男' | '女';
    attributes?: Record<string, number | string>;
  };
}

interface UseCharacterSaveReturn {
  savedCharacter: SaveResult | null;
  loading: boolean;
  error: string | null;
  saveCharacter: (data: SaveRequest) => Promise<SaveResult | null>;
}

export function useCharacterSave(): UseCharacterSaveReturn {
  const [savedCharacter, setSavedCharacter] = useState<SaveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCharacter = useCallback(async (data: SaveRequest): Promise<SaveResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/characters/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        const result = json.data as SaveResult;
        setSavedCharacter(result);
        return result;
      } else {
        setError(json.error || '保存角色失败');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { savedCharacter, loading, error, saveCharacter };
}
