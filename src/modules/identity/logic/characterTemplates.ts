/**
 * 角色模板生成器（Seed 驱动）
 *
 * 给定 worldSeed + worldviewId，确定性地生成 8 个角色模板。
 * 相同输入永远产生相同输出。使用 seeded RNG，不使用 Math.random()。
 *
 * 模板包含：name, gender, raceId, talentIds, attributes, coreStats
 * 用户选择模板并自定义后，系统生成 characterSeed 持久化角色。
 *
 * @module modules/identity
 */

import { createRng } from '@/shared/utils/rng';
import { WorldViewRegistry } from '@/core/registry';
import { AttributeRegistry } from '@/core/registry/AttributeRegistry';
import { RaceRegistry } from '@/core/registry/RaceRegistry';
import { TalentRegistry } from '@/core/registry/TalentRegistry';
import { calculateCoreStats } from '@/core/world/calculateCoreStats';
import type { AttributeTemplate, AttributeGrowthRule } from '@/core/types';
import type { CoreStatValues } from '@/core/world/calculateCoreStats';

// ============================================
// 类型定义
// ============================================

/** 角色模板（用户选择前的候选角色） */
export interface CharacterTemplate {
  /** 模板索引（0-7） */
  index: number;
  /** 角色名 */
  name: string;
  /** 性别 */
  gender: '男' | '女';
  /** 种族 ID */
  raceId: string;
  /** 天赋 ID 列表 */
  talentIds: string[];
  /** 属性值（key → 数值 或 枚举值字符串） */
  attributes: Record<string, number | string>;
  /** 派生的核心值 */
  coreStats: CoreStatValues;
  /** 初始等级时的属性值（用于前端展示 baseValue） */
  baseAttributes: Record<string, number | string>;
}

// ============================================
// 内部工具
// ============================================

/** 从数组中确定性选取元素 */
function pickItem<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * 从姓名池中生成角色名
 */
function generateName(
  surnames: string[],
  maleNames: string[],
  femaleNames: string[],
  isMale: boolean,
  rng: () => number,
): string {
  const surname = pickItem(surnames, rng);
  const givenPool = isMale ? maleNames : femaleNames;
  const givenName = pickItem(givenPool, rng);
  // 20% 概率三个字
  if (rng() < 0.2) {
    const secondChar = pickItem(givenPool, rng);
    return surname + givenName + secondChar;
  }
  return surname + givenName;
}

/** 为属性分配随机值（基于 BG3 风格的点数分配） */
function rollAttribute(
  baseValue: number,
  rng: () => number,
  pointsToDistribute: number = 4,
): number {
  // 在 baseValue 基础上 ±points 随机浮动
  const delta = Math.floor(rng() * (pointsToDistribute * 2 + 1)) - pointsToDistribute;
  return Math.max(1, baseValue + delta);
}

// ============================================
// 公开 API
// ============================================

/**
 * 从世界种子和世界观生成 8 个角色模板
 *
 * 确定性纯函数：相同 worldSeed + worldviewId → 相同 8 个模板。
 *
 * @param worldSeed - 世界种子（如 "a0b1c2d3"）
 * @param worldviewId - 世界观 ID（如 "cultivation"）
 * @returns 8 个角色模板
 */
export function generateCharacterTemplates(
  worldSeed: string,
  worldviewId: string,
): CharacterTemplate[] {
  const worldview = WorldViewRegistry.getInstance().get(worldviewId);
  if (!worldview) {
    throw new Error(`世界观 "${worldviewId}" 未注册`);
  }

  // 解析属性模板
  const attrRegistry = AttributeRegistry.getInstance();
  const attrDefs: (AttributeTemplate & { growthRule: AttributeGrowthRule })[] =
    worldview.attributes
      .map(config => {
        const template = attrRegistry.get(config.key);
        if (!template) return null;
        return { ...template, growthRule: config.growthRule };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

  const namePool = worldview.namePool;
  const racePool = worldview.racePool;

  const templates: CharacterTemplate[] = [];

  for (let i = 0; i < 8; i++) {
    const templateSeed = `${worldSeed}:template:${i}`;
    const rng = createRng(templateSeed);

    // 性别
    const isMale = rng() < 0.5;
    const gender: '男' | '女' = isMale ? '男' : '女';

    // 姓名
    const name = generateName(
      namePool.surnames,
      namePool.maleNames,
      namePool.femaleNames,
      isMale,
      rng,
    );

    // 种族（从 racePool 随机选，使用 RaceRegistry 数据）
    const raceRegistry = RaceRegistry.getInstance();
    const availableRaces = racePool.filter(id => raceRegistry.get(id));
    const raceId = availableRaces.length > 0 ? pickItem(availableRaces, rng) : (racePool[0] || 'human');
    const raceDef = raceRegistry.get(raceId);

    // 天赋（从种族的 talentPool 中按稀有度概率选取 1-2 个）
    const talentRegistry = TalentRegistry.getInstance();
    const talentIds: string[] = [];
    if (raceDef) {
      const raceTalents = raceDef.talentPool
        .map(id => talentRegistry.get(id))
        .filter(Boolean);
      // 从可用天赋中随机选 1-2 个
      const shuffled = [...raceTalents].sort(() => rng() - 0.5);
      const count = Math.floor(rng() * 2) + 1; // 1 or 2
      talentIds.push(...shuffled.slice(0, count).map(t => t!.id));
    }

    // 属性值（对每个 numeric 属性随机分配）
    const attributes: Record<string, number | string> = {};
    const baseAttributes: Record<string, number | string> = {};
    for (const def of attrDefs) {
      if (def.type === 'numeric') {
        const rolled = rollAttribute(def.baseValue, rng);
        attributes[def.key] = rolled;
        baseAttributes[def.key] = rolled;
      } else if (def.type === 'enum') {
        // 枚举型属性：随机选一个
        const selected = pickItem(def.enumValues, rng);
        attributes[def.key] = selected.value;
        baseAttributes[def.key] = selected.value;
      }
    }

    // 计算核心值（初始等级 1）
    const coreStats = calculateCoreStats(attributes, attrDefs);

    templates.push({
      index: i,
      name,
      gender,
      raceId,
      talentIds,
      attributes,
      coreStats,
      baseAttributes,
    });
  }

  return templates;
}

/**
 * 生成角色持久化 seed
 *
 * 在用户选择模板并自定义后调用，编码用户的选择。
 *
 * @param worldSeed - 世界种子
 * @param templateIndex - 选择的模板索引
 * @param customizations - 用户自定义 { name?, gender?, attributes? }
 */
export function createCharacterSeed(
  worldSeed: string,
  templateIndex: number,
  customizations: Record<string, unknown> = {},
): string {
  const payload = `${worldSeed}:${templateIndex}:${JSON.stringify(customizations)}`;
  // 简单 hash：使用 XOR + 移位
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // 转为 8 位 hex
  const hex = Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
  return hex;
}
