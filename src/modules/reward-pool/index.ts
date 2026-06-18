/**
 * modules/reward-pool/index.ts — 奖励池模块公共 API
 *
 * 统一奖励出口：所有游戏模块通过 poolId + RollContext 获取奖励。
 */

// 类型
export type {
  ItemFilter,
  EntryCondition,
  StaticEntry,
  FilterEntry,
  PoolRefEntry,
  PoolEntry,
  RewardPool,
  RollContext,
  RollResultItem,
  RollResult,
  ResolvedEntry,
} from './types';

// 事件
export { emitRewardEvent, registerRewardMessageTemplates, REWARD_EVENT_TYPE } from './events';
export type { RewardGeneratedPayload } from './events';

// 逻辑
export { rollPool, resolvePool, formatSummary } from './logic/poolEngine';
export { registerPool, getPool, getAllPoolIds, invalidateCache, clearAllPools } from './logic/poolRegistry';
export { applyFilter, filterCacheKey } from './logic/itemFilter';
export { rollRarity, getMaxRarityByLevel, clampWeightsByRarity } from './logic/rarityRoller';

// 数据
export { getAllPools, registerAllBuiltinPools } from './data/pools';
export { DIFFICULTY_CONFIG, getDifficultyMultiplier, getMaxRarityForLevel } from './data/difficultyConfig';
