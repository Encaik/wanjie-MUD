/**
 * 词条系统 - 重构版
 * 
 * 核心原则：
 * 1. 每个词条都有加有减（除非是顶级品质）
 * 2. 4个词条的综合影响应该在 -20 到 +20 之间（围绕基础250小范围波动）
 * 3. 品质决定的是"亮点"程度，正向属性更多/更强
 * 4. 描述档次与品质绑定
 * 
 * 数据文件：src/lib/game/data/traits.ts
 */

import { ImpactLevel, StatImpact } from './types';
import {
  QUALITY_CONFIG,
  ORIGIN_TRAITS,
  TRAIT_TRAITS,
  PERSONALITY_TRAITS,
  TALENT_TRAITS,
  ALL_ATTRS,
  TraitDefinition,
} from '../data/traits';

// 重新导出类型和数据
export type { TraitDefinition };
export { QUALITY_CONFIG, ORIGIN_TRAITS, TRAIT_TRAITS, PERSONALITY_TRAITS, TALENT_TRAITS };

// 随机选择
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 随机数
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * 根据品质生成影响
 */
export function generateImpactByQuality(
  positiveAttrs: string[],
  negativeAttrs: string[],
  level: ImpactLevel
): StatImpact {
  const config = QUALITY_CONFIG[level];
  const impact: StatImpact = {};

  // 为每个正向属性生成正值
  for (const attr of positiveAttrs) {
    impact[attr as keyof StatImpact] = random(config.positiveRange[0], config.positiveRange[1]);
  }

  // 为每个负向属性生成负值
  for (const attr of negativeAttrs) {
    impact[attr as keyof StatImpact] = random(config.negativeRange[0], config.negativeRange[1]);
  }

  return impact;
}

/**
 * 从词条池中随机选择一个词条（用于角色生成）
 * 
 * @param traitPool 词条池，按品质分类
 * @returns 词条定义和生成的影响
 */
export function selectRandomTrait(
  traitPool: Record<ImpactLevel, TraitDefinition[]>
): { definition: TraitDefinition; impact: StatImpact } {
  // 品质概率
  const qualityRoll = Math.random();
  let level: ImpactLevel;
  
  if (qualityRoll < 0.03) {
    level = 'legendary';  // 3%
  } else if (qualityRoll < 0.10) {
    level = 'epic';       // 7%
  } else if (qualityRoll < 0.25) {
    level = 'rare';       // 15%
  } else if (qualityRoll < 0.50) {
    level = 'uncommon';   // 25%
  } else {
    level = 'common';     // 50%
  }
  
  const definition = randomItem(traitPool[level]);
  const impact = generateImpactByQuality(
    definition.positiveAttrs,
    definition.negativeAttrs,
    definition.level
  );
  
  return { definition, impact };
}

/**
 * 根据类型获取词条池
 */
export function getTraitPool(type: 'origin' | 'trait' | 'personality' | 'talent'): Record<ImpactLevel, TraitDefinition[]> {
  switch (type) {
    case 'origin':
      return ORIGIN_TRAITS;
    case 'trait':
      return TRAIT_TRAITS;
    case 'personality':
      return PERSONALITY_TRAITS;
    case 'talent':
      return TALENT_TRAITS;
    default:
      return TRAIT_TRAITS;
  }
}

/**
 * 生成随机词条
 */
export function generateRandomTrait(
  type: 'origin' | 'trait' | 'personality' | 'talent'
): { definition: TraitDefinition; impact: StatImpact } {
  const traitPool = getTraitPool(type);
  return selectRandomTrait(traitPool);
}

/**
 * 生成影响描述
 */
export function generateImpactDescription(impact: StatImpact): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(impact)) {
    if (value && value !== 0) {
      parts.push(`${key}${value >= 0 ? '+' : ''}${value}`);
    }
  }
  return parts.join('，');
}

/**
 * 计算总影响力
 */
export function calculateTotalImpact(impact: StatImpact): number {
  return Object.values(impact).reduce((sum, v) => sum + (v || 0), 0);
}
