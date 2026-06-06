/**
 * 效果适配器基类
 * 
 * 定义所有适配器必须实现的接口
 */

import { UnifiedEffect, EffectSourceType } from '../types';
import { CalculationContext } from '../context/types';

// ============================================
// 适配器接口
// ============================================

/**
 * 效果适配器接口
 * 
 * @template T 源数据类型
 */
export interface EffectAdapter<T = unknown> {
  /** 来源类型 */
  readonly sourceType: EffectSourceType;
  
  /**
   * 将源数据转换为统一效果格式
   * 
   * @param source 源数据
   * @param context 计算上下文
   * @returns 统一效果列表
   */
  convert(source: T, context: CalculationContext): UnifiedEffect[];
  
  /**
   * 验证效果是否有效
   */
  validate?(effect: UnifiedEffect): boolean;
}

// ============================================
// 适配器工具函数
// ============================================

/**
 * 属性名称映射（从游戏中文名称到计算系统名称）
 */
export const STAT_NAME_MAP: Record<string, import('../types').CalculableStat> = {
  // 基础属性映射
  '体质': 'maxHp',
  '灵根': 'maxMp',
  '悟性': 'cultivationExp',
  '幸运': 'luck',
  '意志': 'defense',
  
  // 直接映射
  'maxHp': 'maxHp',
  'maxMp': 'maxMp',
  'attack': 'attack',
  'defense': 'defense',
  'critRate': 'critRate',
  'critDamage': 'critDamage',
  'dodgeRate': 'dodgeRate',
  'cultivationExp': 'cultivationExp',
  'breakthroughRate': 'breakthroughRate',
  'techniqueExp': 'techniqueExp',
  'expGain': 'expGain',
  'spiritStoneGain': 'spiritStoneGain',
  'dropRate': 'dropRate',
  'rarityBoost': 'rarityBoost',
  'luck': 'luck',
  'power': 'power',
};

/**
 * 映射属性名称
 */
export function mapStatName(name: string): import('../types').CalculableStat {
  return STAT_NAME_MAP[name] || 'luck';
}

/**
 * 生成唯一效果ID
 */
export function generateEffectId(
  sourceType: EffectSourceType,
  sourceId: string,
  suffix?: string
): string {
  const parts = [sourceType, sourceId];
  if (suffix) parts.push(suffix);
  return parts.join('_');
}

/**
 * 创建基础效果对象
 */
export function createBaseEffect(params: {
  id: string;
  sourceType: EffectSourceType;
  sourceId: string;
  sourceName: string;
  targetStat: import('../types').CalculableStat;
  calcType: import('../types').EffectCalcType;
  value: number;
  priority: import('../types').EffectPriority;
  tags?: string[];
  duration?: number;
  dispellable?: boolean;
  layer?: number;
}): UnifiedEffect {
  return {
    id: params.id,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    sourceName: params.sourceName,
    targetStat: params.targetStat,
    calcType: params.calcType,
    value: params.value,
    priority: params.priority,
    tags: params.tags || [],
    duration: params.duration ?? -1,
    remainingDuration: params.duration ?? -1,
    dispellable: params.dispellable ?? false,
    layer: params.layer ?? 1,
  };
}
