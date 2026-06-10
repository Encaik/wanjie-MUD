/**
 * 效果注册表
 * 
 * 管理所有已注册的效果，提供索引和查询功能
 */

import { createLogger } from '@/core/logger';

import { MAX_ACTIVE_EFFECTS, PRIORITY_ORDER } from '../constants';
import {
  UnifiedEffect,
  CalculableStat,
  EffectSourceType,
  EffectPriority,
  AggregatedEffects,
} from '../types';

/** Calculation 日志记录器 */
const log = createLogger('Calculation');

// ============================================
// 效果注册表
// ============================================

export class EffectRegistry {
  /** 已注册效果列表 */
  private effects: UnifiedEffect[] = [];
  
  /** 效果索引（按目标属性） */
  private indexByStat: Map<CalculableStat, UnifiedEffect[]> = new Map();
  
  /** 效果索引（按来源类型） */
  private indexBySource: Map<EffectSourceType, UnifiedEffect[]> = new Map();
  
  /** 效果索引（按优先级） */
  private indexByPriority: Map<EffectPriority, UnifiedEffect[]> = new Map();
  
  /**
   * 注册效果
   */
  register(effect: UnifiedEffect): void {
    // 检查数量限制
    if (this.effects.length >= MAX_ACTIVE_EFFECTS) {
      if (process.env.NODE_ENV === 'development') {
        log.warn(`效果数量已达上限 ${MAX_ACTIVE_EFFECTS}`);
      }
      return;
    }
    
    // 检查重复ID
    if (this.has(effect.id)) {
      if (process.env.NODE_ENV === 'development') {
        log.warn(`效果已存在: ${effect.id}, 更新效果`);
      }
      this.unregister(effect.id);
    }
    
    // 添加效果
    this.effects.push(effect);
    
    // 更新索引
    this.addToIndex(effect);
  }
  
  /**
   * 批量注册效果
   */
  registerAll(effects: UnifiedEffect[]): void {
    for (const effect of effects) {
      this.register(effect);
    }
  }
  
  /**
   * 注销效果
   */
  unregister(effectId: string): boolean {
    const index = this.effects.findIndex(e => e.id === effectId);
    if (index === -1) return false;
    
    const effect = this.effects[index];
    this.effects.splice(index, 1);
    
    // 更新索引
    this.removeFromIndex(effect);
    
    return true;
  }
  
  /**
   * 清空所有效果
   */
  clear(): void {
    this.effects = [];
    this.indexByStat.clear();
    this.indexBySource.clear();
    this.indexByPriority.clear();
  }
  
  /**
   * 检查效果是否存在
   */
  has(effectId: string): boolean {
    return this.effects.some(e => e.id === effectId);
  }
  
  /**
   * 获取效果
   */
  get(effectId: string): UnifiedEffect | undefined {
    return this.effects.find(e => e.id === effectId);
  }
  
  /**
   * 获取所有效果
   */
  getAll(): UnifiedEffect[] {
    return [...this.effects];
  }
  
  /**
   * 获取效果数量
   */
  get size(): number {
    return this.effects.length;
  }
  
  /**
   * 按目标属性获取效果
   */
  getByStat(stat: CalculableStat): UnifiedEffect[] {
    return this.indexByStat.get(stat) || [];
  }
  
  /**
   * 按来源类型获取效果
   */
  getBySource(sourceType: EffectSourceType): UnifiedEffect[] {
    return this.indexBySource.get(sourceType) || [];
  }
  
  /**
   * 按优先级获取效果
   */
  getByPriority(priority: EffectPriority): UnifiedEffect[] {
    return this.indexByPriority.get(priority) || [];
  }
  
  /**
   * 获取排序后的效果（按优先级）
   */
  getSorted(): UnifiedEffect[] {
    return [...this.effects].sort((a, b) => {
      // 先按优先级排序
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 同优先级按层级排序
      const layerDiff = a.layer - b.layer;
      if (layerDiff !== 0) return layerDiff;
      
      // 同层级按ID排序（保证稳定性）
      return a.id.localeCompare(b.id);
    });
  }
  
  /**
   * 按目标属性聚合效果
   */
  aggregateByStat(stat: CalculableStat): AggregatedEffects {
    const effects = this.getByStat(stat);
    
    const aggregated: AggregatedEffects = {
      additives: [],
      multipliers: [],
      overrides: [],
      chains: [],
    };
    
    for (const effect of effects) {
      switch (effect.calcType) {
        case 'add':
          aggregated.additives.push(effect);
          break;
        case 'multiply':
          aggregated.multipliers.push(effect);
          break;
        case 'override':
          aggregated.overrides.push(effect);
          break;
        case 'chain':
          aggregated.chains.push(effect);
          break;
      }
    }
    
    // 每组内按优先级排序
    const sortFn = (a: UnifiedEffect, b: UnifiedEffect) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.layer - b.layer;
    };
    
    aggregated.additives.sort(sortFn);
    aggregated.multipliers.sort(sortFn);
    aggregated.overrides.sort(sortFn);
    aggregated.chains.sort(sortFn);
    
    return aggregated;
  }
  
  // ============================================
  // 私有方法
  // ============================================
  
  private addToIndex(effect: UnifiedEffect): void {
    // 按属性索引
    const statEffects = this.indexByStat.get(effect.targetStat) || [];
    statEffects.push(effect);
    this.indexByStat.set(effect.targetStat, statEffects);
    
    // 按来源索引
    const sourceEffects = this.indexBySource.get(effect.sourceType) || [];
    sourceEffects.push(effect);
    this.indexBySource.set(effect.sourceType, sourceEffects);
    
    // 按优先级索引
    const priorityEffects = this.indexByPriority.get(effect.priority) || [];
    priorityEffects.push(effect);
    this.indexByPriority.set(effect.priority, priorityEffects);
  }
  
  private removeFromIndex(effect: UnifiedEffect): void {
    // 从属性索引移除
    const statEffects = this.indexByStat.get(effect.targetStat);
    if (statEffects) {
      const index = statEffects.findIndex(e => e.id === effect.id);
      if (index !== -1) statEffects.splice(index, 1);
    }
    
    // 从来源索引移除
    const sourceEffects = this.indexBySource.get(effect.sourceType);
    if (sourceEffects) {
      const index = sourceEffects.findIndex(e => e.id === effect.id);
      if (index !== -1) sourceEffects.splice(index, 1);
    }
    
    // 从优先级索引移除
    const priorityEffects = this.indexByPriority.get(effect.priority);
    if (priorityEffects) {
      const index = priorityEffects.findIndex(e => e.id === effect.id);
      if (index !== -1) priorityEffects.splice(index, 1);
    }
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建效果注册表实例
 */
export function createEffectRegistry(): EffectRegistry {
  return new EffectRegistry();
}
