/**
 * Hook: useCharacterTemplates
 *
 * 职责：调用后端 API 生成 8 个角色模板（确定性，相同 seed 相同结果）
 * 依赖：POST /api/v1/characters/templates
 */

import { useState, useCallback } from 'react';

/** 天赋简要信息（来自 API） */
export interface TalentInfo {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/** 种族简要信息（来自 API） */
export interface RaceInfo {
  id: string;
  name: string;
  description: string;
}

/** 角色模板（与 API 返回格式一致） */
export interface CharacterTemplate {
  index: number;
  name: string;
  gender: '男' | '女';
  raceId: string;
  talentIds: string[];
  attributes: Record<string, number | string>;
  coreStats: Record<string, number>;
  baseAttributes: Record<string, number | string>;
  /** API 补充的种族信息 */
  race?: RaceInfo;
  /** API 补充的天赋列表 */
  talents?: TalentInfo[];
}

interface UseCharacterTemplatesReturn {
  templates: CharacterTemplate[];
  loading: boolean;
  error: string | null;
  /** 调用 API 生成模板 */
  generateTemplates: (worldSeed: string, worldviewId: string) => Promise<void>;
}

export function useCharacterTemplates(): UseCharacterTemplatesReturn {
  const [templates, setTemplates] = useState<CharacterTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTemplates = useCallback(async (worldSeed: string, worldviewId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/characters/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldSeed, worldviewId }),
      });
      const json = await res.json();
      if (json.code === 200) {
        setTemplates(json.data.templates as CharacterTemplate[]);
      } else {
        setError(json.message || '生成模板失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  return { templates, loading, error, generateTemplates };
}
