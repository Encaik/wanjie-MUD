/**
 * data/pools/common.ts — 通用奖励池定义
 *
 * 所有世界观共享的基础池子：货币、材料、消耗品。
 * 使用 FilterEntry 动态查询 ItemRegistry，Mod 物品自动命中。
 */

import type { RewardPool } from '../../types';

/** 通用货币池 — 灵石掉落 */
export const COMMON_CURRENCY_POOL: RewardPool = {
  id: 'common_currency',
  name: '通用货币',
  description: '灵石和基础货币掉落',
  entries: [
    {
      type: 'currency',
      currencyType: '灵石',
      amount: [10, 50],
      weight: 70,
    },
    {
      type: 'currency',
      currencyType: '灵石',
      amount: [50, 200],
      weight: 25,
      conditions: [{ type: 'playerLevelMin', value: 10 }],
    },
    {
      type: 'currency',
      currencyType: '灵石',
      amount: [200, 500],
      weight: 5,
      conditions: [{ type: 'playerLevelMin', value: 30 }],
    },
  ],
  dropCount: [1, 2],
};

/** 通用材料池 — 草药、矿石、妖兽材料 */
export const COMMON_MATERIAL_POOL: RewardPool = {
  id: 'common_material',
  name: '通用材料',
  description: '草药、矿石、妖兽材料等',
  entries: [
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['herb', 'ore', 'beast_part'] },
      weight: 70,
      rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
      quantity: [1, 3],
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['gem', 'special'] },
      weight: 20,
      rarityWeights: { uncommon: 0.5, rare: 0.3, epic: 0.2 },
      conditions: [{ type: 'playerLevelMin', value: 15 }],
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: 'exp_fodder' },
      weight: 10,
      rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.15 },
    },
  ],
  dropCount: [1, 2],
};

/** 通用消耗品池 — 丹药 */
export const COMMON_CONSUMABLE_POOL: RewardPool = {
  id: 'common_consumable',
  name: '通用消耗品',
  description: '回复丹药和辅助消耗品',
  entries: [
    {
      type: 'filter',
      filter: { category: 'consumable', subcategory: ['pill_hp', 'pill_mp'] },
      weight: 60,
      rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
      quantity: [1, 2],
    },
    {
      type: 'filter',
      filter: { category: 'consumable', subcategory: 'pill_cultivation' },
      weight: 25,
      rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 },
      conditions: [{ type: 'playerLevelMin', value: 10 }],
    },
    {
      type: 'filter',
      filter: { category: 'consumable', subcategory: ['pill_breakthrough', 'pill_stat'] },
      weight: 15,
      rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 },
      conditions: [{ type: 'playerLevelMin', value: 20 }],
    },
  ],
  dropCount: [1, 1],
};

/** 所有通用池子 */
export const COMMON_POOLS: RewardPool[] = [
  COMMON_CURRENCY_POOL,
  COMMON_MATERIAL_POOL,
  COMMON_CONSUMABLE_POOL,
];
