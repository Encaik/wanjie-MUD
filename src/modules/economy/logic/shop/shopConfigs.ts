/**
 * 商店配置
 * 
 * 定义所有商店的配置信息
 */

import { 
  NORMAL_SHOP_PRODUCTS, 
  FACTION_SHOP_PRODUCTS, 
  BLACKMARKET_PRODUCT_POOL,
  ARENA_SHOP_PRODUCTS,
  ASCENSION_SHOP_PRODUCTS,
} from './productConfigs';
import { ShopConfig, ShopType } from './types';

// ============================================
// 商店配置
// ============================================

export const SHOP_CONFIGS: Record<ShopType, ShopConfig> = {
  normal: {
    id: 'normal',
    name: '普通商店',
    description: '售卖基础丹药、材料和随机物品',
    icon: '🛒',
    primaryCurrency: 'spirit_stone',
    productStrategy: {
      type: 'static',
      staticProducts: NORMAL_SHOP_PRODUCTS.map(p => p.definition.id),
    },
    refreshStrategy: {
      type: 'daily',
      refreshHour: 0,
      dailyFreeRefresh: 1,
      manualRefreshCost: { type: 'spirit_stone', amount: 100 },
    },
    uiConfig: {
      groupBy: 'type',
      sortBy: 'rarity',
      displayMode: 'grid',
      columns: 4,
    },
  },

  faction: {
    id: 'faction',
    name: '势力商店',
    description: '势力专属商店，使用贡献点购买',
    icon: '⭐',
    primaryCurrency: 'contribution',
    unlockCondition: {
      type: 'faction_member',
      value: true,
      description: '需要加入势力',
    },
    productStrategy: {
      type: 'static',
      staticProducts: FACTION_SHOP_PRODUCTS.map(p => p.definition.id),
    },
    refreshStrategy: {
      type: 'weekly',
      refreshHour: 0,
      dailyFreeRefresh: 0,
      manualRefreshCost: { type: 'contribution', amount: 200 },
    },
    uiConfig: {
      groupBy: 'rarity',
      sortBy: 'price',
      displayMode: 'grid',
      columns: 4,
    },
  },

  blackmarket: {
    id: 'blackmarket',
    name: '黑市',
    description: '黑市特价，限时限量',
    icon: '🌑',
    primaryCurrency: 'spirit_stone',
    unlockCondition: {
      type: 'level',
      value: 10,
      description: '需要10级解锁',
    },
    productStrategy: {
      type: 'dynamic',
      dynamicConfig: {
        productPool: BLACKMARKET_PRODUCT_POOL.map(p => p.definition.id),
        randomCount: 6,
        discountRange: { min: 0.5, max: 0.8 },
        limitRange: { min: 1, max: 3 },
      },
    },
    refreshStrategy: {
      type: 'daily',
      refreshHour: 0,
      dailyFreeRefresh: 0,
      manualRefreshCost: { type: 'spirit_stone', amount: 200 },
    },
    uiConfig: {
      groupBy: 'none',
      sortBy: 'price',
      displayMode: 'grid',
      columns: 4,
    },
  },

  arena: {
    id: 'arena',
    name: '竞技商店',
    description: '竞技场荣誉兑换专属物品',
    icon: '🏆',
    primaryCurrency: 'honor',
    unlockCondition: {
      type: 'level',
      value: 20,
      description: '需要20级解锁',
    },
    productStrategy: {
      type: 'static',
      staticProducts: ARENA_SHOP_PRODUCTS.map(p => p.definition.id),
    },
    refreshStrategy: {
      type: 'daily',
      refreshHour: 0,
      dailyFreeRefresh: 0,
      manualRefreshCost: { type: 'honor', amount: 100 },
    },
    uiConfig: {
      groupBy: 'type',
      sortBy: 'price',
      displayMode: 'grid',
      columns: 4,
    },
  },

  ascension: {
    id: 'ascension',
    name: '飞升商店',
    description: '飞升者专属商店，兑换天界物品',
    icon: '✨',
    primaryCurrency: 'ascension_mark',
    unlockCondition: {
      type: 'ascension',
      value: true,
      description: '需要完成首次飞升',
    },
    productStrategy: {
      type: 'static',
      staticProducts: ASCENSION_SHOP_PRODUCTS.map(p => p.definition.id),
    },
    refreshStrategy: {
      type: 'weekly',
      refreshHour: 0,
      dailyFreeRefresh: 0,
      manualRefreshCost: { type: 'ascension_mark', amount: 50 },
    },
    uiConfig: {
      groupBy: 'type',
      sortBy: 'price',
      displayMode: 'grid',
      columns: 4,
    },
  },

  event: {
    id: 'event',
    name: '活动商店',
    description: '限时活动商店，使用活动代币兑换',
    icon: '🎫',
    primaryCurrency: 'event_token',
    unlockCondition: {
      type: 'event_active',
      value: true,
      description: '活动期间开放',
    },
    productStrategy: {
      type: 'static',
      staticProducts: [],
    },
    uiConfig: {
      groupBy: 'type',
      sortBy: 'price',
      displayMode: 'grid',
      columns: 4,
    },
  },
};

/**
 * 获取商店配置
 */
export function getShopConfig(shopType: ShopType): ShopConfig | undefined {
  return SHOP_CONFIGS[shopType];
}

/**
 * 获取所有商店类型
 */
export function getAllShopTypes(): ShopType[] {
  return Object.keys(SHOP_CONFIGS) as ShopType[];
}

/**
 * 获取已解锁的商店列表
 */
export function getUnlockedShops(
  playerData: {
    level: number;
    factionId: string | null;
    hasAscended?: boolean;
    eventActive?: boolean;
  }
): ShopType[] {
  return getAllShopTypes().filter(type => isShopUnlocked(type, playerData));
}

/**
 * 检查商店是否解锁
 */
export function isShopUnlocked(
  shopType: ShopType,
  playerData: {
    level: number;
    factionId: string | null;
    hasAscended?: boolean;
    eventActive?: boolean;
  }
): boolean {
  const config = SHOP_CONFIGS[shopType];
  if (!config) return false;

  if (!config.unlockCondition) return true;

  switch (config.unlockCondition.type) {
    case 'faction_member':
      return playerData.factionId !== null;
    case 'level':
      return playerData.level >= (config.unlockCondition.value as number);
    case 'ascension':
      return playerData.hasAscended === true;
    case 'event_active':
      return playerData.eventActive === true;
    default:
      return true;
  }
}

/**
 * 获取商店解锁描述
 */
export function getShopUnlockDescription(shopType: ShopType): string | null {
  const config = SHOP_CONFIGS[shopType];
  return config?.unlockCondition?.description || null;
}
