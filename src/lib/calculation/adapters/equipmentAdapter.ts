/**
 * 装备效果适配器
 * 
 * 将装备数据转换为统一效果格式
 */

import { CalculationContext, EquipmentInput } from '../context/types';
import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority } from '../types';
import { EffectAdapter, createBaseEffect, generateEffectId } from './base';

// ============================================
// 装备适配器
// ============================================

export const EquipmentAdapter: EffectAdapter<EquipmentInput> = {
  sourceType: 'equipment' as EffectSourceType,
  
  convert(equipment: EquipmentInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 攻击力加成
    if (equipment.attackBonus > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('equipment', equipment.id, 'attack'),
        sourceType: 'equipment',
        sourceId: equipment.id,
        sourceName: equipment.name,
        targetStat: 'attack',
        calcType: 'add',
        value: equipment.attackBonus,
        priority: 'passive',
        tags: ['equipment', equipment.slot, equipment.rarity],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    // 防御力加成
    if (equipment.defenseBonus > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('equipment', equipment.id, 'defense'),
        sourceType: 'equipment',
        sourceId: equipment.id,
        sourceName: equipment.name,
        targetStat: 'defense',
        calcType: 'add',
        value: equipment.defenseBonus,
        priority: 'passive',
        tags: ['equipment', equipment.slot, equipment.rarity],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    // 装备威力影响战力
    if (equipment.power > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('equipment', equipment.id, 'power'),
        sourceType: 'equipment',
        sourceId: equipment.id,
        sourceName: equipment.name,
        targetStat: 'power',
        calcType: 'add',
        value: equipment.power,
        priority: 'passive',
        tags: ['equipment', equipment.slot, equipment.rarity],
        duration: -1,
        dispellable: false,
        layer: 1,
      }));
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'equipment' && 
           effect.value > 0 &&
           effect.targetStat !== undefined;
  },
};
