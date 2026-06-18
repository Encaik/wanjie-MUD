/**
 * data/pools/tower.ts — 爬塔奖励池
 */

import type { RewardPool } from '../../types';

export const TOWER_FLOOR_NORMAL_POOL: RewardPool = {
  id: 'tower_floor_normal',
  name: '爬塔普通层',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [10, 50], weight: 40 },
    { type: 'filter', filter: { category: 'material', subcategory: ['herb', 'ore', 'beast_part'] }, weight: 30, rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.2 }, quantity: [1, 3] },
    { type: 'filter', filter: { category: 'material', subcategory: ['exp_fodder'] }, weight: 20, rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.15 }, quantity: [1, 2] },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_hp', 'pill_mp'] }, weight: 10, rarityWeights: { common: 0.5, uncommon: 0.5 } },
  ],
  dropCount: [1, 2],
};

export const TOWER_FLOOR_BOSS_POOL: RewardPool = {
  id: 'tower_floor_boss',
  name: '爬塔Boss层',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [50, 300], weight: 25 },
    { type: 'filter', filter: { category: 'equipment' }, weight: 25, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 20, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 15, rarityWeights: { rare: 0.3, epic: 0.4, legendary: 0.25, mythic: 0.05 }, quantity: [2, 5] },
    { type: 'filter', filter: { category: 'material', subcategory: 'exp_fodder' }, weight: 15, rarityWeights: { uncommon: 0.2, rare: 0.4, epic: 0.3, legendary: 0.1 }, quantity: [2, 4] },
  ],
  dropCount: [2, 4],
};

export const TOWER_POOLS: RewardPool[] = [
  TOWER_FLOOR_NORMAL_POOL,
  TOWER_FLOOR_BOSS_POOL,
];
