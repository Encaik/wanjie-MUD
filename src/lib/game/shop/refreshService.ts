/**
 * 商店刷新服务
 * 
 * 管理商店的定时刷新和手动刷新逻辑
 */

import { SHOP_CONFIGS, getShopConfig } from './shopConfigs';
import { ShopService, PlayerDataForShop } from './shopService';
import { ShopType, CurrencyCost, PlayerCurrencies, ShopProduct } from './types';

// ============================================
// 类型定义
// ============================================

/** 刷新结果 */
export interface RefreshResult {
  success: boolean;
  error?: string;
  newProducts?: ShopProduct[];
  nextRefreshTime?: number;
  deductedCurrencies?: PlayerCurrencies;
}

/** 刷新状态 */
export interface RefreshState {
  /** 各商店上次刷新时间 */
  lastRefreshTimes: Partial<Record<ShopType, number>>;
  /** 各商店下次刷新时间 */
  nextRefreshTimes: Partial<Record<ShopType, number>>;
  /** 今日手动刷新次数 */
  manualRefreshCounts: Partial<Record<ShopType, number>>;
  /** 今日重置时间（用于重置手动刷新次数） */
  dailyResetTime: number;
  /** 各商店当前展示的商品ID列表 */
  shopProductIds: Partial<Record<ShopType, string[]>>;
}

/** 刷新配置 */
export interface RefreshConfig {
  /** 刷新间隔（毫秒），0表示不自动刷新 */
  interval: number;
  /** 每日免费刷新次数 */
  dailyFreeRefresh: number;
  /** 手动刷新花费 */
  manualRefreshCost: CurrencyCost;
  /** 花费递增（每次刷新增加） */
  costIncrement?: number;
  /** 最大花费 */
  maxCost?: number;
}

// ============================================
// 刷新配置表
// ============================================

/** 各商店刷新配置 */
export const REFRESH_CONFIGS: Partial<Record<ShopType, RefreshConfig>> = {
  normal: {
    interval: 6 * 60 * 60 * 1000, // 6小时
    dailyFreeRefresh: 1,
    manualRefreshCost: { type: 'spirit_stone', amount: 100 },
    costIncrement: 50,
    maxCost: 500,
  },
  faction: {
    interval: 7 * 24 * 60 * 60 * 1000, // 每周
    dailyFreeRefresh: 0,
    manualRefreshCost: { type: 'contribution', amount: 200 },
  },
  blackmarket: {
    interval: 24 * 60 * 60 * 1000, // 每天
    dailyFreeRefresh: 0,
    manualRefreshCost: { type: 'spirit_stone', amount: 200 },
    costIncrement: 100,
    maxCost: 1000,
  },
  arena: {
    interval: 3 * 24 * 60 * 60 * 1000, // 每3天
    dailyFreeRefresh: 0,
    manualRefreshCost: { type: 'honor', amount: 100 },
  },
  ascension: {
    interval: 7 * 24 * 60 * 60 * 1000, // 每周
    dailyFreeRefresh: 0,
    manualRefreshCost: { type: 'ascension_mark', amount: 50 },
  },
};

// ============================================
// 刷新服务类
// ============================================

/**
 * 商店刷新服务
 */
export class RefreshService {
  private static readonly STORAGE_KEY = 'shop_refresh_state';

  // ============================================
  // 状态管理
  // ============================================

  /**
   * 创建默认刷新状态
   */
  static createDefaultState(): RefreshState {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return {
      lastRefreshTimes: {},
      nextRefreshTimes: {},
      manualRefreshCounts: {},
      dailyResetTime: todayStart.getTime() + 24 * 60 * 60 * 1000,
      shopProductIds: {},
    };
  }

  /**
   * 加载刷新状态
   */
  static loadState(): RefreshState {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as RefreshState;
        // 检查是否需要重置每日计数
        if (Date.now() >= state.dailyResetTime) {
          state.manualRefreshCounts = {};
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          state.dailyResetTime = tomorrow.getTime();
        }
        return state;
      }
    } catch (e) {
      console.warn('Failed to load shop refresh state:', e);
    }
    return this.createDefaultState();
  }

  /**
   * 保存刷新状态
   */
  static saveState(state: RefreshState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save shop refresh state:', e);
    }
  }

  // ============================================
  // 刷新逻辑
  // ============================================

  /**
   * 检查是否需要自动刷新
   */
  static needsAutoRefresh(
    shopType: ShopType,
    state: RefreshState
  ): boolean {
    const config = REFRESH_CONFIGS[shopType];
    if (!config || config.interval === 0) return false;

    const nextRefresh = state.nextRefreshTimes[shopType];
    if (!nextRefresh) return true;

    return Date.now() >= nextRefresh;
  }

  /**
   * 获取下次刷新时间
   */
  static getNextRefreshTime(
    shopType: ShopType,
    state: RefreshState
  ): number {
    const config = REFRESH_CONFIGS[shopType];
    if (!config || config.interval === 0) return 0;

    // 如果已经有下次刷新时间，直接返回
    if (state.nextRefreshTimes[shopType]) {
      return state.nextRefreshTimes[shopType]!;
    }

    // 计算下次刷新时间
    const now = Date.now();
    return now + config.interval;
  }

  /**
   * 计算刷新剩余时间
   */
  static getRefreshCountdown(
    shopType: ShopType,
    state: RefreshState
  ): { hours: number; minutes: number; seconds: number; total: number } {
    const nextRefresh = this.getNextRefreshTime(shopType, state);
    if (!nextRefresh) {
      return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const remaining = Math.max(0, nextRefresh - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, total: remaining };
  }

  /**
   * 获取手动刷新花费
   */
  static getManualRefreshCost(
    shopType: ShopType,
    state: RefreshState
  ): CurrencyCost {
    const config = REFRESH_CONFIGS[shopType];
    if (!config) {
      return { type: 'spirit_stone', amount: 100 };
    }

    const todayCount = state.manualRefreshCounts[shopType] || 0;
    const freeRefresh = config.dailyFreeRefresh;

    // 免费刷新次数内
    if (todayCount < freeRefresh) {
      return { type: config.manualRefreshCost.type, amount: 0 };
    }

    // 计算花费（递增）
    const baseCost = config.manualRefreshCost.amount;
    const increment = config.costIncrement || 0;
    const maxCost = config.maxCost || baseCost * 5;
    const extraRefresh = todayCount - freeRefresh;
    const cost = Math.min(baseCost + increment * extraRefresh, maxCost);

    return { type: config.manualRefreshCost.type, amount: cost };
  }

  /**
   * 执行自动刷新
   */
  static performAutoRefresh(
    shopType: ShopType,
    playerData: PlayerDataForShop,
    state: RefreshState
  ): { products: ShopProduct[]; newState: RefreshState } {
    const config = REFRESH_CONFIGS[shopType];
    const now = Date.now();

    // 生成新商品
    const products = ShopService.getProducts(shopType, playerData, {
      purchaseRecords: {},
      refreshTimes: {},
      blackMarketProducts: undefined,
    });

    // 更新状态
    const newState: RefreshState = {
      ...state,
      lastRefreshTimes: {
        ...state.lastRefreshTimes,
        [shopType]: now,
      },
      nextRefreshTimes: {
        ...state.nextRefreshTimes,
        [shopType]: config ? now + config.interval : 0,
      },
      shopProductIds: {
        ...state.shopProductIds,
        [shopType]: products.map(p => p.id),
      },
    };

    this.saveState(newState);

    return { products, newState };
  }

  /**
   * 执行手动刷新
   */
  static performManualRefresh(
    shopType: ShopType,
    playerData: PlayerDataForShop,
    state: RefreshState
  ): RefreshResult {
    const config = REFRESH_CONFIGS[shopType];
    if (!config) {
      return { success: false, error: '该商店不支持手动刷新' };
    }

    // 计算花费
    const cost = this.getManualRefreshCost(shopType, state);

    // 检查货币（免费刷新跳过检查）
    if (cost.amount > 0) {
      const available = playerData.currencies[cost.type] || 0;
      if (available < cost.amount) {
        return { success: false, error: '货币不足' };
      }
    }

    const now = Date.now();

    // 生成新商品
    const products = ShopService.getProducts(shopType, playerData, {
      purchaseRecords: {},
      refreshTimes: {},
      blackMarketProducts: undefined,
    });

    // 扣除货币
    const newCurrencies = { ...playerData.currencies };
    if (cost.amount > 0) {
      newCurrencies[cost.type] = (newCurrencies[cost.type] || 0) - cost.amount;
    }

    // 更新状态
    const newState: RefreshState = {
      ...state,
      lastRefreshTimes: {
        ...state.lastRefreshTimes,
        [shopType]: now,
      },
      nextRefreshTimes: {
        ...state.nextRefreshTimes,
        [shopType]: now + config.interval,
      },
      manualRefreshCounts: {
        ...state.manualRefreshCounts,
        [shopType]: (state.manualRefreshCounts[shopType] || 0) + 1,
      },
      shopProductIds: {
        ...state.shopProductIds,
        [shopType]: products.map(p => p.id),
      },
    };

    this.saveState(newState);

    return {
      success: true,
      newProducts: products,
      nextRefreshTime: now + config.interval,
      deductedCurrencies: newCurrencies,
    };
  }

  /**
   * 初始化商店刷新状态
   */
  static initializeRefreshState(
    shopType: ShopType,
    state: RefreshState
  ): RefreshState {
    const config = REFRESH_CONFIGS[shopType];
    if (!config) return state;

    const now = Date.now();

    // 如果还没有刷新时间，初始化
    if (!state.nextRefreshTimes[shopType]) {
      return {
        ...state,
        lastRefreshTimes: {
          ...state.lastRefreshTimes,
          [shopType]: now,
        },
        nextRefreshTimes: {
          ...state.nextRefreshTimes,
          [shopType]: now + config.interval,
        },
      };
    }

    return state;
  }

  /**
   * 获取当前展示的商品ID列表
   */
  static getCurrentProductIds(
    shopType: ShopType,
    state: RefreshState
  ): string[] | undefined {
    return state.shopProductIds[shopType];
  }

  /**
   * 格式化倒计时显示
   */
  static formatCountdown(countdown: { hours: number; minutes: number; seconds: number }): string {
    if (countdown.hours > 0) {
      return `${countdown.hours}小时${countdown.minutes}分`;
    }
    if (countdown.minutes > 0) {
      return `${countdown.minutes}分${countdown.seconds}秒`;
    }
    return `${countdown.seconds}秒`;
  }

  /**
   * 检查商店是否支持刷新
   */
  static supportsRefresh(shopType: ShopType): boolean {
    return shopType in REFRESH_CONFIGS;
  }
}
