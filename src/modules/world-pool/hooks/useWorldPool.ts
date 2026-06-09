/**
 * Hook: useWorldPool
 *
 * 封装 WorldPoolEngine 调用，从 WorldProviderRegistry 获取 providers，
 * 从 localStorage 获取评分数据，产出最终的混合世界列表。
 *
 * @module modules/world-pool/hooks
 */

import { useMemo } from 'react';
import { WorldProviderRegistry } from '@/shared/lib/world/WorldProviderRegistry';
import { buildWorldPool } from '@/shared/lib/world/WorldPoolEngine';
import type { WorldPoolEntry, WorldPoolConfig, WorldRatingsMap } from '@/shared/lib/world/types';
import { DEFAULT_WORLD_POOL_CONFIG } from '@/shared/lib/world/types';

export interface UseWorldPoolOptions {
  /** 池配置（可选，默认 DEFAULT_WORLD_POOL_CONFIG） */
  config?: WorldPoolConfig;
  /** 飞升次数 */
  ascensionCount?: number;
}

export interface UseWorldPoolReturn {
  /** 混合世界池条目列表 */
  entries: WorldPoolEntry[];
  /** 池中世界总数 */
  total: number;
}

/**
 * 世界混合池 Hook
 *
 * 每次调用时从注册中心和评分数据重新计算混合池。适合在视图层使用。
 */
export function useWorldPool(options: UseWorldPoolOptions = {}): UseWorldPoolReturn {
  const { config = DEFAULT_WORLD_POOL_CONFIG, ascensionCount = 0 } = options;

  const entries = useMemo(() => {
    const providers = WorldProviderRegistry.getInstance().getAll();
    // 直接从 localStorage 读取评分数据并转换为 WorldRatingsMap
    let ratings: WorldRatingsMap = {};
    try {
      const raw = localStorage.getItem('world-ratings');
      if (raw) ratings = JSON.parse(raw) as WorldRatingsMap;
    } catch { /* 忽略解析错误 */ }
    return buildWorldPool(providers, ratings, config, ascensionCount);
  }, [config, ascensionCount]);

  return { entries, total: entries.length };
}
