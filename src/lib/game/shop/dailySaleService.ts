/**
 * 限时特卖服务
 * 
 * 管理每日特卖商品的生成、刷新和购买
 */

import {
  DailySaleData,
  SaleProduct,
  CurrencyType,
  CurrencyCost,
  PlayerCurrencies,
  SALE_PRODUCT_WEIGHTS,
} from './types';
import { ALL_PRODUCTS, getProductConfig } from './productConfigs';

/** 特卖配置 */
const SALE_CONFIG = {
  productCount: 3,           // 每天特卖商品数量
  discountMin: 30,           // 最低折扣 30%
  discountMax: 70,           // 最高折扣 70%
  refreshHour: 0,            // 刷新时间 0点
};

/** 特卖服务类 */
export class DailySaleService {
  // ============================================
  // 数据创建和刷新
  // ============================================

  /**
   * 创建默认特卖数据
   */
  static createDefault(): DailySaleData {
    return {
      products: [],
      refreshTime: 0,
      previewCategory: '丹药',
    };
  }

  /**
   * 检查是否需要刷新
   */
  static needsRefresh(data: DailySaleData): boolean {
    if (data.products.length === 0) return true;
    return Date.now() >= data.refreshTime;
  }

  /**
   * 获取下次刷新时间
   */
  static getNextRefreshTime(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(SALE_CONFIG.refreshHour, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * 生成新的特卖商品
   */
  static generateSaleProducts(): SaleProduct[] {
    // 获取所有可特卖的商品
    const pool = this.getSaleProductPool();
    
    // 随机选择商品
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, SALE_CONFIG.productCount);
    
    return selected.map(config => {
      // 随机折扣
      const discount = SALE_CONFIG.discountMin + 
        Math.random() * (SALE_CONFIG.discountMax - SALE_CONFIG.discountMin);
      const originalPrice = config.price.primary.amount;
      const salePrice = Math.floor(originalPrice * (100 - discount) / 100);
      
      return {
        productId: config.definition.id,
        originalPrice,
        salePrice,
        discount: Math.round(discount),
        purchased: false,
        currency: config.price.primary.type,
      };
    });
  }

  /**
   * 生成特卖数据
   */
  static generateDailySale(): DailySaleData {
    const products = this.generateSaleProducts();
    const refreshTime = this.getNextRefreshTime();
    
    // 生成明日预告分类
    const categories = ['丹药', '材料', '功法', '装备'];
    const previewCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      products,
      refreshTime,
      previewCategory,
    };
  }

  /**
   * 获取可特卖商品池
   */
  private static getSaleProductPool() {
    // 过滤出适合特卖的商品
    return Object.values(ALL_PRODUCTS).filter(config => {
      // 排除特殊商品和过低价格商品
      if (config.definition.type === 'special') return false;
      if (config.price.primary.amount < 50) return false;
      return true;
    });
  }

  // ============================================
  // 购买处理
  // ============================================

  /**
   * 标记商品已购买
   */
  static markPurchased(data: DailySaleData, productId: string): DailySaleData {
    return {
      ...data,
      products: data.products.map(p =>
        p.productId === productId ? { ...p, purchased: true } : p
      ),
    };
  }

  /**
   * 检查商品是否已购买
   */
  static isPurchased(data: DailySaleData, productId: string): boolean {
    const product = data.products.find(p => p.productId === productId);
    return product?.purchased ?? false;
  }

  /**
   * 检查是否可以购买
   */
  static canPurchase(
    data: DailySaleData,
    productId: string,
    currencies: PlayerCurrencies
  ): { canPurchase: boolean; reason?: string } {
    const product = data.products.find(p => p.productId === productId);
    
    if (!product) {
      return { canPurchase: false, reason: '商品不存在' };
    }
    
    if (product.purchased) {
      return { canPurchase: false, reason: '已购买' };
    }
    
    const balance = currencies[product.currency] ?? 0;
    if (balance < product.salePrice) {
      return { canPurchase: false, reason: '货币不足' };
    }
    
    return { canPurchase: true };
  }

  // ============================================
  // 时间计算
  // ============================================

  /**
   * 获取剩余时间（秒）
   */
  static getRemainingSeconds(data: DailySaleData): number {
    return Math.max(0, Math.floor((data.refreshTime - Date.now()) / 1000));
  }

  /**
   * 格式化剩余时间
   */
  static formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return '已结束';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================
  // 持久化
  // ============================================

  /**
   * 从localStorage加载
   */
  static load(): DailySaleData {
    try {
      const saved = localStorage.getItem('shop_daily_sale');
      if (saved) {
        const data = JSON.parse(saved);
        // 检查是否过期
        if (!this.needsRefresh(data)) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to load daily sale data:', e);
    }
    // 生成新的特卖
    return this.generateDailySale();
  }

  /**
   * 保存到localStorage
   */
  static save(data: DailySaleData): void {
    try {
      localStorage.setItem('shop_daily_sale', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save daily sale data:', e);
    }
  }

  /**
   * 加载或刷新数据
   */
  static loadOrRefresh(): DailySaleData {
    const data = this.load();
    
    if (this.needsRefresh(data)) {
      const newData = this.generateDailySale();
      this.save(newData);
      return newData;
    }
    
    return data;
  }
}
