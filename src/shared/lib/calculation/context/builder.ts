/**
 * 计算上下文构建器
 * 
 * 负责从各种数据源构建计算上下文
 */

import {
  CalculationContext,
  ContextBuilderOptions,
} from './types';
import { LOG_PREFIX } from '../constants';

// ============================================
// 默认选项
// ============================================

const DEFAULT_OPTIONS: ContextBuilderOptions = {
  enableValidation: true,
  enableLogging: process.env.NODE_ENV === 'development',
};

// ============================================
// 上下文构建器
// ============================================

export class ContextBuilder {
  private options: ContextBuilderOptions;
  
  constructor(options: Partial<ContextBuilderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * 生成唯一计算ID
   */
  private generateCalculationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `calc_${timestamp}_${random}`;
  }
  
  /**
   * 构建完整计算上下文
   * 
   * 这是一个静态工厂方法，用于从现有数据构建上下文
   * 实际使用时，会从 Protagonist、World 等数据源提取信息
   */
  build(params: {
    character: CalculationContext['character'];
    equipment: CalculationContext['equipment'];
    techniques: CalculationContext['techniques'];
    world: CalculationContext['world'];
    state: CalculationContext['state'];
    titles: CalculationContext['titles'];
    realm: CalculationContext['realm'];
  }): CalculationContext {
    const context: CalculationContext = {
      calculationId: this.options.calculationId || this.generateCalculationId(),
      timestamp: Date.now(),
      ...params,
    };
    
    // 验证
    if (this.options.enableValidation) {
      this.validate(context);
    }
    
    // 日志
    if (this.options.enableLogging) {
      console.log(`${LOG_PREFIX} 构建计算上下文: ${context.calculationId}`);
    }
    
    return context;
  }
  
  /**
   * 构建空上下文（用于测试）
   */
  buildEmpty(): CalculationContext {
    return {
      calculationId: this.generateCalculationId(),
      timestamp: Date.now(),
      character: {
        id: 'test_character',
        type: 'protagonist',
        level: 1,
        realm: '炼气',
        realmLevel: 1,
        baseStats: {
          体质: 10,
          灵根: 10,
          悟性: 10,
          幸运: 10,
          意志: 10,
        },
      },
      equipment: {
        melee: null,
        ranged: null,
        head: null,
        body: null,
        legs: null,
        feet: null,
      },
      techniques: [],
      world: {
        id: 'default',
        type: '修仙',
        actualCoefficient: 1.0,
        dangers: [],
        opportunities: [],
      },
      state: {
        inBattle: false,
        currentHp: 100,
        maxHp: 100,
        currentMp: 50,
        maxMp: 50,
        activeBuffs: [],
        activeEffects: [],
      },
      titles: [],
      realm: {
        name: '炼气',
        level: 1,
      },
    };
  }
  
  /**
   * 验证上下文
   */
  private validate(context: CalculationContext): void {
    // 验证角色数据
    if (!context.character) {
      throw new Error('计算上下文缺少角色数据');
    }
    
    if (context.character.level < 1) {
      throw new Error(`无效的角色等级: ${context.character.level}`);
    }
    
    // 验证基础属性
    const stats = context.character.baseStats;
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`无效的基础属性 ${key}: ${value}`);
      }
    }
    
    // 验证世界数据
    if (!context.world) {
      throw new Error('计算上下文缺少世界数据');
    }
    
    if (context.world.actualCoefficient <= 0) {
      throw new Error(`无效的世界系数: ${context.world.actualCoefficient}`);
    }
    
    // 验证状态
    if (!context.state) {
      throw new Error('计算上下文缺少状态数据');
    }
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建上下文构建器实例
 */
export function createContextBuilder(options?: Partial<ContextBuilderOptions>): ContextBuilder {
  return new ContextBuilder(options);
}

/**
 * 快速构建上下文
 */
export function buildContext(params: Parameters<ContextBuilder['build']>[0]): CalculationContext {
  const builder = new ContextBuilder();
  return builder.build(params);
}
