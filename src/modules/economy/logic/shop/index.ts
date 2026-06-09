/**
 * Barrel export for lib/game/shop — shop-related services and types
 */

// 类型定义
export * from './types';

// 货币服务
export { CurrencyService, migrateCurrencies } from './currencyService';

// 每日特卖
export { DailySaleService } from './dailySaleService';

// 商品配置
export {
  NORMAL_SHOP_PRODUCTS,
  FACTION_SHOP_PRODUCTS,
  BLACKMARKET_PRODUCT_POOL,
  ARENA_SHOP_PRODUCTS,
  ASCENSION_SHOP_PRODUCTS,
  ALL_PRODUCTS,
  getProductConfig,
} from './productConfigs';

// 刷新服务
export { RefreshService } from './refreshService';
export type { RefreshResult, RefreshState, RefreshConfig } from './refreshService';

// 商店配置
export {
  SHOP_CONFIGS,
  getShopConfig,
  getAllShopTypes,
  getUnlockedShops,
  isShopUnlocked,
  getShopUnlockDescription,
} from './shopConfigs';

// 商店等级
export { ShopLevelService } from './shopLevelService';

// 商店服务
export { ShopService } from './shopService';
export type { PlayerDataForShop, PurchaseCallbackData } from './shopService';

// 商店任务
export {
  SHOP_TASKS,
  getDailyShopTasks,
  getWeeklyShopTasks,
  createShopTaskState,
  checkTaskComplete,
} from './shopTaskService';
export type {
  ShopTaskType,
  ShopTaskReward,
  ShopTask,
  ShopTaskCheckData,
  ShopTaskState,
} from './shopTaskService';
