/**
 * 统一计算器
 * 
 * 提供完整的数值计算入口，整合上下文构建、效果收集、计算处理
 */

import { createLogger } from '@/core/logger';

import {
  AllAdapters,
  EquipmentAdapter,
  TechniqueAdapter,
  WorldDangerAdapter,
  WorldOpportunityAdapter,
  PillAdapter,
  TitleAdapter,
  BuffAdapter,
  RealmAdapter,
} from '../adapters';
import { BoundaryChecker } from '../boundary';
import { getStatBounds, ENABLE_EFFECT_TRACING } from '../constants';
import { ContextBuilder } from '../context/builder';
import { CalculationContext } from '../context/types';
import { EffectRegistry, EffectProcessor } from '../effect';
import {
  CalculableStat,
  UnifiedEffect,
  StatCalculationResult,
  CalculationResult,
  EffectSourceType,
} from '../types';

/** Calculation 日志记录器 */
const log = createLogger('Calculation');

// ============================================
// 统一计算器
// ============================================

export class UnifiedCalculator {
  private contextBuilder: ContextBuilder;
  private registry: EffectRegistry;
  private processor: EffectProcessor;
  
  constructor() {
    this.contextBuilder = new ContextBuilder();
    this.registry = new EffectRegistry();
    this.processor = new EffectProcessor(this.registry);
  }
  
  /**
   * 计算单个属性
   */
  calculateStat(
    context: CalculationContext,
    stat: CalculableStat,
    baseValue: number
  ): StatCalculationResult {
    // 收集效果
    this.collectEffects(context);
    
    // 计算
    return this.processor.calculateStat(stat, baseValue);
  }
  
  /**
   * 批量计算多个属性
   */
  calculateStats(
    context: CalculationContext,
    baseValues: Map<CalculableStat, number>
  ): CalculationResult {
    const startTime = Date.now();
    const calculationId = context.calculationId;
    
    // 收集效果
    this.collectEffects(context);
    
    // 计算所有属性
    const stats = new Map<CalculableStat, StatCalculationResult>();
    const globalWarnings: string[] = [];
    
    for (const [stat, baseValue] of baseValues) {
      const result = this.processor.calculateStat(stat, baseValue);
      stats.set(stat, result);
      
      if (result.warnings.length > 0) {
        globalWarnings.push(`[${stat}] ${result.warnings.join(', ')}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      calculationId,
      timestamp: context.timestamp,
      stats,
      globalWarnings,
      duration,
    };
  }
  
  /**
   * 计算战斗属性
   */
  calculateCombatStats(context: CalculationContext): CalculationResult {
    const baseValues = this.extractCombatBaseValues(context);
    return this.calculateStats(context, baseValues);
  }
  
  /**
   * 计算经济属性
   */
  calculateEconomyStats(context: CalculationContext): CalculationResult {
    const baseValues = this.extractEconomyBaseValues(context);
    return this.calculateStats(context, baseValues);
  }
  
  /**
   * 计算所有属性
   */
  calculateAllStats(context: CalculationContext): CalculationResult {
    const baseValues = this.extractAllBaseValues(context);
    return this.calculateStats(context, baseValues);
  }
  
  /**
   * 清空效果注册表
   */
  clear(): void {
    this.registry.clear();
  }
  
  // ============================================
  // 私有方法
  // ============================================
  
  /**
   * 收集所有效果
   */
  private collectEffects(context: CalculationContext): void {
    // 清空旧效果
    this.registry.clear();
    
    // 收集装备效果
    const equipmentSlots = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'] as const;
    for (const slot of equipmentSlots) {
      const equipment = context.equipment[slot];
      if (equipment) {
        const effects = EquipmentAdapter.convert(equipment, context);
        this.registry.registerAll(effects);
      }
    }
    
    // 收集功法效果
    for (const technique of context.techniques) {
      const effects = TechniqueAdapter.convert(technique, context);
      this.registry.registerAll(effects);
    }
    
    // 收集世界危险效果
    for (const danger of context.world.dangers) {
      const effects = WorldDangerAdapter.convert(danger, context);
      this.registry.registerAll(effects);
    }
    
    // 收集世界机缘效果
    for (const opportunity of context.world.opportunities) {
      const effects = WorldOpportunityAdapter.convert(opportunity, context);
      this.registry.registerAll(effects);
    }
    
    // 收集丹药效果
    for (const activeEffect of context.state.activeEffects) {
      if (activeEffect.remainingCount > 0) {
        const effects = PillAdapter.convert(activeEffect, context);
        this.registry.registerAll(effects);
      }
    }
    
    // 收集称号效果
    for (const title of context.titles) {
      const effects = TitleAdapter.convert(title, context);
      this.registry.registerAll(effects);
    }
    
    // 收集Buff效果
    for (const buff of context.state.activeBuffs) {
      if (buff.remainingDuration > 0) {
        const effects = BuffAdapter.convert(buff, context);
        this.registry.registerAll(effects);
      }
    }
    
    // 收集境界效果
    const realmEffects = RealmAdapter.convert(context.realm, context);
    this.registry.registerAll(realmEffects);
    
    // 日志
    if (ENABLE_EFFECT_TRACING) {
      log.info(`收集效果: ${this.registry.size} 个`);
    }
  }
  
  /**
   * 提取战斗基础值
   */
  private extractCombatBaseValues(context: CalculationContext): Map<CalculableStat, number> {
    const { baseStats } = context.character;
    
    return new Map([
      ['maxHp', 100 + baseStats.体质 * 10 + context.character.level * 5],
      ['maxMp', 50 + baseStats.灵根 * 5 + context.character.level * 3],
      ['attack', 10 + baseStats.体质 * 2 + context.character.level],
      ['defense', 5 + baseStats.意志 + context.character.level * 0.5],
      ['critRate', 0.05 + baseStats.幸运 * 0.005],
      ['critDamage', 1.5],
      ['dodgeRate', 0.03 + baseStats.幸运 * 0.003],
    ]);
  }
  
  /**
   * 提取经济基础值
   */
  private extractEconomyBaseValues(context: CalculationContext): Map<CalculableStat, number> {
    return new Map([
      ['expGain', 1.0],
      ['spiritStoneGain', 1.0],
      ['dropRate', 1.0],
      ['rarityBoost', 0],
    ]);
  }
  
  /**
   * 提取所有基础值
   */
  private extractAllBaseValues(context: CalculationContext): Map<CalculableStat, number> {
    const combatValues = this.extractCombatBaseValues(context);
    const economyValues = this.extractEconomyBaseValues(context);
    const cultivationValues = new Map<CalculableStat, number>([
      ['cultivationExp', 1.0],
      ['breakthroughRate', 0.5],
      ['techniqueExp', 1.0],
      ['luck', context.character.baseStats.幸运],
      ['power', 0],
    ]);
    
    const result = new Map<CalculableStat, number>();
    for (const [k, v] of combatValues) result.set(k, v);
    for (const [k, v] of economyValues) result.set(k, v);
    for (const [k, v] of cultivationValues) result.set(k, v);
    
    return result;
  }
}

// ============================================
// 便捷函数
// ============================================

/** 全局计算器实例 */
let globalCalculator: UnifiedCalculator | null = null;

/**
 * 获取全局计算器实例
 */
export function getCalculator(): UnifiedCalculator {
  if (!globalCalculator) {
    globalCalculator = new UnifiedCalculator();
  }
  return globalCalculator;
}

/**
 * 快速计算单个属性
 */
export function quickCalculate(
  context: CalculationContext,
  stat: CalculableStat,
  baseValue: number
): StatCalculationResult {
  return getCalculator().calculateStat(context, stat, baseValue);
}

/**
 * 快速计算战斗属性
 */
export function quickCalculateCombat(context: CalculationContext): CalculationResult {
  return getCalculator().calculateCombatStats(context);
}
