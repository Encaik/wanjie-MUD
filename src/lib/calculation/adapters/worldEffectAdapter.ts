/**
 * 世界效果适配器
 * 
 * 将世界危险/机缘数据转换为统一效果格式
 */

import { CalculationContext, WorldEffectInput } from '../context/types';
import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { EffectAdapter, createBaseEffect, generateEffectId, mapStatName } from './base';

// ============================================
// 世界危险适配器
// ============================================

export const WorldDangerAdapter: EffectAdapter<WorldEffectInput> = {
  sourceType: 'world_danger' as EffectSourceType,
  
  convert(danger: WorldEffectInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 属性修改效果
    if (danger.statModifications) {
      for (const [stat, value] of Object.entries(danger.statModifications)) {
        if (value === undefined || value === 0) continue;
        
        effects.push(createBaseEffect({
          id: generateEffectId('world_danger', danger.id, `stat_${stat}`),
          sourceType: 'world_danger',
          sourceId: danger.id,
          sourceName: danger.name,
          targetStat: mapStatName(stat),
          calcType: 'add',
          value: value, // 负值表示削弱
          priority: 'world',
          tags: ['danger', `level_${danger.level}`],
          duration: -1,
          dispellable: false,
          layer: danger.level,
        }));
      }
    }
    
    // 敌人增益效果（特殊处理）
    if (danger.enemyBuffs) {
      // 敌人增益标记为特殊效果，用于战斗时应用
      if (danger.enemyBuffs.attackBonus) {
        effects.push(createBaseEffect({
          id: generateEffectId('world_danger', danger.id, 'enemy_attack'),
          sourceType: 'world_danger',
          sourceId: danger.id,
          sourceName: danger.name,
          targetStat: 'attack',
          calcType: 'multiply',
          value: danger.enemyBuffs.attackBonus,
          priority: 'special',
          tags: ['danger', 'enemy_buff', `level_${danger.level}`],
          duration: -1,
          dispellable: false,
          layer: danger.level,
        }));
      }
      
      if (danger.enemyBuffs.defenseBonus) {
        effects.push(createBaseEffect({
          id: generateEffectId('world_danger', danger.id, 'enemy_defense'),
          sourceType: 'world_danger',
          sourceId: danger.id,
          sourceName: danger.name,
          targetStat: 'defense',
          calcType: 'multiply',
          value: danger.enemyBuffs.defenseBonus,
          priority: 'special',
          tags: ['danger', 'enemy_buff', `level_${danger.level}`],
          duration: -1,
          dispellable: false,
          layer: danger.level,
        }));
      }
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'world_danger' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};

// ============================================
// 世界机缘适配器
// ============================================

export const WorldOpportunityAdapter: EffectAdapter<WorldEffectInput> = {
  sourceType: 'world_opportunity' as EffectSourceType,
  
  convert(opportunity: WorldEffectInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 属性修改效果
    if (opportunity.statModifications) {
      for (const [stat, value] of Object.entries(opportunity.statModifications)) {
        if (value === undefined || value === 0) continue;
        
        effects.push(createBaseEffect({
          id: generateEffectId('world_opportunity', opportunity.id, `stat_${stat}`),
          sourceType: 'world_opportunity',
          sourceId: opportunity.id,
          sourceName: opportunity.name,
          targetStat: mapStatName(stat),
          calcType: 'add',
          value: value,
          priority: 'world',
          tags: ['opportunity', `level_${opportunity.level}`],
          duration: -1,
          dispellable: false,
          layer: opportunity.level,
        }));
      }
    }
    
    // 资源获取效果
    if (opportunity.resourceModifications) {
      // 这些是即时效果，通过特殊方式处理
      // 暂不转换为属性效果
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'world_opportunity' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};
