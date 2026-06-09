/**
 * 计算服务注入点
 * 
 * 提供统一的计算服务访问入口，支持依赖注入
 * 所有数值计算都通过此服务进行，便于统一管理和测试
 */

import { UnifiedCalculator } from '../calculator';
import { ContextBuilder } from '../context/builder';
import type { WorldType } from '@/shared/lib/types';
import {
  getRealmByLevel,
  getNextRealm,
  getNextRealmLevel,
  getRealmMultiplier,
} from '@/modules/progression/logic/realmSystem';

import type { CalculationContext } from '../context/types';
import type { CalculableStat } from '../types';
import type { StatCalculationResult } from '../types';
import type { CalculationResult } from '../types';

// ============================================
// 计算服务接口
// ============================================

/**
 * 战力计算结果
 */
export interface CombatPowerResult {
  /** 战力值 */
  power: number;
  /** 战力等级 */
  rank: string;
  /** 战力颜色 */
  color: string;
  /** 格式化后的战力 */
  formatted: string;
}

/**
 * 境界计算结果
 */
export interface RealmResult {
  /** 境界名称 */
  name: string;
  /** 境界倍率 */
  multiplier: number;
  /** 下一个境界 */
  nextRealm: string | null;
  /** 下一个境界等级 */
  nextRealmLevel: number | null;
}

/**
 * 计算服务接口
 */
export interface ICalculationService {
  /**
   * 计算玩家战力
   */
  calculatePlayerCombatPower(context: CalculationContext): CombatPowerResult;
  
  /**
   * 计算敌人战力
   */
  calculateEnemyCombatPower(hp: number, attack: number, defense: number, level: number, tier: string): CombatPowerResult;
  
  /**
   * 获取境界信息
   */
  getRealm(worldType: string, level: number): RealmResult;
  
  /**
   * 构建计算上下文
   */
  buildContext(): ContextBuilder;
  
  /**
   * 计算单个属性
   */
  calculateStat(context: CalculationContext, stat: CalculableStat, baseValue: number): StatCalculationResult;
  
  /**
   * 计算战斗属性
   */
  calculateCombatStats(context: CalculationContext): CalculationResult;
}

// ============================================
// 默认计算服务实现
// ============================================

class DefaultCalculationService implements ICalculationService {
  private calculator: UnifiedCalculator;
  
  constructor() {
    this.calculator = new UnifiedCalculator();
  }
  
  calculatePlayerCombatPower(context: CalculationContext): CombatPowerResult {
    const result = this.calculator.calculateStat(context, 'power', 0);
    const power = Math.max(1, result.finalValue);
    
    return {
      power,
      rank: this.getPowerRank(power),
      color: this.getPowerColor(power),
      formatted: this.formatPower(power),
    };
  }
  
  calculateEnemyCombatPower(hp: number, attack: number, defense: number, level: number, tier: string): CombatPowerResult {
    // 敌人战力计算公式
    const tierMultipliers: Record<string, number> = {
      normal: 1.0,
      elite: 1.15,
      miniboss: 1.3,
      boss: 1.5,
    };
    
    const basePower = hp * 0.5 + attack * 2.5 + defense * 2.0;
    const levelBonus = 1 + level * 0.03;
    const tierBonus = tierMultipliers[tier] || 1.0;
    
    const power = Math.max(1, Math.floor(basePower * levelBonus * tierBonus));
    
    return {
      power,
      rank: this.getPowerRank(power),
      color: this.getPowerColor(power),
      formatted: this.formatPower(power),
    };
  }
  
  getRealm(worldType: string, level: number): RealmResult {
    // 境界系统使用 realmData 中的配置
    // functions imported at top of file
    
    const realmName = getRealmByLevel(worldType as WorldType, level);
    const nextRealm = getNextRealm(worldType as WorldType, level);
    const nextRealmLevel = getNextRealmLevel(worldType as WorldType, level);
    const multiplier = getRealmMultiplier(worldType as WorldType, level);
    
    return {
      name: realmName,
      multiplier,
      nextRealm,
      nextRealmLevel,
    };
  }
  
  buildContext(): ContextBuilder {
    return new ContextBuilder();
  }
  
  calculateStat(context: CalculationContext, stat: CalculableStat, baseValue: number): StatCalculationResult {
    return this.calculator.calculateStat(context, stat, baseValue);
  }
  
  calculateCombatStats(context: CalculationContext): CalculationResult {
    return this.calculator.calculateCombatStats(context);
  }
  
  // ============================================
  // 私有方法
  // ============================================
  
  private getPowerRank(power: number): string {
    if (power >= 100000) return '传说';
    if (power >= 50000) return '史诗';
    if (power >= 20000) return '稀有';
    if (power >= 10000) return '精良';
    if (power >= 5000) return '优秀';
    if (power >= 2000) return '普通';
    return '入门';
  }
  
  private getPowerColor(power: number): string {
    if (power >= 100000) return 'text-orange-500';
    if (power >= 50000) return 'text-purple-500';
    if (power >= 20000) return 'text-blue-500';
    if (power >= 10000) return 'text-green-500';
    if (power >= 5000) return 'text-cyan-500';
    if (power >= 2000) return 'text-yellow-500';
    return 'text-muted-foreground';
  }
  
  private formatPower(power: number): string {
    if (power >= 100000000) {
      return `${(power / 100000000).toFixed(2)}亿`;
    } else if (power >= 10000) {
      return `${(power / 10000).toFixed(2)}万`;
    }
    return power.toLocaleString();
  }
}

// ============================================
// 服务实例管理
// ============================================

let serviceInstance: ICalculationService | null = null;

/**
 * 获取计算服务实例
 */
export function getCalculationService(): ICalculationService {
  if (!serviceInstance) {
    serviceInstance = new DefaultCalculationService();
  }
  return serviceInstance;
}

/**
 * 设置计算服务实例（用于依赖注入）
 */
export function setCalculationService(service: ICalculationService): void {
  serviceInstance = service;
}

/**
 * 重置计算服务实例（用于测试）
 */
export function resetCalculationService(): void {
  serviceInstance = null;
}

// ============================================
// 便捷函数（直接导出，简化调用）
// ============================================

/**
 * 计算玩家战力
 */
export function calculatePlayerPower(context: CalculationContext): CombatPowerResult {
  return getCalculationService().calculatePlayerCombatPower(context);
}

/**
 * 计算敌人战力
 */
export function calculateEnemyPower(
  hp: number,
  attack: number,
  defense: number,
  level: number,
  tier: string
): CombatPowerResult {
  return getCalculationService().calculateEnemyCombatPower(hp, attack, defense, level, tier);
}

/**
 * 获取战力等级描述
 */
export function getCombatPowerRank(power: number): { rank: string; color: string } {
  const service = getCalculationService();
  // 复用敌人战力计算的颜色和等级逻辑
  const result = service.calculateEnemyCombatPower(power, 0, 0, 1, 'normal');
  return { rank: result.rank, color: result.color };
}

/**
 * 格�式化战力数值
 */
export function formatCombatPower(power: number): string {
  if (power >= 100000000) {
    return `${(power / 100000000).toFixed(2)}亿`;
  } else if (power >= 10000) {
    return `${(power / 10000).toFixed(2)}万`;
  }
  return power.toLocaleString();
}

/**
 * 计算战力差距比率
 */
export function getCombatPowerRatio(playerPower: number, enemyPower: number): {
  ratio: number;
  description: string;
  color: string;
} {
  const ratio = playerPower / enemyPower;
  
  if (ratio >= 2.0) {
    return { ratio, description: '碾压', color: 'text-green-500' };
  } else if (ratio >= 1.5) {
    return { ratio, description: '优势', color: 'text-green-400' };
  } else if (ratio >= 1.2) {
    return { ratio, description: '略优', color: 'text-green-300' };
  } else if (ratio >= 1.0) {
    return { ratio, description: '势均', color: 'text-yellow-500' };
  } else if (ratio >= 0.8) {
    return { ratio, description: '略逊', color: 'text-orange-400' };
  } else if (ratio >= 0.5) {
    return { ratio, description: '劣势', color: 'text-orange-500' };
  } else {
    return { ratio, description: '危局', color: 'text-red-500' };
  }
}
