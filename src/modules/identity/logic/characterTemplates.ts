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
  /** 属性最终值（key → 数值 或 枚举值字符串，已含所有加成） */
  attributes: Record<string, number | string>;
  /** 属性分解明细（key → 各来源贡献） */
  attributeBreakdown: Record<string, AttributeBreakdown>;
  /** 派生的核心值 */
  coreStats: CoreStatValues;
}

import type { AttributeBreakdown } from '@/core/types';

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

    // 天赋（从种族的 talentPool 中筛选，需匹配世界观 + 种族 + 目标属性存在）
    const talentRegistry = TalentRegistry.getInstance();
    const talentIds: string[] = [];
    if (raceDef) {
      const attrKeys = new Set(attrDefs.map(d => d.key));
      const availableTalents = raceDef.talentPool
        .map(id => talentRegistry.get(id))
        .filter(t => t && (!t.worldviewRestrictions || t.worldviewRestrictions.length === 0
          || t.worldviewRestrictions.includes(worldviewId))
          && (!t.raceRestrictions || t.raceRestrictions.length === 0
          || t.raceRestrictions.includes(raceId))
          // 天赋效果目标属性必须在当前世界观中存在
          && t.effects.some(e => attrKeys.has(e.target)));
      // 按稀有度概率选 1-2 个
      const shuffled = [...availableTalents].sort(() => rng() - 0.5);
      const count = Math.floor(rng() * 2) + 1;
      talentIds.push(...shuffled.slice(0, count).map(t => t!.id));
    }

    // 属性值 + 分解明细
    const attributes: Record<string, number | string> = {};
    const breakdown: Record<string, AttributeBreakdown> = {};

    for (const def of attrDefs) {
      if (def.type === 'numeric') {
        const base = def.baseValue;
        const rolled = rollAttribute(0, rng); // 随机浮动（相对 base 的偏移）
        const total = base + rolled;
        attributes[def.key] = total;
        breakdown[def.key] = { value: total, base, rolled, talent: 0, race: 0, growth: 0, item: 0 };
      } else if (def.type === 'enum') {
        const selected = pickItem(def.enumValues, rng);
        attributes[def.key] = selected.value;
        // 枚举型没有数值分解
      }
    }

    // 应用天赋效果到属性
    for (const talentId of talentIds) {
      const talent = talentRegistry.get(talentId);
      if (!talent) continue;
      for (const effect of talent.effects) {
        if (effect.type === 'attribute_flat') {
          attributes[effect.target] = ((attributes[effect.target] as number) || 0) + effect.value;
          if (breakdown[effect.target]) {
            breakdown[effect.target].talent += effect.value;
            breakdown[effect.target].value += effect.value;
          }
        }
      }
    }

    // 应用种族加成到属性
    if (raceDef) {
      for (const [attrKey, bonus] of Object.entries(raceDef.baseAttributeBonuses)) {
        attributes[attrKey] = ((attributes[attrKey] as number) || 0) + bonus;
        if (breakdown[attrKey]) {
          breakdown[attrKey].race += bonus;
          breakdown[attrKey].value += bonus;
        }
      }
    }

    // 计算核心值
    const coreStats = calculateCoreStats(attributes, attrDefs);

    // 种族天生能力对核心值的直接修正（种族层面，不在属性层）
    if (raceDef) {
      for (const ability of raceDef.innateAbilities) {
        for (const [key, bonus] of Object.entries(ability.effects)) {
          const stat = key as keyof typeof coreStats;
          if (bonus.flat) coreStats[stat] = (coreStats[stat] ?? 0) + bonus.flat;
          if (bonus.multiplier) coreStats[stat] = Math.floor((coreStats[stat] ?? 0) * bonus.multiplier);
        }
      }
    }

    templates.push({
      index: i,
      name,
      gender,
      raceId,
      talentIds,
      attributes,
      attributeBreakdown: breakdown,
      coreStats,
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
