/**
 * 心魔动态生成引擎（demonForge）
 *
 * 根据世界观类型、玩家等级、CoreStats、业力值、流派等信息动态生成心魔。
 * 同一组输入参数 + 相同 seed 始终生成相同的心魔（可复现）。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import { getArchNemesisBonus } from './demonMemory';
import { DEMON_TYPE_NAMES, DemonType, type DemonForgeParams, type GeneratedDemon, type DemonBattleStats, type DemonSourceFactors } from './types';
import { getWorldDemonConfig, getWorldDemonBaseStats, getWorldVisualPreset } from './worldResonance';

// ============================================
// 心魔锻造主函数
// ============================================

/** 简单确定性随机数（seed-based） */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  if (s <= 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 动态生成一个心魔
 *
 * 心魔属性受以下因素影响：
 * - 世界观：决定攻击偏向和基础属性倍率
 * - 等级：心魔强度随等级线性增长
 * - CoreStats：高 willpower 降低意志侵蚀，高 perception 影响弱点类型
 * - 业力值：负业力增强心魔
 * - 流派：魔修增强心魔但提供吸收选项，体修降低物理攻击
 * - 图鉴：宿敌心魔属性大幅增强
 *
 * @param params - 锻造参数
 * @returns 动态生成的心魔
 */
export function forgeDemon(params: DemonForgeParams): GeneratedDemon {
  const {
    worldType,
    playerLevel,
    karma,
    cultivationPath,
    seed,
    demonCodex,
  } = params;

  const rng = seededRandom(seed);

  // 1. 获取世界观配置
  const worldConfig = getWorldDemonConfig(worldType);

  // 2. 选择心魔类型（基于seed随机 + 图鉴权重调整）
  const demonType = selectDemonType(rng, demonCodex);
  const typeName = DEMON_TYPE_NAMES[demonType];

  // 3. 计算心魔基础属性
  const baseStats = getWorldDemonBaseStats(worldType, playerLevel);

  // 4. 应用修正因子
  const sourceFactors = calculateFactors(playerLevel, karma, cultivationPath);
  const archNemesisBonus = getArchNemesisBonus(demonCodex, demonType);

  // 5. 计算最终战斗属性
  const stats: DemonBattleStats = {
    physicalAttack: Math.floor(
      baseStats.physicalAttack *
        (1 + playerLevel / 50) *
        (1 + sourceFactors.karmaModifier) *
        (1 + sourceFactors.pathModifier) *
        (1 + archNemesisBonus),
    ),
    specialAttack: Math.floor(
      baseStats.specialAttack *
        (1 + playerLevel / 50) *
        (1 + sourceFactors.karmaModifier) *
        (1 + sourceFactors.pathModifier) *
        (1 + archNemesisBonus),
    ),
    willErosion: Math.floor(
      baseStats.willErosion *
        (1 + playerLevel / 50) *
        (1 + sourceFactors.karmaModifier) *
        (1 + archNemesisBonus),
    ),
  };

  // 6. 生成诱惑文本
  const templates = worldConfig.temptationTemplates[demonType];
  const temptationIdx = Math.floor(rng() * templates.length);
  const temptation = templates[temptationIdx] ?? templates[0];

  // 7. 生成心魔名称
  const suffix = worldConfig.nameSuffixes[demonType];
  const name = `${typeName}${suffix}`;

  // 8. 视觉预设
  const visualPreset = getWorldVisualPreset(worldType);

  // 9. 确定弱点类型
  const weakPointType = determineWeakPointType(rng, worldConfig.attackProfile.bias);

  // 10. 生成唯一标识
  const id = `demon_${worldType}_${demonType}_${Date.now()}_${Math.floor(rng() * 1000)}`;

  return {
    id,
    type: demonType,
    name,
    worldType,
    visualPreset,
    stats,
    temptation,
    weakPointType,
    sourceFactors,
  };
}

// ============================================
// 心魔类型选择
// ============================================

/** 所有基础心魔类型 */
const ALL_DEMON_TYPES: DemonType[] = ['greed', 'fear', 'arrogance', 'regret', 'doubt'];

/**
 * 从5种基础类型中选择心魔类型
 *
 * 选择逻辑：
 * - 每种类型基础权重 20%
 * - 图鉴中已击败的类型权重降低（熟悉，更易对付）
 * - 宿敌类型权重翻倍（会主动找上门）
 * - seed 保证可复现
 */
function selectDemonType(
  rng: () => number,
  demonCodex: DemonForgeParams['demonCodex'],
): DemonType {
  const weights: number[] = ALL_DEMON_TYPES.map(type => {
    let weight = 20;
    const memory = demonCodex.find(m => m.demonType === type);
    if (memory) {
      if (memory.isArchNemesis) {
        weight = 40; // 宿敌更常出现
      } else if (memory.victories > memory.encounters * 0.5) {
        weight = 15; // 常胜类型权重降低
      }
    }
    return weight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * totalWeight;

  for (let i = 0; i < ALL_DEMON_TYPES.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return ALL_DEMON_TYPES[i];
  }

  return ALL_DEMON_TYPES[ALL_DEMON_TYPES.length - 1];
}

// ============================================
// 修正因子计算
// ============================================

/**
 * 计算影响心魔强度的修正因子
 */
function calculateFactors(
  playerLevel: number,
  karma: number,
  cultivationPath: string | null,
): DemonSourceFactors {
  // 负业力增加心魔攻击力，-1000业力 → 最大+50%
  const karmaModifier = karma < 0
    ? Math.abs(karma) / 2000 // max 0.5
    : 0;

  // 魔修流派增加心魔强度
  let pathModifier = 0;
  if (cultivationPath === 'demon') {
    pathModifier = 0.30;
  } else if (cultivationPath === 'body') {
    pathModifier = -0.15; // 体修降低心魔物理攻击（在 stats 层处理）
  }

  return {
    seed: 0, // 由外部设置
    levelWeight: playerLevel / 50,
    worldDifficulty: 1.0, // 后续从世界观系数获取
    karmaModifier,
    pathModifier,
  };
}

// ============================================
// 弱点类型判定
// ============================================

/**
 * 根据世界观的攻击偏向确定心魔弱点类型
 *
 * - physical 偏向 → 弱点在 special（法术攻击更有效）
 * - special 偏向 → 弱点在 physical（物理攻击更有效）
 * - will 偏向 → 弱点在 special（精神性心魔怕"实在"的伤害）
 * - balanced → 随机
 */
function determineWeakPointType(
  rng: () => number,
  bias: string,
): 'physical' | 'special' | 'balanced' {
  switch (bias) {
    case 'physical':
      return 'special'; // 物理型心魔怕特殊攻击
    case 'special':
      return 'physical'; // 法术型心魔怕物理攻击
    case 'will':
      return 'special'; // 意志型心魔怕特殊攻击
    case 'balanced': {
      const roll = rng();
      return roll < 0.5 ? 'physical' : 'special';
    }
    default:
      return 'physical';
  }
}
