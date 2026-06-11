/**
 * 世界生成纯函数
 *
 * 从 WorldviewDefinition（世界观定义）和种子生成 World（世界实例）。
 * 所有函数均为确定性纯函数——相同输入永远产生相同输出。
 *
 * 设计原则：
 * - 纯函数：无副作用，不依赖 Math.random()，使用 seeded RNG
 * - 单一职责：从世界观池中确定性选取值，组装 World 对象
 * - 模块无关：只依赖 core/ 和 shared/，不依赖 modules/
 *
 * @module core/world
 */

import { hashString, createRng } from '@/shared/utils/rng';
import { GAME_VERSION } from '@/shared/config/version';
import type { WorldviewDefinition } from '@/core/registry/WorldViewRegistry';
import type { World, WorldDifficulty, WorldFaction } from '@/core/types';

// ============================================
// 工具函数
// ============================================

/** 从数组中确定性选取元素 */
function pickItem<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 从数组中确定性选取 N 个不重复元素 */
function pickItems<T>(arr: T[], count: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

// ============================================
// 难度计算
// ============================================

/** 难度系数倍数（飞升次数加成） */
const ASCENSION_MULTIPLIER = 0.15;

/** 难度等级阈值 */
const DIFFICULTY_THRESHOLDS: Array<{ max: number; difficulty: WorldDifficulty }> = [
  { max: 1.2, difficulty: '简单' },
  { max: 1.5, difficulty: '普通' },
  { max: 2.0, difficulty: '困难' },
  { max: 3.0, difficulty: '噩梦' },
  { max: 5.0, difficulty: '地狱' },
];

/**
 * 计算世界实际难度系数
 *
 * @param baseCoefficient - 世界观基础系数
 * @param ascensionCount - 飞升次数
 */
export function calculateDifficultyCoefficient(
  baseCoefficient: number,
  ascensionCount: number
): number {
  const multiplier = 1 + ascensionCount * ASCENSION_MULTIPLIER;
  return Math.round(baseCoefficient * multiplier * 100) / 100;
}

/**
 * 从实际系数获取难度等级
 */
export function getDifficultyFromCoefficient(coefficient: number): WorldDifficulty {
  for (const threshold of DIFFICULTY_THRESHOLDS) {
    if (coefficient <= threshold.max) {
      return threshold.difficulty;
    }
  }
  return '深渊';
}

// ============================================
// 世界生成
// ============================================

/**
 * 从世界观定义生成世界详细信息（仅限势力、危险、机缘）
 *
 * 纯函数：与 generateWorldBasicFields 配合，用于分步生成场景。
 * 先在步骤①生成基础信息并存入 DB，再在步骤②调用此函数补全详情。
 *
 * 使用带后缀的独立 RNG 流（seed + ':faction' / ':danger' / ':opportunity'），
 * 确保无论是否先执行过基础生成，详情结果都一致。
 *
 * @param worldview - 世界观完整定义
 * @param seed - 世界种子字符串
 * @returns 世界详细信息字段（factions, majorForces, dangers, opportunities）
 */
export function generateWorldDetails(
  worldview: WorldviewDefinition,
  seed: string,
): Pick<World, 'factions' | 'majorForces' | 'dangers' | 'opportunities'> {
  const factionRng = createRng(seed + ':faction');
  const dangerRng = createRng(seed + ':danger');
  const opportunityRng = createRng(seed + ':opportunity');

  // 势力生成（从门派模板中选取 2-5 个）
  const factionCount = Math.floor(factionRng() * 4) + 2;
  const selectedFactions = pickItems(worldview.factions, factionCount, factionRng);
  const factions: WorldFaction[] = selectedFactions.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    description: f.description,
  }));
  const majorForces = factions.map(f => f.name).join('、') || '未知势力';

  // 危险（从世界观池中选取 2-4 个）
  const dangerCount = Math.floor(dangerRng() * 3) + 2;
  const selectedDangers = pickItems(worldview.dangers, dangerCount, dangerRng);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dangers = selectedDangers.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    level: d.dangerLevel,
    type: d.type as WorldDanger['type'],
    triggerChance: d.triggerCondition.chance,
  })) as any;

  // 机遇（从世界观池中选取 2-4 个）
  const opportunityCount = Math.floor(opportunityRng() * 3) + 2;
  const selectedOpportunities = pickItems(worldview.opportunities, opportunityCount, opportunityRng);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunities = selectedOpportunities.map(o => ({
    id: o.id,
    name: o.name,
    description: o.description,
    level: o.opportunityLevel,
    type: o.type as WorldOpportunity['type'],
    triggerChance: o.triggerCondition.chance,
  })) as any;

  return { factions, majorForces, dangers, opportunities };
}

/**
 * 从世界观定义生成世界基础字段（不含势力/危险/机缘）
 *
 * 纯函数：与 generateWorldDetails 配合，用于分步生成场景。
 *
 * @param worldview - 世界观完整定义
 * @param seed - 世界种子字符串
 * @param ascensionCount - 飞升次数（影响难度系数）
 * @returns 世界基础字段（不包含 factions, majorForces, dangers, opportunities）
 */
function generateWorldBasicFields(
  worldview: WorldviewDefinition,
  seed: string,
  ascensionCount: number,
): Omit<World, 'factions' | 'majorForces' | 'dangers' | 'opportunities'> {
  const rng = createRng(seed);
  const hash = hashString(seed);

  const name = pickItem(worldview.namePrefixes, rng) + pickItem(worldview.nameSuffixes, rng);
  const description = pickItem(worldview.descriptions, rng);
  const powerSystem = pickItem(worldview.powerSystems, rng);

  const realmSystem = {
    mainRealmName: worldview.realmSystem.mainRealmName,
    subRealmName: worldview.realmSystem.subRealmName,
    tiers: worldview.realmSystem.tiers.map(t => ({
      name: t.name,
      subRealms: [...t.subRealms],
      levelRange: [...t.levelRange] as [number, number],
    })),
    subRealmMultiplier: worldview.realmSystem.subRealmMultiplier,
    tierJumpMultiplier: worldview.realmSystem.tierJumpMultiplier,
  };

  const baseCoefficient = worldview.baseCoefficient;
  const actualCoefficient = calculateDifficultyCoefficient(baseCoefficient, ascensionCount);
  const difficulty = getDifficultyFromCoefficient(actualCoefficient);

  return {
    id: seed,
    random: hash,
    gameVersion: GAME_VERSION,
    worldviewId: worldview.id,
    type: worldview.name,
    name,
    description,
    powerSystem,
    realmSystem,
    baseCoefficient,
    actualCoefficient,
    difficulty,
    ratingScore: 0,
  };
}

/**
 * 从世界观定义生成完整世界实例
 *
 * 纯函数：相同 worldview + seed + ascensionCount → 相同 World。
 * 不依赖 Math.random()，所有随机性由 seed 派生。
 *
 * 内部调用 generateWorldBasicFields + generateWorldDetails，
 * 确保完整生成与分步生成（basic → details）的结果一致。
 *
 * @param worldview - 世界观完整定义（从 WorldViewRegistry 获取）
 * @param seed - 世界种子字符串（为空时自动生成）
 * @param ascensionCount - 飞升次数（影响难度系数）
 * @returns 生成的 World 实例
 *
 * @example
 * ```typescript
 * const registry = WorldViewRegistry.getInstance();
 * const worldview = registry.get('cultivation');
 * const world = generateWorld(worldview!, 'abc12345', 0);
 * // world.worldviewId === 'cultivation'
 * // world.name 从 worldview.namePrefixes + worldview.nameSuffixes 组合
 * ```
 */
export function generateWorld(
  worldview: WorldviewDefinition,
  seed: string = '',
  ascensionCount: number = 0
): World {
  const actualSeed = seed || generateSeed();
  const basic = generateWorldBasicFields(worldview, actualSeed, ascensionCount);
  const details = generateWorldDetails(worldview, actualSeed);

  return {
    ...basic,
    ...details,
  };
}

// ============================================
// 类型辅助（避免直接依赖 modules/）
// ============================================

/** WorldDanger 简化类型（与 modules/identity/data/worldEffectsData 兼容） */
interface WorldDanger {
  id: string;
  name: string;
  description: string;
  level: number;
  type: 'stat_debuff' | 'resource_drain' | 'enemy_buff' | 'special_mechanic' | 'random_event';
  triggerChance: number;
}

/** WorldOpportunity 简化类型 */
interface WorldOpportunity {
  id: string;
  name: string;
  description: string;
  level: number;
  type: 'stat_buff' | 'resource_gain' | 'special_ability' | 'rare_drop' | 'favorable_event';
  triggerChance: number;
}

// ============================================
// 批量生成 & 种子工具
// ============================================

/**
 * 生成随机种子字符串（8 位十六进制）
 */
export function generateSeed(): string {
  // 使用 crypto 生成随机种子（这是唯一允许的非确定性操作）
  const chars = '0123456789abcdef';
  let result = '';
  // 用简单的种子生成逻辑（服务端有 crypto，客户端用 Math 兜底）
  const getRandomByte = (): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(1))[0];
    }
    return Math.floor(Math.random() * 256);
  };
  for (let i = 0; i < 8; i++) {
    result += chars[getRandomByte() % 16];
  }
  return result;
}

/**
 * 批量生成世界实例
 *
 * @param worldview - 世界观定义
 * @param seeds - 种子数组
 * @param ascensionCount - 飞升次数
 * @returns World 数组
 */
export function generateWorlds(
  worldview: WorldviewDefinition,
  seeds: string[],
  ascensionCount: number = 0
): World[] {
  return seeds.map(seed => generateWorld(worldview, seed, ascensionCount));
}

/**
 * 生成指定数量的世界实例
 *
 * @param worldview - 世界观定义
 * @param count - 生成数量
 * @param ascensionCount - 飞升次数
 * @returns World 数组
 */
export function generateWorldsByCount(
  worldview: WorldviewDefinition,
  count: number,
  ascensionCount: number = 0
): World[] {
  const seeds = Array.from({ length: count }, () => generateSeed());
  return generateWorlds(worldview, seeds, ascensionCount);
}
