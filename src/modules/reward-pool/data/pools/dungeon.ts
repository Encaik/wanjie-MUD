/**
 * data/pools/dungeon.ts — 地牢事件奖励池
 */

import type { RewardPool } from '../../types';

export const DUNGEON_TREASURE_POOL: RewardPool = {
  id: 'dungeon_treasure',
  name: '地牢宝箱',
  entries: [
    { type: 'currency', currencyType: '灵石', amount: [10, 100], weight: 40 },
    { type: 'filter', filter: { category: 'equipment' }, weight: 30, rarityWeights: { common: 0.3, uncommon: 0.35, rare: 0.25, epic: 0.1 } },
    { type: 'filter', filter: { category: 'consumable' }, weight: 20, rarityWeights: { common: 0.3, uncommon: 0.4, rare: 0.3 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 10, rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 } },
  ],
  dropCount: [1, 2],
};

export const DUNGEON_SHRINE_POOL: RewardPool = {
  id: 'dungeon_shrine',
  name: '地牢祭坛',
  entries: [
    { type: 'filter', filter: { category: 'technique' }, weight: 40, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
    { type: 'filter', filter: { category: 'skill' }, weight: 30, rarityWeights: { rare: 0.4, epic: 0.35, legendary: 0.25 } },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_breakthrough', 'pill_stat'] }, weight: 20, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
    { type: 'currency', currencyType: '灵石', amount: [50, 200], weight: 10 },
  ],
  dropCount: [1, 2],
};

export const DUNGEON_HIDDEN_ROOM_POOL: RewardPool = {
  id: 'dungeon_hidden_room',
  name: '地牢隐藏房间',
  entries: [
    { type: 'filter', filter: { category: 'equipment' }, weight: 35, rarityWeights: { rare: 0.3, epic: 0.4, legendary: 0.25, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 25, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.25 }, quantity: [2, 4] },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_breakthrough'] }, weight: 20, rarityWeights: { epic: 0.5, legendary: 0.5 } },
    { type: 'currency', currencyType: '灵石', amount: [100, 500], weight: 20 },
  ],
  dropCount: [2, 4],
};

export const DUNGEON_ELITE_GUARDIAN_POOL: RewardPool = {
  id: 'dungeon_elite_guardian',
  name: '地牢精英守卫',
  entries: [
    { type: 'filter', filter: { category: 'equipment' }, weight: 30, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 25, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['special'] }, weight: 20, rarityWeights: { epic: 0.5, legendary: 0.35, mythic: 0.15 }, quantity: [2, 5] },
    { type: 'currency', currencyType: '灵石', amount: [50, 200], weight: 25 },
  ],
  dropCount: [2, 3],
};

export const DUNGEON_POOLS: RewardPool[] = [
  DUNGEON_TREASURE_POOL,
  DUNGEON_SHRINE_POOL,
  DUNGEON_HIDDEN_ROOM_POOL,
  DUNGEON_ELITE_GUARDIAN_POOL,
];
