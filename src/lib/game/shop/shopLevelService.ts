/**
 * 商店等级服务
 * 
 * 管理商店等级、经验、折扣等功能
 */

import {
  ShopLevelData,
  ShopLevelConfig,
  SHOP_LEVEL_CONFIGS,
  getShopLevelConfig,
  calculateShopLevel,
  CurrencyCost,
} from './types';

/** 等级服务类 */
export class ShopLevelService {
  // ============================================
  // 数据创建和验证
  // ============================================

  /**
   * 创建默认商店等级数据
   */
  static createDefault(): ShopLevelData {
    return {
      level: 1,
      exp: 0,
      totalSpent: 0,
      weeklySpent: 0,
      lastWeeklyReset: Date.now(),
      unlockedProducts: [],
    };
  }

  /**
   * 验证等级数据
   */
  static validate(data: ShopLevelData | null | undefined): ShopLevelData {
    if (!data) return this.createDefault();
    
    // 重新计算等级（防止数据不一致）
    const { level } = calculateShopLevel(data.exp);
    
    return {
      ...data,
      level,
    };
  }

  // ============================================
  // 经验和等级计算
  // ============================================

  /**
   * 添加消费经验
   * @param data 当前等级数据
   * @param spentAmount 消费金额（灵石等价）
   * @returns 更新后的等级数据
   */
  static addSpentExp(
    data: ShopLevelData,
    spentAmount: number
  ): ShopLevelData {
    // 检查周重置
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    let weeklySpent = data.weeklySpent;
    let lastWeeklyReset = data.lastWeeklyReset;
    
    if (now - lastWeeklyReset >= weekMs) {
      weeklySpent = 0;
      lastWeeklyReset = now;
    }
    
    const newExp = data.exp + spentAmount;
    const newTotalSpent = data.totalSpent + spentAmount;
    const newWeeklySpent = weeklySpent + spentAmount;
    
    const { level } = calculateShopLevel(newExp);
    
    return {
      ...data,
      level,
      exp: newExp,
      totalSpent: newTotalSpent,
      weeklySpent: newWeeklySpent,
      lastWeeklyReset,
    };
  }

  /**
   * 获取当前等级进度
   */
  static getProgress(data: ShopLevelData): {
    level: number;
    currentExp: number;
    nextExp: number;
    progress: number; // 0-1
    isMaxLevel: boolean;
  } {
    const result = calculateShopLevel(data.exp);
    const isMaxLevel = result.level >= 10;
    
    return {
      level: result.level,
      currentExp: result.currentExp,
      nextExp: result.nextExp,
      progress: isMaxLevel ? 1 : (result.nextExp > 0 ? result.currentExp / result.nextExp : 0),
      isMaxLevel,
    };
  }

  /**
   * 获取等级配置
   */
  static getLevelConfig(level: number): ShopLevelConfig {
    return getShopLevelConfig(level);
  }

  /**
   * 获取当前折扣
   */
  static getDiscount(data: ShopLevelData): number {
    const config = this.getLevelConfig(data.level);
    return config.discount;
  }

  /**
   * 获取限购加成
   */
  static getLimitBonus(data: ShopLevelData): number {
    const config = this.getLevelConfig(data.level);
    return config.limitBonus;
  }

  /**
   * 计算折扣后价格
   */
  static applyDiscount(price: number, data: ShopLevelData): number {
    const discount = this.getDiscount(data);
    return Math.floor(price * (100 - discount) / 100);
  }

  /**
   * 计算限购数量加成
   */
  static applyLimitBonus(baseLimit: number, data: ShopLevelData): number {
    const bonus = this.getLimitBonus(data);
    return Math.ceil(baseLimit * (100 + bonus) / 100);
  }

  // ============================================
  // 功能解锁检查
  // ============================================

  /**
   * 检查功能是否解锁
   */
  static isFeatureUnlocked(data: ShopLevelData, feature: string): boolean {
    // 检查当前等级及以下所有等级的功能
    for (let i = 1; i <= data.level; i++) {
      const config = this.getLevelConfig(i);
      if (config.features.includes(feature)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取所有已解锁功能
   */
  static getUnlockedFeatures(data: ShopLevelData): string[] {
    const features: string[] = [];
    for (let i = 1; i <= data.level; i++) {
      const config = this.getLevelConfig(i);
      features.push(...config.features);
    }
    return features;
  }

  /**
   * 获取下一级解锁的功能
   */
  static getNextLevelFeatures(data: ShopLevelData): string[] | null {
    if (data.level >= 10) return null;
    
    const nextConfig = this.getLevelConfig(data.level + 1);
    return nextConfig.features;
  }

  // ============================================
  // 持久化
  // ============================================

  /**
   * 从localStorage加载数据
   */
  static load(): ShopLevelData {
    try {
      const saved = localStorage.getItem('shop_level_data');
      if (saved) {
        const data = JSON.parse(saved);
        return this.validate(data);
      }
    } catch (e) {
      console.warn('Failed to load shop level data:', e);
    }
    return this.createDefault();
  }

  /**
   * 保存数据到localStorage
   */
  static save(data: ShopLevelData): void {
    try {
      localStorage.setItem('shop_level_data', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save shop level data:', e);
    }
  }
}
