/**
 * WorldPoolEngine — 世界混合池引擎
 *
 * 纯函数逻辑，从已评分高分世界和随机新世界中按可配置比例混合产出最终世界选择列表。
 * 不依赖 React 或浏览器 API（评级数据和 provider 作为参数传入）。
 *
 * @module core/world
 */

import { parseWorldId } from './identity';
import { DEFAULT_WORLD_POOL_CONFIG } from './types';

import type { WorldProvider, WorldPoolEntry, WorldPoolConfig, WorldRatingsMap } from './types';

/**
 * 按评分排序并截取
 */
function selectTopRated(
  ratings: WorldRatingsMap,
  threshold: number,
  limit: number,
): Array<{ worldId: string; average: number; count: number }> {
  return Object.entries(ratings)
    .map(([worldId, r]) => ({
      worldId,
      average: r.totalScore / r.ratingCount,
      count: r.ratingCount,
    }))
    .filter(r => r.average >= threshold)
    .sort((a, b) => b.average - a.average)
    .slice(0, limit);
}

/**
 * 构建混合世界池（纯函数）
 *
 * @param providers - 所有已注册的 WorldProvider
 * @param ratings - 评分存储
 * @param config - 池配置（可选）
 * @param ascensionCount - 飞升次数（影响难度系数）
 * @returns 混合后的世界池条目列表
 */
export function buildWorldPool(
  providers: WorldProvider[],
  ratings: WorldRatingsMap,
  config: WorldPoolConfig = DEFAULT_WORLD_POOL_CONFIG,
  ascensionCount = 0,
): WorldPoolEntry[] {
  // 建立 provider 索引
  const providerMap = new Map<string, WorldProvider>();
  for (const p of providers) {
    providerMap.set(p.id, p);
  }

  if (providers.length === 0) return [];

  // 计算配额
  const ratedQuota = Math.round(config.poolSize * config.sourceRatio.rated);
  const randomQuota = config.poolSize - ratedQuota;

  const usedIds = new Set<string>();
  const entries: WorldPoolEntry[] = [];

  // 选取已评分高分世界（重新从 seed 生成）
  const topRated = selectTopRated(ratings, config.highScoreThreshold, ratedQuota);

  for (const { worldId, average, count } of topRated) {
    let parts;
    try {
      parts = parseWorldId(worldId);
    } catch {
      continue; // 跳过无法解析的 ID
    }

    const provider = providerMap.get(parts.providerId);
    if (!provider) continue;

    // 用解析出的 seed 重新生成同一个世界
    const world = provider.generateWorld(parts.seed, ascensionCount);
    if (usedIds.has(world.id)) continue;
    usedIds.add(world.id);

    entries.push({
      world,
      source: 'rated',
      rating: { average, count },
    });
  }

  // 随机新世界
  let randomGenCount = 0;
  const maxAttempts = randomQuota * 5;
  for (let i = 0; i < maxAttempts && randomGenCount < randomQuota; i++) {
    const provider = providers[i % providers.length];
    const seed = `pool-r-${randomGenCount}-${Date.now()}`;
    const world = provider.generateWorld(seed, ascensionCount);
    if (usedIds.has(world.id)) continue;
    usedIds.add(world.id);
    entries.push({ world, source: 'random' });
    randomGenCount++;
  }

  // 补足到 poolSize
  let fillCount = entries.length;
  const fillMaxAttempts = (config.poolSize - fillCount) * 5;
  for (let i = 0; i < fillMaxAttempts && fillCount < config.poolSize; i++) {
    const provider = providers[i % providers.length];
    const seed = `pool-f-${fillCount}-${Date.now()}`;
    const world = provider.generateWorld(seed, ascensionCount);
    if (usedIds.has(world.id)) continue;
    usedIds.add(world.id);
    entries.push({ world, source: 'random' });
    fillCount++;
  }

  return entries.slice(0, config.poolSize);
}
