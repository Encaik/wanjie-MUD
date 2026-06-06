/**
 * 境界效果适配器
 * 
 * 将境界加成转换为统一效果格式
 */

import { UnifiedEffect, EffectSourceType, EffectCalcType, EffectPriority, CalculableStat } from '../types';
import { CalculationContext, RealmInput } from '../context/types';
import { EffectAdapter, createBaseEffect, generateEffectId } from './base';

// ============================================
// 境界加成配置
// ============================================

/** 境界等级到加成比例的映射 */
const REALM_BONUS_CONFIG: Record<number, {
  allStats: number;    // 全属性加成比例
  power: number;       // 战力加成
}> = {
  1: { allStats: 0, power: 100 },      // 炼气
  2: { allStats: 0.05, power: 200 },   // 筑基
  3: { allStats: 0.10, power: 400 },   // 金丹
  4: { allStats: 0.15, power: 800 },   // 元婴
  5: { allStats: 0.20, power: 1500 },  // 化神
  6: { allStats: 0.25, power: 3000 },  // 炼虚
  7: { allStats: 0.30, power: 6000 },  // 合体
  8: { allStats: 0.35, power: 12000 }, // 大乘
  9: { allStats: 0.40, power: 25000 }, // 渡劫
  10: { allStats: 0.50, power: 50000 }, // 仙人
};

/** 受境界影响的属性列表 */
const REALM_AFFECTED_STATS: CalculableStat[] = [
  'attack',
  'defense',
  'maxHp',
  'maxMp',
];

// ============================================
// 境界适配器
// ============================================

export const RealmAdapter: EffectAdapter<RealmInput> = {
  sourceType: 'realm' as EffectSourceType,
  
  convert(realm: RealmInput, context: CalculationContext): UnifiedEffect[] {
    const effects: UnifiedEffect[] = [];
    
    // 获取境界配置
    const config = REALM_BONUS_CONFIG[realm.level] || REALM_BONUS_CONFIG[1];
    
    // 为每个受影响的属性添加加成
    for (const stat of REALM_AFFECTED_STATS) {
      if (config.allStats > 0) {
        effects.push(createBaseEffect({
          id: generateEffectId('realm', realm.name, stat),
          sourceType: 'realm',
          sourceId: realm.name,
          sourceName: `${realm.name}境界`,
          targetStat: stat,
          calcType: 'multiply',
          value: config.allStats,
          priority: 'passive',
          tags: ['realm', realm.name, `level_${realm.level}`],
          duration: -1,
          dispellable: false,
          layer: realm.level,
        }));
      }
    }
    
    // 战力加成
    if (config.power > 0) {
      effects.push(createBaseEffect({
        id: generateEffectId('realm', realm.name, 'power'),
        sourceType: 'realm',
        sourceId: realm.name,
        sourceName: `${realm.name}境界`,
        targetStat: 'power',
        calcType: 'add',
        value: config.power,
        priority: 'passive',
        tags: ['realm', realm.name, `level_${realm.level}`],
        duration: -1,
        dispellable: false,
        layer: realm.level,
      }));
    }
    
    return effects;
  },
  
  validate(effect: UnifiedEffect): boolean {
    return effect.sourceType === 'realm' && 
           effect.value !== undefined &&
           effect.targetStat !== undefined;
  },
};
