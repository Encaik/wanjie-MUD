/**
 * data/pools/quest.ts — 任务奖励池
 */

import type { RewardPool } from '../../types';

export const QUEST_TUTORIAL_POOL: RewardPool = {
  id: 'quest_tutorial',
  name: '新手任务奖励',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [50, 100], weight: 50 },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_hp', 'pill_mp'] }, weight: 30, rarityWeights: { common: 0.6, uncommon: 0.4 }, quantity: [2, 3] },
    { type: 'filter', filter: { category: 'equipment', subcategory: ['weapon_melee'] }, weight: 20, rarityWeights: { common: 0.5, uncommon: 0.5 } },
  ],
  dropCount: [2, 3],
};

export const QUEST_DAILY_POOL: RewardPool = {
  id: 'quest_daily',
  name: '日常任务奖励',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [20, 80], weight: 50 },
    { type: 'filter', filter: { category: 'material', subcategory: ['herb', 'ore'] }, weight: 25, rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.2 }, quantity: [1, 3] },
    { type: 'filter', filter: { category: 'consumable' }, weight: 15, rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.2 } },
    { type: 'pool_ref', poolId: 'common_material', weight: 10 },
  ],
  dropCount: [1, 2],
};

export const QUEST_FACTION_POOL: RewardPool = {
  id: 'quest_faction',
  name: '宗门任务奖励',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [50, 200], weight: 35 },
    { type: 'filter', filter: { category: 'technique' }, weight: 25, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
    { type: 'filter', filter: { category: 'equipment' }, weight: 20, rarityWeights: { uncommon: 0.3, rare: 0.4, epic: 0.3 } },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_cultivation', 'pill_breakthrough'] }, weight: 15, rarityWeights: { rare: 0.5, epic: 0.5 } },
    { type: 'pool_ref', poolId: 'common_material', weight: 5 },
  ],
  dropCount: [1, 2],
};

export const QUEST_POOLS: RewardPool[] = [
  QUEST_TUTORIAL_POOL,
  QUEST_DAILY_POOL,
  QUEST_FACTION_POOL,
];
