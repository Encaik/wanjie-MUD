/**
 * modules/shop/types.ts — 商店系统类型（适配统一物品系统）
 */

import type { Rarity } from '@/modules/item/types';

/** 商店类型 */
export type ShopType = 'normal' | 'faction' | 'black_market' | 'arena' | 'ascension' | 'event';

/** 商品定义 */
export interface ShopProduct {
  /** 商品唯一 ID */
  id: string;
  /** 物品模板 ID（指向 modules/item 的 ItemTemplate） */
  templateId: string;
  /** 数量 */
  quantity: number;
  /** 价格 { 货币templateId: 数量 } */
  price: Record<string, number>;
  /** 刷新条件 */
  refreshType: 'daily' | 'weekly' | 'manual' | 'never';
  /** 限购 */
  purchaseLimit?: {
    type: 'daily' | 'weekly' | 'monthly' | 'lifetime';
    maxCount: number;
  };
  /** 解锁条件 */
  unlockLevel?: number;
  unlockRealm?: number;
  unlockFaction?: string;
  /** 折扣（0-1，如 0.2 表示 8 折） */
  discount?: number;
  /** 是否限时特卖 */
  isSale?: boolean;
}

/** 商店配置 */
export interface ShopConfig {
  id: string;
  type: ShopType;
  name: string;
  description: string;
  /** 商品列表 */
  products: ShopProduct[];
  /** 刷新配置 */
  refresh: {
    interval: 'daily' | 'weekly' | 'every_3_days' | 'manual';
    autoRefreshCount: number;
    manualRefreshCost?: { templateId: string; amount: number };
    manualRefreshIncrement?: number;
  };
  /** 解锁条件 */
  unlockLevel?: number;
  unlockRealm?: number;
  unlockFaction?: string;
}

/** 购买结果 */
export interface PurchaseResult {
  success: boolean;
  message: string;
  /** 购买的物品 templateId */
  purchasedTemplateId?: string;
  /** 花费的货币 */
  costBreakdown?: Record<string, number>;
}
