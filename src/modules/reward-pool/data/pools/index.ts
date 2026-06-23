/**
 * modules/reward-pool/data/pools/index.ts — 池子数据桶导出
 */

import { COMBAT_POOLS } from './combat';
import { COMMON_POOLS } from './common';
import { DUNGEON_POOLS } from './dungeon';
import { FORTUNE_POOLS } from './fortune';
import { QUEST_POOLS } from './quest';
import { TOWER_POOLS } from './tower';

import type { RewardPool } from '../../types';

/** 所有内置池子 */
const ALL_BUILTIN_POOLS: RewardPool[] = [
  ...COMMON_POOLS,
  ...COMBAT_POOLS,
  ...FORTUNE_POOLS,
  ...DUNGEON_POOLS,
  ...TOWER_POOLS,
  ...QUEST_POOLS,
];

/** 获取所有内置池子 */
export function getAllPools(): RewardPool[] {
  return ALL_BUILTIN_POOLS;
}

/** 注册所有内置池子到注册中心 */
export function registerAllBuiltinPools(): void {
  // 延迟导入避免循环依赖
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerPool } = require('../../logic/poolRegistry');
  for (const pool of ALL_BUILTIN_POOLS) {
    registerPool(pool);
  }
}
