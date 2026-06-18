/**
 * data/pools/combat.ts — 战斗掉落池
 *
 * 按敌人等级（tier）分层的战斗奖励池。
 * 稀有度权重随 tier 递增：normal → elite → miniboss → boss。
 */

import type { RewardPool } from '../../types';

/** 普通敌人掉落 */
export const COMBAT_NORMAL_POOL: RewardPool = {
  id: 'combat_normal',
  name: '普通敌人掉落',
  description: '普通敌人的基础掉落',
  entries: [
    {
      type: 'static',
      templateId: 'wanjie:common:spirit_stone',
      quantity: [5, 25],
      weight: 50,
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['herb', 'ore', 'beast_part'] },
      weight: 30,
      rarityWeights: { common: 0.8, uncommon: 0.2 },
      quantity: [1, 2],
    },
    {
      type: 'filter',
      filter: { category: 'consumable', subcategory: ['pill_hp', 'pill_mp'] },
      weight: 15,
      rarityWeights: { common: 0.8, uncommon: 0.2 },
    },
    {
      type: 'pool_ref',
      poolId: 'common_currency',
      weight: 5,
      conditions: [{ type: 'playerLevelMin', value: 10 }],
    },
  ],
  dropCount: [0, 1],
  difficultyMultiplier: { normal: 1.0, hard: 1.2, nightmare: 1.5 },
};

/** 精英敌人掉落 */
export const COMBAT_ELITE_POOL: RewardPool = {
  id: 'combat_elite',
  name: '精英敌人掉落',
  description: '精英敌人的优质掉落',
  entries: [
    {
      type: 'static',
      templateId: 'wanjie:common:spirit_stone',
      quantity: [20, 80],
      weight: 40,
    },
    {
      type: 'filter',
      filter: { category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged', 'armor_head', 'armor_body'] },
      weight: 25,
      rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.15 },
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['ore', 'gem', 'beast_part'] },
      weight: 20,
      rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 },
      quantity: [1, 2],
    },
    {
      type: 'pool_ref',
      poolId: 'common_consumable',
      weight: 10,
    },
    {
      type: 'filter',
      filter: { category: 'technique' },
      weight: 5,
      rarityWeights: { rare: 0.6, epic: 0.3, legendary: 0.1 },
      conditions: [{ type: 'playerLevelMin', value: 15 }],
    },
  ],
  dropCount: [1, 2],
  difficultyMultiplier: { normal: 1.0, hard: 1.5, nightmare: 2.0 },
};

/** 小头目掉落 */
export const COMBAT_MINIBOSS_POOL: RewardPool = {
  id: 'combat_miniboss',
  name: '小头目掉落',
  description: '小头目的稀有掉落',
  entries: [
    {
      type: 'static',
      templateId: 'wanjie:common:spirit_stone',
      quantity: [50, 200],
      weight: 35,
    },
    {
      type: 'filter',
      filter: { category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged', 'armor_head', 'armor_body', 'armor_legs'] },
      weight: 25,
      rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 },
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['gem', 'special'] },
      weight: 15,
      rarityWeights: { rare: 0.5, epic: 0.35, legendary: 0.15 },
      quantity: [1, 3],
    },
    {
      type: 'filter',
      filter: { category: 'technique' },
      weight: 15,
      rarityWeights: { rare: 0.5, epic: 0.3, legendary: 0.2 },
    },
    {
      type: 'pool_ref',
      poolId: 'common_consumable',
      weight: 10,
    },
  ],
  dropCount: [2, 3],
  difficultyMultiplier: { normal: 1.0, hard: 1.5, nightmare: 2.5 },
};

/** Boss 掉落 */
export const COMBAT_BOSS_POOL: RewardPool = {
  id: 'combat_boss',
  name: 'Boss 掉落',
  description: 'Boss 的丰厚掉落，保底稀有+',
  entries: [
    {
      type: 'static',
      templateId: 'wanjie:common:spirit_stone',
      quantity: [200, 1000],
      weight: 30,
    },
    {
      type: 'filter',
      filter: { category: 'equipment' },
      weight: 25,
      rarityWeights: { rare: 0.3, epic: 0.4, legendary: 0.25, mythic: 0.05 },
    },
    {
      type: 'filter',
      filter: { category: 'technique' },
      weight: 15,
      rarityWeights: { epic: 0.4, legendary: 0.4, mythic: 0.2 },
    },
    {
      type: 'filter',
      filter: { category: 'skill' },
      weight: 10,
      rarityWeights: { epic: 0.4, legendary: 0.4, mythic: 0.2 },
    },
    {
      type: 'filter',
      filter: { category: 'material', subcategory: ['gem', 'special', 'exp_fodder'] },
      weight: 15,
      rarityWeights: { epic: 0.5, legendary: 0.35, mythic: 0.15 },
      quantity: [2, 5],
    },
    {
      type: 'pool_ref',
      poolId: 'common_consumable',
      weight: 5,
    },
  ],
  dropCount: [3, 5],
  difficultyMultiplier: { normal: 1.0, hard: 2.0, nightmare: 3.0 },
};

/** 所有战斗池子 */
export const COMBAT_POOLS: RewardPool[] = [
  COMBAT_NORMAL_POOL,
  COMBAT_ELITE_POOL,
  COMBAT_MINIBOSS_POOL,
  COMBAT_BOSS_POOL,
];
