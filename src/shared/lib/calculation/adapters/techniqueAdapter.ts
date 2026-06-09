/**
 * 功法效果适配器
 * 
 * 将功法数据转换为统一效果格式
 */

import { CalculationContext, TechniqueInput } from '../context/types';
import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { EffectAdapter, createBaseEffect, generateEffectId } from './base';

// ============================================
// 功法适配器
// ============================================

export const TechniqueAdapter: EffectAdapter<TechniqueInput> = {
  sourceType: 'technique' as EffectSourceType,
  
  convert(technique: TechniqueInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 根据功法类型决定目标属性
    const targetStat: CalculableStat = technique.type === 'attack' ? 'attack' : 'defense';
    
    // 功法威力转换为属性加成（使用乘法）
    if (technique.bonus > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('technique', technique.id, 'bonus'),
        sourceType: 'technique',
        sourceId: technique.id,
        sourceName: technique.name,
        targetStat: targetStat,
        calcType: 'multiply',
        value: technique.bonus / 100, // 转换为小数（如 20% -> 0.2）
        priority: 'passive',
        tags: ['technique', technique.type, technique.rarity, technique.element],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    // 功法威力影响战力
    if (technique.power > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('technique', technique.id, 'power'),
        sourceType: 'technique',
        sourceId: technique.id,
        sourceName: technique.name,
        targetStat: 'power',
        calcType: 'add',
        value: technique.power,
        priority: 'passive',
        tags: ['technique', technique.type, technique.rarity],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'technique' && 
           effect.value >= 0 &&
           effect.targetStat !== undefined;
  },
};
