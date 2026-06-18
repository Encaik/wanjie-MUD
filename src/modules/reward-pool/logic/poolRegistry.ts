/**
 * logic/poolRegistry.ts — 池子注册中心
 *
 * 管理所有奖励池的注册、查询和合并。
 * Mod 同名池子条目追加（不覆盖），配置参数以最后注册为准。
 */

import type { RewardPool, StaticEntry } from '../types';
import { createLogger } from '@/core/logger';

const logger = createLogger('reward-pool.registry');

// ============================================
// 内部状态
// ============================================

/** 已注册池子映射 */
const poolMap = new Map<string, RewardPool>();

/** FilterEntry 过滤结果缓存（key: filterCacheKey → value: templateId[]） */
const filterCache = new Map<string, string[]>();

// ============================================
// 注册
// ============================================

/**
 * 注册/合并池子
 *
 * - 新池子：直接存入
 * - 同名池子：Mod 条目追加到已有条目，配置参数以新注册为准
 * - StaticEntry 去重：同 templateId 重复注册时 warn
 *
 * @param pool - 待注册的池子
 */
export function registerPool(pool: RewardPool): void {
  const existing = poolMap.get(pool.id);

  if (existing) {
    // ─── 合并模式 ───
    logger.info(`合并池子: "${pool.id}"（追加 ${pool.entries.length} 条条目）`);

    // 去重检查：同 templateId 的 static 条目
    const existingStaticIds = new Set(
      existing.entries
        .filter((e): e is StaticEntry => e.type === 'static')
        .map(e => e.templateId)
    );

    for (const entry of pool.entries) {
      if (entry.type === 'static') {
        if (existingStaticIds.has(entry.templateId)) {
          logger.warn(
            `池子 "${pool.id}" 中 static 条目 "${entry.templateId}" 重复，跳过`
          );
          continue;
        }
        existingStaticIds.add(entry.templateId);
      }
      existing.entries.push(entry);
    }

    // 配置参数覆写
    if (pool.dropCount) existing.dropCount = pool.dropCount;
    if (pool.defaultRarityWeights) existing.defaultRarityWeights = pool.defaultRarityWeights;
    if (pool.worldView !== undefined) existing.worldView = pool.worldView;
    if (pool.difficultyMultiplier) existing.difficultyMultiplier = pool.difficultyMultiplier;
    if (pool.name) existing.name = pool.name;
    if (pool.description) existing.description = pool.description;
  } else {
    // ─── 新增模式 ───
    // 验证 pool_ref 引用的池子存在性（宽松检查：允许后续注册）
    for (const entry of pool.entries) {
      if (entry.type === 'pool_ref' && !poolMap.has(entry.poolId)) {
        logger.warn(
          `池子 "${pool.id}" 引用了尚未注册的池子 "${entry.poolId}"（将在后续检查）`
        );
      }
    }

    poolMap.set(pool.id, { ...pool, entries: [...pool.entries] });
    logger.info(`注册池子: "${pool.id}"（${pool.entries.length} 条条目）`);
  }
}

// ============================================
// 查询
// ============================================

/**
 * 查询池子
 *
 * @param id - 池子 ID
 * @returns 池子定义，不存在则 undefined
 */
export function getPool(id: string): RewardPool | undefined {
  return poolMap.get(id);
}

/**
 * 获取所有已注册池子 ID
 */
export function getAllPoolIds(): string[] {
  return Array.from(poolMap.keys());
}

// ============================================
// 缓存管理
// ============================================

/**
 * 获取 FilterEntry 的缓存过滤结果
 *
 * @param cacheKey - filterCacheKey() 生成的 key
 * @returns 缓存的 templateId 数组，未命中则 undefined
 */
export function getFilterCache(cacheKey: string): string[] | undefined {
  return filterCache.get(cacheKey);
}

/**
 * 设置 FilterEntry 的缓存过滤结果
 */
export function setFilterCache(cacheKey: string, templateIds: string[]): void {
  filterCache.set(cacheKey, templateIds);
}

/**
 * 清除 FilterEntry 缓存
 *
 * 在 Mod 加载完成后调用，使 FilterEntry 能命中新注册的 Mod 物品。
 */
export function invalidateCache(): void {
  filterCache.clear();
  logger.info('FilterEntry 缓存已清除');
}

/**
 * 清除所有池子（仅测试用）
 */
export function clearAllPools(): void {
  poolMap.clear();
  filterCache.clear();
}
