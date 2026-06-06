/**
 * 效果处理器
 * 
 * 负责效果的排序、分组、计算等核心逻辑
 */

import {
  UnifiedEffect,
  CalculableStat,
  AggregatedEffects,
  StatCalculationResult,
  EffectContribution,
} from '../types';
import { PRIORITY_ORDER, LOG_PREFIX, getStatBounds } from '../constants';
import { BoundaryChecker, SafeMath } from '../boundary';
import { EffectRegistry } from './registry';

// ============================================
// 效果处理器
// ============================================

export class EffectProcessor {
  private registry: EffectRegistry;
  
  constructor(registry: EffectRegistry) {
    this.registry = registry;
  }
  
  /**
   * 计算单个属性的最终值
   */
  calculateStat(stat: CalculableStat, baseValue: number): StatCalculationResult {
    const contributions: EffectContribution[] = [];
    const warnings: string[] = [];
    
    // 获取聚合效果
    const aggregated = this.registry.aggregateByStat(stat);
    
    // 第一步：应用加法效果
    let currentValue = baseValue;
    let addSum = 0;
    
    for (const effect of aggregated.additives) {
      if (!this.checkCondition(effect)) continue;
      
      addSum = SafeMath.add(addSum, effect.value);
      contributions.push({
        sourceType: effect.sourceType,
        sourceName: effect.sourceName,
        calcType: 'add',
        value: effect.value,
        contribution: effect.value,
        effectId: effect.id,
      });
    }
    currentValue = SafeMath.add(currentValue, addSum);
    
    // 第二步：应用乘法效果
    let multiplyRatio = 0;
    
    for (const effect of aggregated.multipliers) {
      if (!this.checkCondition(effect)) continue;
      
      multiplyRatio = SafeMath.add(multiplyRatio, effect.value);
      contributions.push({
        sourceType: effect.sourceType,
        sourceName: effect.sourceName,
        calcType: 'multiply',
        value: effect.value,
        contribution: currentValue * effect.value, // 近似贡献
        effectId: effect.id,
      });
    }
    currentValue = SafeMath.multiply(currentValue, 1 + multiplyRatio);
    
    // 第三步：应用链式效果
    for (const effect of aggregated.chains) {
      if (!this.checkCondition(effect)) continue;
      
      const beforeValue = currentValue;
      currentValue = SafeMath.multiply(currentValue, effect.value);
      contributions.push({
        sourceType: effect.sourceType,
        sourceName: effect.sourceName,
        calcType: 'chain',
        value: effect.value,
        contribution: currentValue - beforeValue,
        effectId: effect.id,
      });
    }
    
    // 第四步：应用覆盖效果（取最大值或最小值）
    if (aggregated.overrides.length > 0) {
      const validOverrides = aggregated.overrides.filter(e => this.checkCondition(e));
      if (validOverrides.length > 0) {
        // 默认取最大值
        const maxValue = Math.max(...validOverrides.map(e => e.value));
        const overrideEffect = validOverrides.find(e => e.value === maxValue);
        
        if (overrideEffect) {
          contributions.push({
            sourceType: overrideEffect.sourceType,
            sourceName: overrideEffect.sourceName,
            calcType: 'override',
            value: overrideEffect.value,
            contribution: overrideEffect.value - currentValue,
            effectId: overrideEffect.id,
          });
        }
        
        currentValue = maxValue;
      }
    }
    
    // 第五步：边界约束
    const bounds = getStatBounds(stat);
    const preClampValue = currentValue;
    const finalValue = BoundaryChecker.clamp(currentValue, bounds);
    
    const clamping = {
      applied: preClampValue !== finalValue,
      lowerBound: bounds.min,
      upperBound: bounds.max,
    };
    
    if (clamping.applied && process.env.NODE_ENV === 'development') {
      warnings.push(`值 ${preClampValue} 被截断到 ${finalValue}`);
    }
    
    // 生成公式描述
    const formulaDescription = this.generateFormulaDescription(
      baseValue,
      addSum,
      multiplyRatio,
      aggregated.chains.length,
      aggregated.overrides.length > 0
    );
    
    return {
      stat,
      finalValue,
      baseValue,
      preClampValue,
      clamping,
      contributions,
      formulaDescription,
      warnings,
    };
  }
  
  /**
   * 检查效果条件
   */
  private checkCondition(effect: UnifiedEffect): boolean {
    if (!effect.condition) return true;
    
    // TODO: 根据上下文检查条件
    // 这里先返回 true，实际实现时需要访问 CalculationContext
    return true;
  }
  
  /**
   * 生成公式描述
   */
  private generateFormulaDescription(
    baseValue: number,
    addSum: number,
    multiplyRatio: number,
    chainCount: number,
    hasOverride: boolean
  ): string {
    const parts: string[] = [`基础值=${baseValue}`];
    
    if (addSum !== 0) {
      parts.push(`加法=${addSum > 0 ? '+' : ''}${addSum}`);
    }
    
    if (multiplyRatio !== 0) {
      const percent = (multiplyRatio * 100).toFixed(1);
      parts.push(`乘法=×${(1 + multiplyRatio).toFixed(2)}(+${percent}%)`);
    }
    
    if (chainCount > 0) {
      parts.push(`链式×${chainCount}个效果`);
    }
    
    if (hasOverride) {
      parts.push('覆盖效果');
    }
    
    return parts.join(' → ');
  }
  
  /**
   * 批量计算多个属性
   */
  calculateStats(
    stats: CalculableStat[],
    baseValues: Map<CalculableStat, number>
  ): Map<CalculableStat, StatCalculationResult> {
    const results = new Map<CalculableStat, StatCalculationResult>();
    
    for (const stat of stats) {
      const baseValue = baseValues.get(stat) ?? getStatBounds(stat).defaultValue;
      results.set(stat, this.calculateStat(stat, baseValue));
    }
    
    return results;
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建效果处理器实例
 */
export function createEffectProcessor(registry: EffectRegistry): EffectProcessor {
  return new EffectProcessor(registry);
}
