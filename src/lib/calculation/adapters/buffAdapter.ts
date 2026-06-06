/**
 * Buff效果适配器
 * 
 * 将战斗Buff数据转换为统一效果格式
 */

import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { CalculationContext, BuffInput } from '../context/types';
import { EffectAdapter, createBaseEffect, generateEffectId, mapStatName } from './base';

// ============================================
// Buff效果类型映射
// ============================================

const BUFF_TYPE_STAT_MAP: Record<string, CalculableStat> = {
  'attack': 'attack',
  'defense': 'defense',
  'crit': 'critRate',
  'dodge': 'dodgeRate',
  'speed': 'luck',
  'hp_regen': 'maxHp',
  'mp_regen': 'maxMp',
};

// ============================================
// Buff适配器
// ============================================

export const BuffAdapter: EffectAdapter<BuffInput> = {
  sourceType: 'buff' as EffectSourceType,
  
  convert(buff: BuffInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 获取目标属性
    let targetStat: CalculableStat = 'luck';
    if (buff.targetStat) {
      targetStat = mapStatName(buff.targetStat);
    } else if (BUFF_TYPE_STAT_MAP[buff.type]) {
      targetStat = BUFF_TYPE_STAT_MAP[buff.type];
    }
    
    // Buff通常是百分比加成
    let calcType: EffectCalcType = 'multiply';
    let value = buff.value;
    
    // 如果值大于1，可能是百分比形式
    if (Math.abs(value) > 1) {
      value = value / 100;
    }
    
    effects.push(createBaseEffect({
      id: generateEffectId('buff', buff.id, buff.type),
      sourceType: 'buff',
      sourceId: buff.id,
      sourceName: buff.name,
      targetStat: targetStat,
      calcType: calcType,
      value: value,
      priority: 'buff',
      tags: ['buff', buff.type],
      duration: buff.duration,
      dispellable: true,
      layer: 1,
    }));
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'buff' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};
