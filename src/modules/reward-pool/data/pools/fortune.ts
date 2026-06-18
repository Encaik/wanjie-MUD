/**
 * data/pools/fortune.ts — 机缘奖励池
 *
 * 5 主题机缘 + 5 专项机缘的节点奖励池。
 * 每个机缘类型 × 节点分类 = 对应 poolId。
 */

import type { RewardPool } from '../../types';

// ============================================
// 主题机缘池（5 主题 × 3 节点分类）
// ============================================

/** 灵矿脉 — 战斗节点 */
export const FORTUNE_SPIRIT_VEIN_COMBAT: RewardPool = {
  id: 'fortune_spirit_vein_combat',
  name: '灵矿脉战斗掉落',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [20, 80], weight: 55 },
    { type: 'filter', filter: { category: 'material', subcategory: ['ore', 'gem'] }, weight: 30, rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.15 }, quantity: [1, 2] },
    { type: 'filter', filter: { category: 'equipment' }, weight: 15, rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 } },
  ],
  dropCount: [1, 2],
};

/** 灵矿脉 — 资源节点 */
export const FORTUNE_SPIRIT_VEIN_RESOURCE: RewardPool = {
  id: 'fortune_spirit_vein_resource',
  name: '灵矿脉资源采集',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [30, 150], weight: 70 },
    { type: 'filter', filter: { category: 'material', subcategory: ['ore', 'gem', 'special'] }, weight: 25, rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 }, quantity: [1, 3] },
    { type: 'pool_ref', poolId: 'common_consumable', weight: 5 },
  ],
  dropCount: [1, 2],
};

/** 古战场 — 战斗节点 */
export const FORTUNE_BATTLEFIELD_COMBAT: RewardPool = {
  id: 'fortune_battlefield_combat',
  name: '古战场战斗掉落',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [15, 60], weight: 35 },
    { type: 'filter', filter: { category: 'equipment' }, weight: 30, rarityWeights: { common: 0.4, uncommon: 0.35, rare: 0.25 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 20, rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['beast_part', 'special'] }, weight: 15, rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 } },
  ],
  dropCount: [1, 3],
};

/** 古战场 — 资源节点 */
export const FORTUNE_BATTLEFIELD_RESOURCE: RewardPool = {
  id: 'fortune_battlefield_resource',
  name: '古战场资源探索',
  entries: [
    { type: 'filter', filter: { category: 'equipment' }, weight: 40, rarityWeights: { uncommon: 0.4, rare: 0.35, epic: 0.2, legendary: 0.05 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 35, rarityWeights: { uncommon: 0.4, rare: 0.35, epic: 0.2, legendary: 0.05 } },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [10, 50], weight: 25 },
  ],
  dropCount: [1, 2],
};

/** 药谷 — 战斗节点 */
export const FORTUNE_HERB_VALLEY_COMBAT: RewardPool = {
  id: 'fortune_herb_valley_combat',
  name: '药谷战斗掉落',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [10, 40], weight: 35 },
    { type: 'filter', filter: { category: 'consumable', subcategory: ['pill_hp', 'pill_mp'] }, weight: 35, rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.15 }, quantity: [1, 2] },
    { type: 'filter', filter: { category: 'material', subcategory: 'herb' }, weight: 25, rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.2 }, quantity: [1, 3] },
    { type: 'pool_ref', poolId: 'common_material', weight: 5 },
  ],
  dropCount: [1, 2],
};

/** 药谷 — 资源节点 */
export const FORTUNE_HERB_VALLEY_RESOURCE: RewardPool = {
  id: 'fortune_herb_valley_resource',
  name: '药谷资源采集',
  entries: [
    { type: 'filter', filter: { category: 'material', subcategory: 'herb' }, weight: 50, rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 }, quantity: [2, 4] },
    { type: 'filter', filter: { category: 'consumable' }, weight: 35, rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 }, quantity: [1, 2] },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [5, 30], weight: 15 },
  ],
  dropCount: [1, 3],
};

/** 秘境 — 战斗节点 */
export const FORTUNE_MYSTIC_REALM_COMBAT: RewardPool = {
  id: 'fortune_mystic_realm_combat',
  name: '秘境战斗掉落',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [25, 100], weight: 30 },
    { type: 'filter', filter: { category: 'equipment' }, weight: 25, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 20, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
    { type: 'filter', filter: { category: 'skill' }, weight: 10, rarityWeights: { epic: 0.5, legendary: 0.35, mythic: 0.15 } },
    { type: 'pool_ref', poolId: 'common_material', weight: 15 },
  ],
  dropCount: [2, 3],
};

/** 秘境 — 资源节点 */
export const FORTUNE_MYSTIC_REALM_RESOURCE: RewardPool = {
  id: 'fortune_mystic_realm_resource',
  name: '秘境资源探索',
  entries: [
    { type: 'filter', filter: { category: 'equipment' }, weight: 30, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 25, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 20, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 }, quantity: [1, 3] },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [20, 80], weight: 25 },
  ],
  dropCount: [1, 3],
};

/** 魔渊 — 战斗节点 */
export const FORTUNE_DEMON_ABYSS_COMBAT: RewardPool = {
  id: 'fortune_demon_abyss_combat',
  name: '魔渊战斗掉落',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [50, 300], weight: 25 },
    { type: 'filter', filter: { category: 'equipment' }, weight: 30, rarityWeights: { epic: 0.3, legendary: 0.5, mythic: 0.2 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 20, rarityWeights: { epic: 0.3, legendary: 0.45, mythic: 0.25 } },
    { type: 'filter', filter: { category: 'skill' }, weight: 15, rarityWeights: { legendary: 0.5, mythic: 0.5 } },
    { type: 'pool_ref', poolId: 'common_material', weight: 10 },
  ],
  dropCount: [2, 4],
};

/** 魔渊 — 资源节点 */
export const FORTUNE_DEMON_ABYSS_RESOURCE: RewardPool = {
  id: 'fortune_demon_abyss_resource',
  name: '魔渊资源探索',
  entries: [
    { type: 'filter', filter: { category: 'equipment' }, weight: 35, rarityWeights: { legendary: 0.6, mythic: 0.4 } },
    { type: 'filter', filter: { category: 'technique' }, weight: 30, rarityWeights: { legendary: 0.55, mythic: 0.45 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 20, rarityWeights: { epic: 0.4, legendary: 0.4, mythic: 0.2 }, quantity: [2, 5] },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [30, 150], weight: 15 },
  ],
  dropCount: [1, 3],
};

// ============================================
// 专项机缘池（5 专项 × 2 节点分类）
// ============================================

/** 武器库 — 战斗节点 */
export const FORTUNE_WEAPON_ARMORY_COMBAT: RewardPool = {
  id: 'fortune_weapon_armory_combat',
  name: '武器库战斗',
  entries: [
    { type: 'filter', filter: { category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged'] }, weight: 70, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [15, 60], weight: 30 },
  ],
  dropCount: [1, 2],
};

/** 武器库 — 资源节点 */
export const FORTUNE_WEAPON_ARMORY_RESOURCE: RewardPool = {
  id: 'fortune_weapon_armory_resource',
  name: '武器库探索',
  entries: [
    { type: 'filter', filter: { category: 'equipment', subcategory: ['weapon_melee', 'weapon_ranged'] }, weight: 80, rarityWeights: { rare: 0.2, epic: 0.4, legendary: 0.3, mythic: 0.1 } },
    { type: 'filter', filter: { category: 'material', subcategory: ['ore', 'special'] }, weight: 20, rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 } },
  ],
  dropCount: [1, 2],
};

/** 技阁 — 战斗节点 */
export const FORTUNE_SKILL_SANCTUM_COMBAT: RewardPool = {
  id: 'fortune_skill_sanctum_combat',
  name: '技阁战斗',
  entries: [
    { type: 'filter', filter: { category: 'skill' }, weight: 70, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 } },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [15, 60], weight: 30 },
  ],
  dropCount: [1, 2],
};

/** 技阁 — 资源节点 */
export const FORTUNE_SKILL_SANCTUM_RESOURCE: RewardPool = {
  id: 'fortune_skill_sanctum_resource',
  name: '技阁探索',
  entries: [
    { type: 'filter', filter: { category: 'skill' }, weight: 80, rarityWeights: { rare: 0.2, epic: 0.4, legendary: 0.3, mythic: 0.1 } },
    { type: 'pool_ref', poolId: 'common_consumable', weight: 20 },
  ],
  dropCount: [1, 2],
};

/** 金库 — 战斗节点 */
export const FORTUNE_TREASURY_COMBAT: RewardPool = {
  id: 'fortune_treasury_combat',
  name: '金库战斗',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [50, 300], weight: 60 },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [300, 1000], weight: 15, conditions: [{ type: 'playerLevelMin', value: 20 }] },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem'] }, weight: 25, rarityWeights: { uncommon: 0.5, rare: 0.35, epic: 0.15 } },
  ],
  dropCount: [1, 2],
};

/** 金库 — 资源节点 */
export const FORTUNE_TREASURY_RESOURCE: RewardPool = {
  id: 'fortune_treasury_resource',
  name: '金库探索',
  entries: [
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [100, 500], weight: 70 },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [500, 2000], weight: 15, conditions: [{ type: 'playerLevelMin', value: 30 }] },
    { type: 'filter', filter: { category: 'material', subcategory: ['gem', 'special'] }, weight: 15, rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 } },
  ],
  dropCount: [1, 3],
};

/** 经阁 — 战斗节点 */
export const FORTUNE_SCRIPTORIUM_COMBAT: RewardPool = {
  id: 'fortune_scriptorium_combat',
  name: '经阁战斗',
  entries: [
    { type: 'filter', filter: { category: 'technique' }, weight: 75, rarityWeights: { epic: 0.4, legendary: 0.4, mythic: 0.2 } },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [15, 60], weight: 25 },
  ],
  dropCount: [1, 2],
};

/** 经阁 — 资源节点 */
export const FORTUNE_SCRIPTORIUM_RESOURCE: RewardPool = {
  id: 'fortune_scriptorium_resource',
  name: '经阁探索',
  entries: [
    { type: 'filter', filter: { category: 'technique' }, weight: 80, rarityWeights: { epic: 0.3, legendary: 0.45, mythic: 0.25 } },
    { type: 'filter', filter: { category: 'material', subcategory: 'exp_fodder' }, weight: 20, rarityWeights: { rare: 0.5, epic: 0.35, legendary: 0.15 } },
  ],
  dropCount: [1, 2],
};

/** 锻炉 — 战斗节点 */
export const FORTUNE_FORGE_COMBAT: RewardPool = {
  id: 'fortune_forge_combat',
  name: '锻炉战斗',
  entries: [
    { type: 'filter', filter: { category: 'material', subcategory: ['ore', 'beast_part', 'special'] }, weight: 60, rarityWeights: { uncommon: 0.3, rare: 0.4, epic: 0.25, legendary: 0.05 }, quantity: [2, 4] },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [15, 60], weight: 40 },
  ],
  dropCount: [2, 3],
};

/** 锻炉 — 资源节点 */
export const FORTUNE_FORGE_RESOURCE: RewardPool = {
  id: 'fortune_forge_resource',
  name: '锻炉探索',
  entries: [
    { type: 'filter', filter: { category: 'material' }, weight: 70, rarityWeights: { rare: 0.3, epic: 0.45, legendary: 0.2, mythic: 0.05 }, quantity: [3, 6] },
    { type: 'filter', filter: { category: 'material', subcategory: 'exp_fodder' }, weight: 20, rarityWeights: { rare: 0.5, epic: 0.35, legendary: 0.15 }, quantity: [1, 3] },
    { type: 'static', templateId: 'wanjie:common:spirit_stone', quantity: [10, 40], weight: 10 },
  ],
  dropCount: [2, 4],
};

// ============================================
// 导出
// ============================================

/** 所有机缘池子 */
export const FORTUNE_POOLS: RewardPool[] = [
  // 主题机缘
  FORTUNE_SPIRIT_VEIN_COMBAT,
  FORTUNE_SPIRIT_VEIN_RESOURCE,
  FORTUNE_BATTLEFIELD_COMBAT,
  FORTUNE_BATTLEFIELD_RESOURCE,
  FORTUNE_HERB_VALLEY_COMBAT,
  FORTUNE_HERB_VALLEY_RESOURCE,
  FORTUNE_MYSTIC_REALM_COMBAT,
  FORTUNE_MYSTIC_REALM_RESOURCE,
  FORTUNE_DEMON_ABYSS_COMBAT,
  FORTUNE_DEMON_ABYSS_RESOURCE,
  // 专项机缘
  FORTUNE_WEAPON_ARMORY_COMBAT,
  FORTUNE_WEAPON_ARMORY_RESOURCE,
  FORTUNE_SKILL_SANCTUM_COMBAT,
  FORTUNE_SKILL_SANCTUM_RESOURCE,
  FORTUNE_TREASURY_COMBAT,
  FORTUNE_TREASURY_RESOURCE,
  FORTUNE_SCRIPTORIUM_COMBAT,
  FORTUNE_SCRIPTORIUM_RESOURCE,
  FORTUNE_FORGE_COMBAT,
  FORTUNE_FORGE_RESOURCE,
];
