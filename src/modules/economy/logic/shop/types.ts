/**
 * 商店系统类型定义
 * 
 * 支持多货币、多商店类型、条件验证的完整商店系统
 */

import { ItemRarity, ItemDefinition, Technique, Equipment } from '@/shared/lib/types';

// ============================================
// 货币系统类型
// ============================================

/** 货币类型枚举 */
export type CurrencyType =
  | 'spirit_stone'      // 灵石（主货币）
  | 'contribution'      // 势力贡献点
  | 'sect_point'        // 宗门积分
  | 'honor'             // 荣誉值
  | 'ascension_mark'    // 飞升印记
  | 'event_token'       // 活动代币
  ;

/** 货币配置 */
export interface CurrencyConfig {
  type: CurrencyType;
  name: string;
  icon: string;
  color: string;
  description: string;
  maxStack: number;
  isTradeable: boolean;
}

/** 货币配置表 */
export const CURRENCY_CONFIGS: Record<CurrencyType, CurrencyConfig> = {
  spirit_stone: {
    type: 'spirit_stone',
    name: '灵石',
    icon: '💎',
    color: 'yellow',
    description: '修仙界通用货币',
    maxStack: 999999999,
    isTradeable: true,
  },
  contribution: {
    type: 'contribution',
    name: '贡献点',
    icon: '⭐',
    color: 'blue',
    description: '势力贡献点，可通过完成任务获得',
    maxStack: 999999,
    isTradeable: false,
  },
  sect_point: {
    type: 'sect_point',
    name: '宗门积分',
    icon: '🏛️',
    color: 'purple',
    description: '宗门内部积分',
    maxStack: 99999,
    isTradeable: false,
  },
  honor: {
    type: 'honor',
    name: '荣誉值',
    icon: '🏆',
    color: 'orange',
    description: '竞技场荣誉',
    maxStack: 99999,
    isTradeable: false,
  },
  ascension_mark: {
    type: 'ascension_mark',
    name: '飞升印记',
    icon: '✨',
    color: 'cyan',
    description: '飞升后获得的印记',
    maxStack: 9999,
    isTradeable: false,
  },
  event_token: {
    type: 'event_token',
    name: '活动代币',
    icon: '🎫',
    color: 'pink',
    description: '限时活动代币',
    maxStack: 9999,
    isTradeable: false,
  },
};

/** 玩家货币库存 */
export interface PlayerCurrencies {
  spirit_stone: number;
  contribution: number;
  sect_point: number;
  honor: number;
  ascension_mark: number;
  event_token: number;
}

/** 创建默认货币库存 */
export function createDefaultCurrencies(): PlayerCurrencies {
  return {
    spirit_stone: 0,
    contribution: 0,
    sect_point: 0,
    honor: 0,
    ascension_mark: 0,
    event_token: 0,
  };
}

/** 货币花费 */
export interface CurrencyCost {
  type: CurrencyType;
  amount: number;
}

/** 多货币花费配置 */
export interface PriceConfig {
  primary: CurrencyCost;
  alternatives?: CurrencyCost[];
  /** 动态价格配置 */
  dynamic?: DynamicPrice;
}

/** 动态价格配置 */
export interface DynamicPrice {
  baseAmount: number;
  levelMultiplier: number;
  formula: 'linear' | 'exponential';
}

// ============================================
// 商品系统类型
// ============================================

/** 商品类型 */
export type ProductType =
  | 'item'        // 物品
  | 'technique'   // 功法
  | 'equipment'   // 装备
  | 'fragment'    // 碎片
  | 'special'     // 特殊商品
  ;

/** 商品定义 */
export interface ProductDefinition {
  id: string;
  name: string;
  type: ProductType;
  rarity: ItemRarity;
  description: string;
  icon?: string;
  
  /** 物品引用 */
  itemDef?: ItemDefinition;
  
  /** 效果预览 */
  effects?: ProductEffect[];
}

/** 商品效果 */
export interface ProductEffect {
  label: string;
  value: string;
  color?: string;
}

/** 购买条件类型 */
export type ConditionType =
  | 'level_min'
  | 'level_max'
  | 'realm_min'
  | 'faction_member'
  | 'faction_rank_min'
  ;

/** 购买条件 */
export interface PurchaseCondition {
  type: ConditionType;
  value: number | string | boolean;
  description: string;
}

/** 限购类型 */
export type LimitType = 'daily' | 'weekly' | 'monthly' | 'lifetime' | 'stock';

/** 限购配置 */
export interface PurchaseLimit {
  type: LimitType;
  limit: number;
  stock?: number;
}

/** 折扣配置 */
export interface Discount {
  type: 'percent' | 'fixed';
  value: number;
  reason: string;
  expireTime?: number;
}

/** 商品配置（定义文件用） */
export interface ProductConfig {
  definition: ProductDefinition;
  price: PriceConfig;
  conditions?: PurchaseCondition[];
  purchaseLimit?: PurchaseLimit;
  unlockCondition?: { type: string; value: number | string | boolean; description: string };
}

/** 商品实例（运行时） */
export interface ShopProduct {
  id: string;
  definition: ProductDefinition;
  price: CurrencyCost;
  originalPrice?: number;
  conditions?: PurchaseCondition[];
  purchaseLimit?: PurchaseLimit;
  discount?: Discount;
  unlocked: boolean;
  purchased: number;
}

// ============================================
// 商店类型定义
// ============================================

/** 商店类型 */
export type ShopType =
  | 'normal'        // 普通商店
  | 'faction'       // 势力商店
  | 'blackmarket'   // 黑市
  | 'arena'         // 竞技商店
  | 'ascension'     // 飞升商店
  | 'event'         // 活动商店
  ;

/** 商店解锁条件类型 */
export type ShopUnlockType = 'level' | 'faction_member' | 'arena_guide' | 'ascension' | 'event_active';

/** 商品生成策略类型 */
export type ProductStrategyType = 'static' | 'dynamic' | 'mixed';

/** 商品生成策略 */
export interface ProductGenerationStrategy {
  type: ProductStrategyType;
  staticProducts?: string[];
  dynamicConfig?: DynamicProductConfig;
}

/** 动态商品配置 */
export interface DynamicProductConfig {
  productPool: string[];
  randomCount: number;
  discountRange: { min: number; max: number };
  limitRange: { min: number; max: number };
}

/** 刷新策略类型 */
export type RefreshType = 'daily' | 'weekly' | 'manual';

/** 刷新策略 */
export interface RefreshStrategy {
  type: RefreshType;
  refreshHour?: number;
  manualRefreshCost?: CurrencyCost;
  dailyFreeRefresh?: number;
  /** 花费递增（每次刷新增加） */
  costIncrement?: number;
  /** 最大花费 */
  maxCost?: number;
}

/** 商店UI配置 */
export interface ShopUIConfig {
  groupBy: 'type' | 'rarity' | 'none';
  sortBy: 'price' | 'rarity' | 'name';
  displayMode: 'grid' | 'list';
  columns: number;
}

/** 商店配置 */
export interface ShopConfig {
  id: ShopType;
  name: string;
  description: string;
  icon: string;
  unlockCondition?: { type: string; value: number | string | boolean; description: string };
  primaryCurrency: CurrencyType;
  productStrategy: ProductGenerationStrategy;
  refreshStrategy?: RefreshStrategy;
  uiConfig: ShopUIConfig;
}

// ============================================
// 购买结果类型
// ============================================

/** 条件检查结果 */
export interface ConditionResult {
  condition: PurchaseCondition;
  passed: boolean;
}

/** 条件验证结果 */
export interface ConditionCheckResult {
  allPassed: boolean;
  results: ConditionResult[];
}

/** 购买结果 */
export interface PurchaseResult {
  success: boolean;
  error?: string;
  newCurrencies?: PlayerCurrencies;
  rewards?: PurchaseReward[];
  failedConditions?: ConditionResult[];
}

/** 购买奖励 */
export interface PurchaseReward {
  type: 'item' | 'technique' | 'equipment' | 'fragment';
  data: ItemDefinition | Technique | Equipment | any;
  quantity: number;
}

/** 购买记录 */
export interface PurchaseRecord {
  productId: string;
  shopType: ShopType;
  purchased: number;
  lastPurchaseTime: number;
  resetTime: number;
}

/** 商店状态 */
export interface ShopState {
  activeShop: ShopType;
  shopProducts: Partial<Record<ShopType, ShopProduct[]>>;
  refreshTimes: Partial<Record<ShopType, number>>;
  purchaseRecords: Record<string, PurchaseRecord>;
  unlockedShops: ShopType[];
}

/** 商店持久化数据 */
export interface ShopPersistData {
  purchaseRecords: Record<string, PurchaseRecord>;
  refreshTimes: Partial<Record<ShopType, number>>;
  blackMarketProducts?: string[];
}

// ============================================
// 商店等级系统
// ============================================

/** 商店等级配置 */
export interface ShopLevelConfig {
  level: number;
  requiredExp: number;
  discount: number;           // 永久折扣百分比
  limitBonus: number;         // 限购数量加成百分比
  features: string[];         // 解锁功能
  description: string;
}

/** 商店等级数据 */
export interface ShopLevelData {
  level: number;
  exp: number;
  totalSpent: number;
  weeklySpent: number;
  lastWeeklyReset: number;
  unlockedProducts: string[];
}

/** 商店等级奖励表 */
export const SHOP_LEVEL_CONFIGS: ShopLevelConfig[] = [
  { level: 1, requiredExp: 0, discount: 0, limitBonus: 0, features: [], description: '新手商店' },
  { level: 2, requiredExp: 1000, discount: 1, limitBonus: 0, features: ['稀有材料'], description: '解锁稀有材料' },
  { level: 3, requiredExp: 5000, discount: 2, limitBonus: 10, features: ['功法+1'], description: '功法购买上限+1' },
  { level: 4, requiredExp: 15000, discount: 3, limitBonus: 10, features: ['史诗材料'], description: '解锁史诗材料' },
  { level: 5, requiredExp: 50000, discount: 5, limitBonus: 20, features: ['黑市刷新+1'], description: '黑市免费刷新+1' },
  { level: 6, requiredExp: 100000, discount: 6, limitBonus: 20, features: ['随机宝箱'], description: '解锁随机宝箱' },
  { level: 7, requiredExp: 250000, discount: 7, limitBonus: 30, features: ['传说材料'], description: '解锁传说材料' },
  { level: 8, requiredExp: 500000, discount: 8, limitBonus: 30, features: ['折扣券'], description: '获得折扣券' },
  { level: 9, requiredExp: 1000000, discount: 9, limitBonus: 40, features: ['神秘商人+'], description: '神秘商人概率提升' },
  { level: 10, requiredExp: 2500000, discount: 10, limitBonus: 50, features: ['全部解锁'], description: '限购+50%' },
];

/** 获取商店等级配置 */
export function getShopLevelConfig(level: number): ShopLevelConfig {
  return SHOP_LEVEL_CONFIGS[Math.min(level, 10) - 1] || SHOP_LEVEL_CONFIGS[0];
}

/** 计算商店等级 */
export function calculateShopLevel(exp: number): { level: number; currentExp: number; nextExp: number } {
  let level = 1;
  let accumulated = 0;
  
  for (let i = 1; i < SHOP_LEVEL_CONFIGS.length; i++) {
    if (exp >= accumulated + SHOP_LEVEL_CONFIGS[i].requiredExp) {
      accumulated += SHOP_LEVEL_CONFIGS[i].requiredExp;
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentExp = exp - accumulated;
  const nextExp = level < 10 ? SHOP_LEVEL_CONFIGS[level].requiredExp : 0;
  
  return { level, currentExp, nextExp };
}

// ============================================
// 限时特卖系统
// ============================================

/** 特卖商品 */
export interface SaleProduct {
  productId: string;
  originalPrice: number;
  salePrice: number;
  discount: number;           // 折扣百分比 (30 = 30% off)
  purchased: boolean;
  currency: CurrencyType;
}

/** 限时特卖数据 */
export interface DailySaleData {
  products: SaleProduct[];
  refreshTime: number;        // 下次刷新时间戳
  previewCategory: string;    // 明日预告分类
}

/** 特卖商品池权重 */
export const SALE_PRODUCT_WEIGHTS = {
  normal: 50,     // 普通商店商品权重
  blackmarket: 30, // 黑市商品权重
  rare: 20,       // 稀有商品权重
};

// ============================================
// 收藏系统
// ============================================

/** 收藏数据 */
export interface FavoriteData {
  products: string[];         // 商品ID列表
  maxSlots: number;           // 最大收藏槽位
  priceAlerts: PriceAlert[];  // 降价提醒
}

/** 降价提醒 */
export interface PriceAlert {
  productId: string;
  targetPrice: number;
  createdAt: number;
  triggered: boolean;
}

/** 创建默认收藏数据 */
export function createDefaultFavoriteData(level: number = 1): FavoriteData {
  return {
    products: [],
    maxSlots: 5 + Math.floor(level / 2),  // 每升2级增加1个槽位
    priceAlerts: [],
  };
}

// ============================================
// 神秘商人系统
// ============================================

/** 神秘商人数据 */
export interface MysteryMerchantData {
  active: boolean;
  appearTime: number;         // 出现时间
  expireTime: number;         // 过期时间
  products: ShopProduct[];
  visited: boolean;           // 是否已访问过
}

/** 神秘商人配置 */
export const MYSTERY_MERCHANT_CONFIG = {
  baseAppearChance: 0.2,      // 基础出现概率 20%
  levelBonus: 0.02,           // 每级增加概率
  stayDuration: 4 * 60 * 60 * 1000, // 停留4小时
  minProducts: 3,
  maxProducts: 5,
  discountRange: { min: 20, max: 40 }, // 折扣范围 20%-40%
};

// ============================================
// 商品筛选和排序
// ============================================

/** 商品分类 */
export type ProductCategory = 'all' | 'consumable' | 'material' | 'technique' | 'equipment' | 'special';

/** 排序方式 */
export type SortMode = 'default' | 'price_asc' | 'price_desc' | 'rarity' | 'name';

/** 筛选条件 */
export interface FilterCondition {
  category: ProductCategory;
  rarity?: ItemRarity;
  maxPrice?: number;
  unlockedOnly?: boolean;
}

// ============================================
// 综合商店状态
// ============================================

/** 完整商店状态 */
export interface CompleteShopState {
  // 基础状态
  activeShop: ShopType;
  
  // 商店等级
  levelData: ShopLevelData;
  
  // 限时特卖
  dailySale: DailySaleData;
  
  // 神秘商人
  mysteryMerchant: MysteryMerchantData | null;
  
  // 收藏
  favorites: FavoriteData;
  
  // 持久化
  persistData: ShopPersistData;
}

// ============================================
// 商店刷新系统
// ============================================

/** 刷新配置（商店级别） */
export interface ShopRefreshConfig {
  /** 刷新类型 */
  type: RefreshType;
  /** 刷新间隔（毫秒） */
  interval: number;
  /** 每日免费刷新次数 */
  dailyFreeRefresh: number;
  /** 手动刷新花费 */
  manualRefreshCost: CurrencyCost;
  /** 花费递增 */
  costIncrement?: number;
  /** 最大花费 */
  maxCost?: number;
  /** 是否支持手动刷新 */
  supportsManualRefresh: boolean;
}

/** 刷新状态 */
export interface ShopRefreshState {
  /** 上次刷新时间 */
  lastRefreshTime: number;
  /** 下次刷新时间 */
  nextRefreshTime: number;
  /** 今日手动刷新次数 */
  manualRefreshCount: number;
  /** 今日重置时间 */
  dailyResetTime: number;
  /** 当前商品ID列表 */
  productIds: string[];
}

/** 刷新倒计时 */
export interface RefreshCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  formatted: string;
}
