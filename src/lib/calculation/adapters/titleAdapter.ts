/**
 * 称号效果适配器
 * 
 * 将称号数据转换为统一效果格式
 */

import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { CalculationContext, TitleInput, TitleEffectInput } from '../context/types';
import { EffectAdapter, createBaseEffect, generateEffectId, mapStatName } from './base';

// ============================================
// 称号适配器
// ============================================

export const TitleAdapter: EffectAdapter<TitleInput> = {
  sourceType: 'title' as EffectSourceType,
  
  convert(title: TitleInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    for (let i = 0; i < title.effects.length; i++) {
      const titleEffect = title.effects[i];
      
      // 获取目标属性
      const targetStat = mapStatName(titleEffect.targetStat);
      
      // 获取计算类型
      let calcType: EffectCalcType = 'add';
      if (titleEffect.calcType === 'multiply' || titleEffect.calcType === 'multiply') {
        calcType = 'multiply';
      } else if (titleEffect.calcType === 'override') {
        calcType = 'override';
      }
      
      // 转换值
      let value = titleEffect.value;
      if (calcType === 'multiply' && Math.abs(value) > 1) {
        // 如果值大于1，可能是百分比形式
        value = value / 100;
      }
      
      effects.push(createBaseEffect({
        id: generateEffectId('title', title.id, `effect_${i}`),
        sourceType: 'title',
        sourceId: title.id,
        sourceName: title.name,
        targetStat: targetStat,
        calcType: calcType,
        value: value,
        priority: 'passive',
        tags: ['title', title.rarity],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'title' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};
