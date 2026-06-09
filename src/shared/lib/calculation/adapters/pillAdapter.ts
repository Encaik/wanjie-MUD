/**
 * 丹药效果适配器
 * 
 * 将丹药效果数据转换为统一效果格式
 */

import { CalculationContext, ActiveEffectInput } from '../context/types';
import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { EffectAdapter, createBaseEffect, generateEffectId } from './base';

// ============================================
// 丹药效果类型映射
// ============================================

/** 丹药效果类型到目标属性的映射 */
const PILL_EFFECT_STAT_MAP: Record<string, CalculableStat> = {
  'stat_boost': 'luck',           // 属性增益 -> 幸运
  'cultivation_boost': 'cultivationExp', // 修炼增益
  'combat_boost': 'attack',        // 战斗增益 -> 攻击力
  'luck_boost': 'luck',            // 幸运增益
  'breakthrough_boost': 'breakthroughRate', // 突破增益
  'restore': 'maxHp',              // 恢复效果
  'restore_hp': 'maxHp',           // HP恢复
  'restore_mp': 'maxMp',           // MP恢复
};

// ============================================
// 丹药适配器
// ============================================

export const PillAdapter: EffectAdapter<ActiveEffectInput> = {
  sourceType: 'pill' as EffectSourceType,
  
  convert(activeEffect: ActiveEffectInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 获取目标属性
    const targetStat = PILL_EFFECT_STAT_MAP[activeEffect.type] || 'luck';
    
    // 根据效果类型决定计算方式
    let calcType: EffectCalcType = 'multiply';
    let value = activeEffect.value;
    
    // 增益类效果使用乘法
    if (['stat_boost', 'cultivation_boost', 'combat_boost', 'luck_boost', 'breakthrough_boost'].includes(activeEffect.type)) {
      calcType = 'multiply';
      value = activeEffect.value / 100; // 转换为小数
    }
    
    // 恢复类效果是即时效果，转换为临时的最大值加成
    if (['restore', 'restore_hp', 'restore_mp'].includes(activeEffect.type)) {
      calcType = 'add';
      // 恢复效果不作为属性加成，这里标记但不实际应用
      return []; // 恢复效果即时结算，不加入属性计算
    }
    
    effects.push(createBaseEffect({
      id: generateEffectId('pill', activeEffect.itemId, activeEffect.type),
      sourceType: 'pill',
      sourceId: activeEffect.itemId,
      sourceName: activeEffect.itemName,
      targetStat: targetStat,
      calcType: calcType,
      value: value,
      priority: 'buff',
      tags: ['pill', activeEffect.type],
      duration: activeEffect.remainingCount,
      dispellable: true,
      layer: 1,
    }));
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'pill' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};
