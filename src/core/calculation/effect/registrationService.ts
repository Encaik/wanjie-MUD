/**
 * 效果注册服务
 * 
 * 统一管理所有效果的注册、注销、查询等操作
 * 支持按来源类型批量注册和注销
 */

import { createLogger } from '@/core/logger';

import { EffectRegistry } from './registry';
import { getAdapter, AllAdapters } from '../adapters';
import { CalculationContext } from '../context/types';
import { UnifiedEffect, EffectSourceType, CalculableStat } from '../types';

/** Calculation 日志记录器 */
const log = createLogger('Calculation');

// ============================================
// 注册结果类型
// ============================================

/** 单次注册结果 */
export interface RegistrationResult {
  success: boolean;
  registeredCount: number;
  effects: UnifiedEffect[];
  errors: string[];
}

/** 批量注册结果 */
export interface BatchRegistrationResult {
  success: boolean;
  totalRegistered: number;
  results: Map<string, RegistrationResult>;
  errors: string[];
}

/** 注销结果 */
export interface UnregistrationResult {
  success: boolean;
  unregisteredCount: number;
  errors: string[];
}

// ============================================
// 效果注册服务
// ============================================

export class EffectRegistrationService {
  private registry: EffectRegistry;
  private sourceIndex: Map<EffectSourceType, Set<string>> = new Map();
  
  constructor(registry: EffectRegistry) {
    this.registry = registry;
  }
  
  // ============================================
  // 单来源注册
  // ============================================
  
  /**
   * 注册世界效果（危险和机缘）
   */
  registerWorldEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    // 注册世界危险效果
    for (const danger of context.world.dangers || []) {
      try {
        const adapter = getAdapter('world_danger');
        if (adapter) {
          const converted = adapter.convert(danger as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换世界危险效果失败 [${danger.id}]: ${e}`);
      }
    }
    
    // 注册世界机缘效果
    for (const opportunity of context.world.opportunities || []) {
      try {
        const adapter = getAdapter('world_opportunity');
        if (adapter) {
          const converted = adapter.convert(opportunity as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换世界机缘效果失败 [${opportunity.id}]: ${e}`);
      }
    }
    
    // 注册到注册表
    this.registerEffects(effects, 'world_danger');
    this.registerEffects(effects, 'world_opportunity');
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册势力效果
   */
  registerFactionEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    if (!context.faction) {
      return { success: true, registeredCount: 0, effects: [], errors: [] };
    }
    
    try {
      const adapter = getAdapter('faction');
      if (adapter) {
        const converted = adapter.convert(context.faction as any, context);
        effects.push(...converted);
        
        // 注册到注册表
        this.registerEffects(effects, 'faction');
      }
    } catch (e) {
      errors.push(`转换势力效果失败 [${context.faction.id}]: ${e}`);
    }
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册流派效果
   */
  registerSchoolEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    if (!context.school) {
      return { success: true, registeredCount: 0, effects: [], errors: [] };
    }
    
    try {
      const adapter = getAdapter('school');
      if (adapter) {
        const converted = adapter.convert(context.school as any, context);
        effects.push(...converted);
        
        // 注册到注册表
        this.registerEffects(effects, 'school');
      }
    } catch (e) {
      errors.push(`转换流派效果失败 [${context.school.id}]: ${e}`);
    }
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册装备效果
   */
  registerEquipmentEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    const equipmentSlots = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'] as const;
    
    for (const slot of equipmentSlots) {
      const equipment = context.equipment[slot];
      if (!equipment) continue;
      
      try {
        const adapter = getAdapter('equipment');
        if (adapter) {
          const converted = adapter.convert(equipment as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换装备效果失败 [${equipment.id}]: ${e}`);
      }
    }
    
    // 注册到注册表
    this.registerEffects(effects, 'equipment');
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册功法效果
   */
  registerTechniqueEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    for (const technique of context.techniques || []) {
      try {
        const adapter = getAdapter('technique');
        if (adapter) {
          const converted = adapter.convert(technique as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换功法效果失败 [${technique.id}]: ${e}`);
      }
    }
    
    // 注册到注册表
    this.registerEffects(effects, 'technique');
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册称号效果
   */
  registerTitleEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    for (const title of context.titles || []) {
      try {
        const adapter = getAdapter('title');
        if (adapter) {
          const converted = adapter.convert(title as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换称号效果失败 [${title.id}]: ${e}`);
      }
    }
    
    // 注册到注册表
    this.registerEffects(effects, 'title');
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册Buff效果
   */
  registerBuffEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    for (const buff of context.state.activeBuffs || []) {
      try {
        const adapter = getAdapter('buff');
        if (adapter) {
          const converted = adapter.convert(buff as any, context);
          effects.push(...converted);
        }
      } catch (e) {
        errors.push(`转换Buff效果失败 [${buff.id}]: ${e}`);
      }
    }
    
    // 注册到注册表
    this.registerEffects(effects, 'buff');
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  /**
   * 注册境界效果
   */
  registerRealmEffects(context: CalculationContext): RegistrationResult {
    const effects: UnifiedEffect[] = [];
    const errors: string[] = [];
    
    try {
      const adapter = getAdapter('realm');
      if (adapter) {
        const converted = adapter.convert(context.realm as any, context);
        effects.push(...converted);
        
        // 注册到注册表
        this.registerEffects(effects, 'realm');
      }
    } catch (e) {
      errors.push(`转换境界效果失败: ${e}`);
    }
    
    return {
      success: errors.length === 0,
      registeredCount: effects.length,
      effects,
      errors,
    };
  }
  
  // ============================================
  // 批量注册
  // ============================================
  
  /**
   * 从完整上下文注册所有效果
   */
  registerAllFromContext(context: CalculationContext): BatchRegistrationResult {
    const results = new Map<string, RegistrationResult>();
    const errors: string[] = [];
    let totalRegistered = 0;
    
    // 按顺序注册各类效果（顺序影响优先级）
    const registrations: [string, () => RegistrationResult][] = [
      ['realm', () => this.registerRealmEffects(context)],
      ['equipment', () => this.registerEquipmentEffects(context)],
      ['technique', () => this.registerTechniqueEffects(context)],
      ['faction', () => this.registerFactionEffects(context)],
      ['school', () => this.registerSchoolEffects(context)],
      ['title', () => this.registerTitleEffects(context)],
      ['buff', () => this.registerBuffEffects(context)],
      ['world', () => this.registerWorldEffects(context)],
    ];
    
    for (const [name, register] of registrations) {
      const result = register();
      results.set(name, result);
      totalRegistered += result.registeredCount;
      errors.push(...result.errors);
    }
    
    if (process.env.NODE_ENV === 'development') {
      log.info(`从上下文注册效果: ${totalRegistered}个效果`);
    }
    
    return {
      success: errors.length === 0,
      totalRegistered,
      results,
      errors,
    };
  }
  
  // ============================================
  // 注销操作
  // ============================================
  
  /**
   * 注销指定来源类型的所有效果
   */
  unregisterBySourceType(sourceType: EffectSourceType): UnregistrationResult {
    const effectIds = this.sourceIndex.get(sourceType);
    if (!effectIds || effectIds.size === 0) {
      return { success: true, unregisteredCount: 0, errors: [] };
    }
    
    let unregisteredCount = 0;
    const errors: string[] = [];
    
    for (const effectId of effectIds) {
      if (this.registry.unregister(effectId)) {
        unregisteredCount++;
      }
    }
    
    // 清空索引
    this.sourceIndex.delete(sourceType);
    
    return {
      success: true,
      unregisteredCount,
      errors,
    };
  }
  
  /**
   * 注销所有效果
   */
  unregisterAll(): UnregistrationResult {
    const size = this.registry.size;
    this.registry.clear();
    this.sourceIndex.clear();
    
    return {
      success: true,
      unregisteredCount: size,
      errors: [],
    };
  }
  
  // ============================================
  // 查询操作
  // ============================================
  
  /**
   * 获取指定来源类型的所有效果
   */
  getEffectsBySourceType(sourceType: EffectSourceType): UnifiedEffect[] {
    return this.registry.getBySource(sourceType);
  }
  
  /**
   * 获取注册表
   */
  getRegistry(): EffectRegistry {
    return this.registry;
  }
  
  /**
   * 获取效果统计
   */
  getStatistics(): {
    totalEffects: number;
    bySourceType: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const bySourceType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    for (const [sourceType, ids] of this.sourceIndex) {
      bySourceType[sourceType] = ids.size;
    }
    
    for (const effect of this.registry.getAll()) {
      byPriority[effect.priority] = (byPriority[effect.priority] || 0) + 1;
    }
    
    return {
      totalEffects: this.registry.size,
      bySourceType,
      byPriority,
    };
  }
  
  // ============================================
  // 私有方法
  // ============================================
  
  /**
   * 注册效果并更新索引
   */
  private registerEffects(effects: UnifiedEffect[], sourceType: EffectSourceType): void {
    if (!this.sourceIndex.has(sourceType)) {
      this.sourceIndex.set(sourceType, new Set());
    }
    
    const index = this.sourceIndex.get(sourceType)!;
    
    for (const effect of effects) {
      this.registry.register(effect);
      index.add(effect.id);
    }
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建效果注册服务实例
 */
export function createEffectRegistrationService(registry: EffectRegistry): EffectRegistrationService {
  return new EffectRegistrationService(registry);
}
