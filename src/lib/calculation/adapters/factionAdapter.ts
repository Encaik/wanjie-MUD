/**
 * 势力效果适配器
 * 
 * 将势力特性数据转换为统一效果格式
 */

import { 
  UnifiedEffect, 
  EffectSourceType, 
  EffectCalcType, 
  EffectPriority, 
  CalculableStat 
} from '../types';
import { CalculationContext, FactionInput, FactionTraitInput, FactionTraitEffectInput } from '../context/types';
import { EffectAdapter, createBaseEffect, generateEffectId, mapStatName } from './base';

// ============================================
// 特性效果类型映射
// ============================================

/** 特性效果类型到计算类型的映射 */
const TRAIT_EFFECT_CALC_MAP: Record<string, EffectCalcType> = {
  stat_bonus: 'multiply',      // 属性加成使用乘法（百分比）
  skill_bonus: 'multiply',     // 技能加成使用乘法
  cultivation_bonus: 'multiply', // 修炼加成使用乘法
  resource_bonus: 'multiply',  // 资源加成使用乘法
  special_ability: 'multiply', // 特殊能力使用乘法（实际在代码中会跳过）
};

/** 参数名到属性名的映射 */
const PARAM_STAT_MAP: Record<string, CalculableStat> = {
  // 战斗属性
  attack: 'attack',
  defense: 'defense',
  maxHp: 'maxHp',
  maxMp: 'maxMp',
  critChance: 'critRate',
  critDamage: 'critDamage',
  evasion: 'dodgeRate',
  dodgeRate: 'dodgeRate',
  speed: 'luck', // 速度映射到幸运
  damageReduction: 'defense', // 伤害减免映射到防御
  
  // 修炼属性
  cultivationSpeed: 'cultivationExp',
  breakthroughChance: 'breakthroughRate',
  techniqueExp: 'techniqueExp',
  
  // 经济属性
  expBonus: 'expGain',
  spiritStoneBonus: 'spiritStoneGain',
  dropBonus: 'dropRate',
  rewardBonus: 'expGain',
  
  // 特殊
  luck: 'luck',
};

// ============================================
// 内部辅助函数
// ============================================

/**
 * 转换单个特性效果
 */
function convertTraitEffect(
  effect: FactionTraitEffectInput,
  trait: FactionTraitInput,
  faction: FactionInput
): UnifiedEffect | null {
  // 特殊能力类型暂不转换为属性效果
  if (effect.type === 'special_ability') {
    // 特殊能力通过其他机制触发，不在此处理
    return null;
  }
  
  // 遍历参数，为每个参数创建效果
  const params = effect.params;
  const statEffects: UnifiedEffect[] = [];
  
  for (const [paramName, paramValue] of Object.entries(params)) {
    // 跳过非数值参数
    if (typeof paramValue !== 'number') continue;
    
    // 映射到目标属性
    const targetStat = PARAM_STAT_MAP[paramName];
    if (!targetStat) {
      // 未知参数，尝试直接映射
      const mappedStat = mapStatName(paramName);
      if (mappedStat) {
        statEffects.push(createFactionEffect(
          faction.id,
          trait.id,
          paramName,
          mappedStat,
          paramValue,
          effect.type,
          faction.name,
          trait.name
        ));
      }
      continue;
    }
    
    statEffects.push(createFactionEffect(
      faction.id,
      trait.id,
      paramName,
      targetStat,
      paramValue,
      effect.type,
      faction.name,
      trait.name
    ));
  }
  
  // 如果有多个效果，返回第一个（或合并逻辑）
  return statEffects.length > 0 ? statEffects[0] : null;
}

/**
 * 转换单个特性
 */
function convertTrait(
  trait: FactionTraitInput, 
  faction: FactionInput
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const effect of trait.effects) {
    const converted = convertTraitEffect(effect, trait, faction);
    if (converted) {
      effects.push(converted);
    }
  }
  
  return effects;
}

/**
 * 创建势力效果实例
 */
function createFactionEffect(
  factionId: string,
  traitId: string,
  paramName: string,
  targetStat: CalculableStat,
  value: number,
  effectType: string,
  factionName: string,
  traitName: string
): UnifiedEffect {
  // 百分比值转换为小数（假设参数值是百分比）
  const isPercentage = effectType !== 'stat_bonus' || value < 100;
  const effectValue = isPercentage ? value / 100 : value;
  
  return createBaseEffect({
    id: generateEffectId('faction', factionId, `${traitId}_${paramName}`),
    sourceType: 'faction',
    sourceId: factionId,
    sourceName: `${factionName} - ${traitName}`,
    targetStat,
    calcType: TRAIT_EFFECT_CALC_MAP[effectType] || 'multiply',
    value: effectValue,
    priority: 'faction',
    tags: ['faction', traitId, effectType],
    duration: -1, // 永久
    dispellable: false,
    layer: 1,
  });
}

// ============================================
// 势力适配器
// ============================================

export const FactionAdapter: EffectAdapter<FactionInput> = {
  sourceType: 'faction' as EffectSourceType,
  
  convert(faction: FactionInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 遍历所有势力特性
    for (const trait of faction.traits || []) {
      const traitEffects = convertTrait(trait, faction);
      effects.push(...traitEffects);
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'faction' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined &&
           effect.priority === 'faction';
  },
};

// ============================================
// 流派适配器
// ============================================

export interface SchoolInput {
  id: string;
  name: string;
  type: string;
  worldType: string;
  traits: FactionTraitInput[];
  level?: number;
}

export const SchoolAdapter: EffectAdapter<SchoolInput> = {
  sourceType: 'school' as EffectSourceType,
  
  convert(school: SchoolInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 流派等级加成（可选）
    const levelBonus = school.level ? Math.min(school.level * 0.02, 0.5) : 0; // 每级2%，最高50%
    
    // 遍历所有流派特性
    for (const trait of school.traits || []) {
      for (const effect of trait.effects) {
        if (effect.type === 'special_ability') continue;
        
        for (const [paramName, paramValue] of Object.entries(effect.params)) {
          if (typeof paramValue !== 'number') continue;
          
          const targetStat = PARAM_STAT_MAP[paramName] || mapStatName(paramName);
          if (!targetStat) continue;
          
          // 应用流派等级加成
          const finalValue = (paramValue / 100) * (1 + levelBonus);
          
          effects.push(createBaseEffect({
            id: generateEffectId('school', school.id, `${trait.id}_${paramName}`),
            sourceType: 'school',
            sourceId: school.id,
            sourceName: `${school.name} - ${trait.name}`,
            targetStat,
            calcType: 'multiply',
            value: finalValue,
            priority: 'faction', // 流派和势力同优先级
            tags: ['school', school.type, trait.id],
            duration: -1,
            dispellable: false,
            layer: school.level || 1,
          }));
        }
      }
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'school' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined &&
           effect.priority === 'faction';
  },
};
