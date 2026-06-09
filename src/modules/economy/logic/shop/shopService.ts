/**
 * 商店服务
 * 
 * 提供商店的核心逻辑：商品生成、条件验证、交易处理
 */

import { CurrencyService } from './currencyService';
import { getProductConfig, BLACKMARKET_PRODUCT_POOL } from './productConfigs';
import { SHOP_CONFIGS, getShopConfig } from './shopConfigs';
import {
  ShopType,
  ShopProduct,
  ShopConfig,
  PlayerCurrencies,
  CurrencyCost,
  PurchaseCondition,
  PurchaseResult,
  ConditionCheckResult,
  ConditionResult,
  PurchaseLimit,
  Discount,
  ShopPersistData,
  PurchaseRecord,
} from './types';

/** 玩家数据接口（用于条件验证） */
export interface PlayerDataForShop {
  level: number;
  realm: string;
  realmLevel: number;
  factionId: string | null;
  factionRank?: string;
  currencies: PlayerCurrencies;
}

/** 购买回调数据 */
export interface PurchaseCallbackData {
  productId: string;
  productType: string;
  price: CurrencyCost;
  quantity: number;
}

/**
 * 商店服务类
 */
export class ShopService {
  // ============================================
  // 商品获取
  // ============================================

  /**
   * 获取商店商品列表
   */
  static getProducts(
    shopType: ShopType,
    playerData: PlayerDataForShop,
    persistData?: ShopPersistData
  ): ShopProduct[] {
    const config = getShopConfig(shopType);
    if (!config) return [];

    let products: ShopProduct[] = [];

    if (config.productStrategy.type === 'static') {
      // 静态商品
      products = this.getStaticProducts(config.productStrategy.staticProducts || [], playerData);
    } else if (config.productStrategy.type === 'dynamic') {
      // 动态商品
      products = this.getDynamicProducts(config, playerData, persistData);
    }

    // 应用购买记录
    products = products.map(p => this.applyPurchaseRecord(p, shopType, persistData));

    return products;
  }

  /**
   * 获取静态商品
   */
  private static getStaticProducts(
    productIds: string[],
    playerData: PlayerDataForShop
  ): ShopProduct[] {
    return productIds
      .map(id => this.createShopProduct(id, playerData))
      .filter((p): p is ShopProduct => p !== null);
  }

  /**
   * 获取动态商品（黑市）
   */
  private static getDynamicProducts(
    config: ShopConfig,
    playerData: PlayerDataForShop,
    persistData?: ShopPersistData
  ): ShopProduct[] {
    const dynamicConfig = config.productStrategy.dynamicConfig;
    if (!dynamicConfig) return [];

    // 如果有保存的商品ID列表，使用保存的
    if (persistData?.blackMarketProducts && persistData.blackMarketProducts.length > 0) {
      return persistData.blackMarketProducts
        .map(id => this.createShopProduct(id, playerData))
        .filter((p): p is ShopProduct => p !== null)
        .map(p => this.applyDynamicConfig(p, dynamicConfig.discountRange, dynamicConfig.limitRange));
    }

    // 生成新的随机商品
    const pool = dynamicConfig.productPool;
    const count = dynamicConfig.randomCount;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected
      .map(id => this.createShopProduct(id, playerData))
      .filter((p): p is ShopProduct => p !== null)
      .map(p => this.applyDynamicConfig(p, dynamicConfig.discountRange, dynamicConfig.limitRange));
  }

  /**
   * 创建商品实例
   */
  private static createShopProduct(
    productId: string,
    playerData: PlayerDataForShop
  ): ShopProduct | null {
    const config = getProductConfig(productId);
    if (!config) return null;

    // 计算价格
    const price = { ...config.price.primary };
    if (config.price.dynamic) {
      const dynamic = config.price.dynamic;
      const dynamicAmount = dynamic.baseAmount + playerData.level * dynamic.levelMultiplier;
      price.amount = dynamicAmount;
    }

    return {
      id: productId,
      definition: { ...config.definition },
      price,
      conditions: config.conditions,
      purchaseLimit: config.purchaseLimit,
      unlocked: this.checkUnlock(config.unlockCondition, playerData),
      purchased: 0,
    };
  }

  /**
   * 应用动态配置（折扣和限购）
   */
  private static applyDynamicConfig(
    product: ShopProduct,
    discountRange: { min: number; max: number },
    limitRange: { min: number; max: number }
  ): ShopProduct {
    // 随机折扣
    const discountPercent = discountRange.min + Math.random() * (discountRange.max - discountRange.min);
    const originalPrice = product.price.amount;
    const discountedPrice = Math.floor(originalPrice * discountPercent);

    // 随机限购
    const limit = Math.floor(limitRange.min + Math.random() * (limitRange.max - limitRange.min + 1));

    return {
      ...product,
      originalPrice,
      price: { ...product.price, amount: discountedPrice },
      discount: {
        type: 'percent',
        value: Math.round((1 - discountPercent) * 100),
        reason: '黑市特价',
      },
      purchaseLimit: { type: 'daily', limit },
    };
  }

  /**
   * 应用购买记录
   */
  private static applyPurchaseRecord(
    product: ShopProduct,
    shopType: ShopType,
    persistData?: ShopPersistData
  ): ShopProduct {
    if (!persistData?.purchaseRecords) return product;

    const record = persistData.purchaseRecords[`${shopType}_${product.id}`];
    if (!record) return product;

    // 检查记录是否过期
    if (Date.now() > record.resetTime) {
      return product;
    }

    return {
      ...product,
      purchased: record.purchased,
    };
  }

  // ============================================
  // 条件验证
  // ============================================

  /**
   * 检查解锁条件
   */
  private static checkUnlock(
    unlockCondition: { type: string; value: number | string | boolean; description: string } | undefined,
    playerData: PlayerDataForShop
  ): boolean {
    if (!unlockCondition) return true;

    switch (unlockCondition.type) {
      case 'level':
        return playerData.level >= (unlockCondition.value as number);
      case 'faction_member':
        return playerData.factionId !== null;
        return playerData.factionId !== null;
      default:
        return true;
    }
  }

  /**
   * 检查购买条件
   */
  static checkConditions(
    product: ShopProduct,
    playerData: PlayerDataForShop
  ): ConditionCheckResult {
    const results: ConditionResult[] = [];

    for (const condition of product.conditions || []) {
      const result = this.evaluateCondition(condition, playerData);
      results.push({
        condition,
        passed: result,
      });
    }

    return {
      allPassed: results.every(r => r.passed),
      results,
    };
  }

  /**
   * 评估单个条件
   */
  private static evaluateCondition(
    condition: PurchaseCondition,
    playerData: PlayerDataForShop
  ): boolean {
    switch (condition.type) {
      case 'level_min':
        return playerData.level >= (condition.value as number);
      case 'level_max':
        return playerData.level <= (condition.value as number);
      case 'realm_min':
        return playerData.realmLevel >= (condition.value as number);
      case 'faction_member':
        return playerData.factionId !== null;
      case 'faction_rank_min':
        return this.checkFactionRank(playerData.factionRank, condition.value as string);
      default:
        return true;
    }
  }

  /**
   * 检查势力职阶
   */
  private static checkFactionRank(currentRank: string | undefined, requiredRank: string): boolean {
    const rankOrder = ['disciple', 'deacon', 'elder', 'vice_leader', 'leader'];
    const currentIndex = rankOrder.indexOf(currentRank || '');
    const requiredIndex = rankOrder.indexOf(requiredRank);
    return currentIndex >= requiredIndex;
  }

  /**
   * 检查限购
   */
  static checkPurchaseLimit(
    product: ShopProduct,
    quantity: number = 1
  ): { canPurchase: boolean; remaining: number } {
    if (!product.purchaseLimit) {
      return { canPurchase: true, remaining: Infinity };
    }

    const remaining = product.purchaseLimit.limit - product.purchased;
    return {
      canPurchase: remaining >= quantity,
      remaining,
    };
  }

  // ============================================
  // 购买处理
  // ============================================

  /**
   * 执行购买
   */
  static purchase(
    product: ShopProduct,
    playerData: PlayerDataForShop,
    quantity: number = 1
  ): PurchaseResult {
    // 1. 检查解锁
    if (!product.unlocked) {
      return { success: false, error: '商品未解锁' };
    }

    // 2. 检查购买条件
    const conditionResult = this.checkConditions(product, playerData);
    if (!conditionResult.allPassed) {
      return {
        success: false,
        error: '不满足购买条件',
        failedConditions: conditionResult.results.filter(r => !r.passed),
      };
    }

    // 3. 检查限购
    const limitCheck = this.checkPurchaseLimit(product, quantity);
    if (!limitCheck.canPurchase) {
      return { success: false, error: '已达购买上限' };
    }

    // 4. 计算总价
    const totalPrice: CurrencyCost = {
      type: product.price.type,
      amount: product.price.amount * quantity,
    };

    // 5. 检查货币
    if (!CurrencyService.canAfford(playerData.currencies, totalPrice)) {
      return { success: false, error: '货币不足' };
    }

    // 6. 扣除货币
    const newCurrencies = CurrencyService.deduct(playerData.currencies, totalPrice);
    if (!newCurrencies) {
      return { success: false, error: '货币扣除失败' };
    }

    // 7. 返回成功结果
    return {
      success: true,
      newCurrencies,
      rewards: [{
        type: product.definition.type === 'special' ? 'item' : product.definition.type,
        data: product.definition,
        quantity,
      }],
    };
  }

  // ============================================
  // 刷新处理
  // ============================================

  /**
   * 检查是否需要刷新
   */
  static needsRefresh(
    shopType: ShopType,
    persistData?: ShopPersistData
  ): boolean {
    const config = getShopConfig(shopType);
    if (!config?.refreshStrategy) return false;

    const refreshTime = persistData?.refreshTimes?.[shopType];
    if (!refreshTime) return true;

    return Date.now() >= refreshTime;
  }

  /**
   * 获取下次刷新时间
   */
  static getNextRefreshTime(shopType: ShopType): number {
    const config = getShopConfig(shopType);
    if (!config?.refreshStrategy) return 0;

    const now = new Date();
    const refreshHour = config.refreshStrategy.refreshHour || 0;

    // 计算今天的刷新时间
    const todayRefresh = new Date(now);
    todayRefresh.setHours(refreshHour, 0, 0, 0);

    // 如果已经过了今天的刷新时间，返回明天的刷新时间
    if (now.getTime() >= todayRefresh.getTime()) {
      todayRefresh.setDate(todayRefresh.getDate() + 1);
    }

    return todayRefresh.getTime();
  }

  /**
   * 生成新的黑市商品
   */
  static generateBlackMarketProducts(playerData: PlayerDataForShop): ShopProduct[] {
    const config = getShopConfig('blackmarket');
    if (!config?.productStrategy.dynamicConfig) return [];

    const dynamicConfig = config.productStrategy.dynamicConfig;
    const pool = dynamicConfig.productPool;
    const count = dynamicConfig.randomCount;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected
      .map(id => this.createShopProduct(id, playerData))
      .filter((p): p is ShopProduct => p !== null)
      .map(p => this.applyDynamicConfig(p, dynamicConfig.discountRange, dynamicConfig.limitRange));
  }

  // ============================================
  // 持久化
  // ============================================

  /**
   * 创建购买记录
   */
  static createPurchaseRecord(
    productId: string,
    shopType: ShopType,
    purchased: number,
    limitType: 'daily' | 'weekly' | 'monthly' | 'lifetime' | 'stock'
  ): PurchaseRecord {
    const resetTime = this.calculateResetTime(limitType);
    return {
      productId,
      shopType,
      purchased,
      lastPurchaseTime: Date.now(),
      resetTime,
    };
  }

  /**
   * 计算重置时间
   */
  private static calculateResetTime(limitType: 'daily' | 'weekly' | 'monthly' | 'lifetime' | 'stock'): number {
    const now = new Date();

    switch (limitType) {
      case 'daily': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
      }
      case 'weekly': {
        const nextWeek = new Date(now);
        const daysUntilSunday = 7 - nextWeek.getDay();
        nextWeek.setDate(nextWeek.getDate() + daysUntilSunday);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek.getTime();
      }
      case 'monthly': {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth.getTime();
      }
      case 'lifetime':
      case 'stock':
      default:
        return Date.now() + 365 * 24 * 60 * 60 * 1000; // 一年后
    }
  }

  /**
   * 创建默认持久化数据
   */
  static createDefaultPersistData(): ShopPersistData {
    return {
      purchaseRecords: {},
      refreshTimes: {},
      blackMarketProducts: [],
    };
  }

  /**
   * 从 localStorage 加载持久化数据
   */
  static loadPersistData(): ShopPersistData {
    try {
      const saved = localStorage.getItem('shop_persist_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load shop persist data:', e);
    }
    return this.createDefaultPersistData();
  }

  /**
   * 保存持久化数据到 localStorage
   */
  static savePersistData(data: ShopPersistData): void {
    try {
      localStorage.setItem('shop_persist_data', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save shop persist data:', e);
    }
  }
}
