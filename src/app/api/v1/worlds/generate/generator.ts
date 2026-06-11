/**
 * 世界分步生成器
 *
 * 设计原则：
 *   所有子生成器只接受 worldType + random 两个入参，
 *   确保相同 worldType + 相同 random → 相同输出（确定性）。
 *
 * 生成步骤：
 *   ① 基础信息：名称、描述、境界体系、力量体系、难度
 *   ② 详细信息：势力、危险、机缘
 *
 * API 对应：
 *   generateBasic      → POST /api/v1/worlds/generate/basic    （前端初始化）
 *   generateDetails    → POST /api/v1/worlds/generate/details   （单个 seed 补全）
 *   generateAndSave    → POST /api/v1/worlds/generate           （完整生成）
 */

import { hashString, createRng } from '@/shared/utils/rng';
import { GAME_VERSION } from '@/shared/config/version';
import { getWorldTypes, getWorldData } from '@/modules/identity/data/worldData';
import { generateRealmSystem } from '@/modules/progression/data/realmData';
import { getPowerSystemDescription } from '@/modules/progression/data/realmCore';
import { generateWorldFactions, generateFactionDescription } from '@/modules/faction/data/factionData';
import {
  getWorldBaseCoefficient,
  calculateWorldDifficultyCoefficient,
  getWorldDifficultyFromCoefficient,
  generateWorldDangers,
  generateWorldOpportunities,
} from '@/modules/identity/data/worldSystem';
import type { World, WorldType } from '@/core/types';
import { getWorldById, saveWorld } from '../store';

// ============================================
// 工具
// ============================================

function pickItem<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function seedToRandom(seed: string): number {
  return hashString(seed);
}

function resolveWorldType(random: number, worldType?: string): WorldType {
  const worldTypes = getWorldTypes();
  if (worldTypes.length === 0) {
    throw new Error('没有已注册的世界类型');
  }
  if (worldType && worldTypes.includes(worldType)) {
    return worldType as WorldType;
  }
  return worldTypes[Math.abs(random) % worldTypes.length] as WorldType;
}

// ============================================
// 步骤①：基础信息（名称、描述、境界、难度）
// ============================================

/**
 * 生成世界基础信息
 *
 * 包含：名称、描述、境界体系、力量体系、难度。
 * 难度是纯计算，不依赖随机数，因此放在基础信息中。
 */
export function generateWorldBasic(seed: string, worldType?: string): World {
  const random = seedToRandom(seed);
  const rng = createRng(String(random));
  const type = resolveWorldType(random, worldType);
  const worldData = getWorldData(type);

  const name = pickItem(worldData.namePrefixes, rng) + pickItem(worldData.nameSuffixes, rng);
  const description = pickItem(worldData.descriptions, rng);
  const realmSystem = generateRealmSystem(type);
  const powerSystem = getPowerSystemDescription(realmSystem);

  const baseCoefficient = getWorldBaseCoefficient(type);
  const actualCoefficient = calculateWorldDifficultyCoefficient(baseCoefficient, 0);
  const difficulty = getWorldDifficultyFromCoefficient(actualCoefficient);

  return {
    id: seed,
    random,
    gameVersion: GAME_VERSION,
    worldviewId: type,
    name,
    type,
    description,
    powerSystem,
    realmSystem,
    baseCoefficient,
    actualCoefficient,
    difficulty,

    // 以下字段在步骤②生成
    majorForces: '',
    factions: [],
    dangers: [],
    opportunities: [],
    ratingScore: 0,
    specialPlot: null,
  };
}

// ============================================
// 步骤②：详细信息（势力、危险、机缘）
// ============================================

/**
 * 生成世界详细信息
 *
 * 接收步骤①产出的基础 World，填充势力、危险、机缘等随机内容。
 * 所有子生成器只使用 worldType + random，确保确定性。
 */
export function generateWorldDetails(basic: World): World {
  const { type, random, actualCoefficient } = basic;

  const factionRng = createRng(String(random) + ':faction');
  const dangerRng = createRng(String(random) + ':danger');
  const opportunityRng = createRng(String(random) + ':opportunity');

  const factions = generateWorldFactions(type, factionRng);
  const majorForces = generateFactionDescription(type, factions);
  const dangers = generateWorldDangers(type, actualCoefficient, dangerRng);
  const opportunities = generateWorldOpportunities(type, actualCoefficient, dangers, opportunityRng);

  return {
    ...basic,
    majorForces,
    factions,
    dangers,
    opportunities,
  };
}

// ============================================
// 对外方法
// ============================================

/** 完整生成（基础 + 详情），不持久化 */
export function generateWorld(seed: string, worldType?: string): World {
  const basic = generateWorldBasic(seed, worldType);
  return generateWorldDetails(basic);
}

/**
 * 完整生成并保存（基础 + 详情 → DB）
 *
 * 幂等：seed 已存在则直接返回。
 */
export function generateAndSave(seed: string, worldType?: string): World {
  const existing = getWorldById(seed);
  if (existing) return existing;

  const basic = generateWorldBasic(seed, worldType);
  const world = generateWorldDetails(basic);
  saveWorld(world);
  return world;
}

/**
 * 只生成基础信息并保存（供前端初始化世界列表使用）
 *
 * 幂等：seed 已存在则直接返回。
 */
export function generateBasic(seed: string, worldType?: string): World {
  const existing = getWorldById(seed);
  if (existing) return existing;

  const basic = generateWorldBasic(seed, worldType);
  saveWorld(basic);
  return basic;
}

/**
 * 对已有基础世界补全详细信息
 *
 * 只接受单个 seed，若该 seed 的世界不存在则返回 null，否则生成详情并更新 DB。
 */
export function generateDetailsForSeed(seed: string): World | null {
  const existing = getWorldById(seed);
  if (!existing) return null;

  // 如果已经生成过详情（有 factions），直接返回
  if (existing.factions.length > 0 || existing.dangers.length > 0) return existing;

  const world = generateWorldDetails(existing);
  saveWorld(world);
  return world;
}
