/**
 * modules/shop — 商店系统（适配统一物品系统）
 */

export type {
  ShopType,
  ShopProduct,
  ShopConfig,
  PurchaseResult,
} from './types';

export {
  canPurchase,
  getProductDisplay,
  calculatePurchase,
} from './logic/shopService';
