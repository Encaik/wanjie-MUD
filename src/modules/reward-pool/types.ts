/**
 * modules/reward-pool/types.ts — 奖励池系统类型定义
 *
 * 定义池子、条目、过滤器、滚动上下文和结果的全部类型。
 * 池子不是静态物品列表，而是对 ItemRegistry 的运行时过滤规则。
 */

import type { Rarity, ItemCategory } from '@/modules/item/types';

// ============================================
// ItemFilter — 物品动态过滤器
// ============================================

/** 物品过滤条件，用于 FilterEntry 在运行时查询 ItemRegistry */
export interface ItemFilter {
  /** 品类过滤（单值或数组） */
  category?: ItemCategory | ItemCategory[];
  /** 子类别过滤（如 'weapon_melee'、'pill_hp'） */
  subcategory?: string | string[];
  /** 最低稀有度（含），默认 common */
  minRarity?: Rarity;
  /** 最高稀有度（含），默认 mythic */
  maxRarity?: Rarity;
  /** 是否可掉落，默认 true */
  isDroppable?: boolean;
  /** 排除的 templateId 列表 */
  exclude?: string[];
  /** 扩展标签（预留） */
  tags?: string[];
}

// ============================================
// EntryCondition — 条目生效条件
// ============================================

/** 条目生效条件，不满足的条目在 resolve 时被剪枝 */
export type EntryCondition =
  | { type: 'playerLevelMin'; value: number }
  | { type: 'playerLevelMax'; value: number }
  | { type: 'worldView'; value: string }
  | { type: 'luckMin'; value: number }
  | { type: 'questCompleted'; questId: string }
  | { type: 'difficultyMin'; value: 'normal' | 'hard' | 'nightmare' };

// ============================================
// PoolEntry — 4 种条目类型
// ============================================

/** 静态条目：指定具体物品模板（Boss 专属掉落、唯一物品） */
export interface StaticEntry {
  type: 'static';
  /** 物品模板 ID（三段式，如 'wanjie-core:cultivation:flame_sword'） */
  templateId: string;
  /** 选择权重 */
  weight: number;
  /** 产出数量 [min, max]，默认 [1, 1] */
  quantity?: [number, number];
  /** 稀有度权重覆写（不指定则使用池子默认） */
  rarityWeights?: Partial<Record<Rarity, number>>;
  /** 生效条件 */
  conditions?: EntryCondition[];
}

/** 过滤条目：运行时查询 ItemRegistry，按条件动态筛选 */
export interface FilterEntry {
  type: 'filter';
  /** 物品过滤条件 */
  filter: ItemFilter;
  /** 选择权重 */
  weight: number;
  /** 产出数量 [min, max]，默认 [1, 1] */
  quantity?: [number, number];
  /** 稀有度权重（必填，每个条目独立投骰） */
  rarityWeights: Partial<Record<Rarity, number>>;
  /** 生效条件 */
  conditions?: EntryCondition[];
}

/** 池子引用条目：引用另一个池子，实现池子组合 */
export interface PoolRefEntry {
  type: 'pool_ref';
  /** 引用的池子 ID */
  poolId: string;
  /** 选择权重 */
  weight: number;
  /** 传递给子池的稀有度覆写 */
  rarityOverride?: Partial<Record<Rarity, number>>;
  /** 生效条件 */
  conditions?: EntryCondition[];
}

/** 货币条目：直接产出货币，不走稀有度投骰 */
export interface CurrencyEntry {
  type: 'currency';
  /** 货币类型标识（如 'spirit_stone'、'sect_coin'） */
  currencyType: string;
  /** 产出数量范围 [min, max] */
  amount: [number, number];
  /** 选择权重 */
  weight: number;
  /** 生效条件 */
  conditions?: EntryCondition[];
}

/** 池子条目联合类型 */
export type PoolEntry = StaticEntry | FilterEntry | PoolRefEntry | CurrencyEntry;

// ============================================
// RewardPool — 池子定义
// ============================================

/** 奖励池定义 */
export interface RewardPool {
  /** 唯一标识（如 'combat_cultivation_boss'） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 条目列表 */
  entries: PoolEntry[];
  /** 每次滚动产出条目数 [min, max] */
  dropCount: [number, number];
  /** 默认稀有度权重（条目未指定时使用） */
  defaultRarityWeights?: Partial<Record<Rarity, number>>;
  /** 世界观限定（null = 通用） */
  worldView?: string | null;
  /** 难度倍率 */
  difficultyMultiplier?: Record<string, number>;
}

// ============================================
// RollContext — 滚动上下文
// ============================================

/** 滚动上下文，由调用方提供 */
export interface RollContext {
  /** 玩家等级 */
  playerLevel: number;
  /** 当前世界观 */
  worldView: string;
  /** 幸运值 */
  luck: number;
  /** 难度等级 */
  difficulty?: 'normal' | 'hard' | 'nightmare';
  /** 随机种子 */
  seed?: number | string;
  /** 外部数量倍率（如双倍掉落活动） */
  quantityMultiplier?: number;
  /** 覆写稀有度上限 */
  maxRarityOverride?: Rarity;
}

// ============================================
// RollResult — 滚动结果
// ============================================

/** 单个物品产出 */
export interface RollResultItem {
  /** 模板 ID */
  templateId: string;
  /** 实例 ID */
  instanceId: string;
  /** 数量 */
  quantity: number;
  /** 稀有度 */
  rarity: Rarity;
}

/** 单个货币产出 */
export interface RollResultCurrency {
  /** 货币类型 */
  type: string;
  /** 数量 */
  amount: number;
}

/** 池子滚动结果 */
export interface RollResult {
  /** 物品产出列表 */
  items: RollResultItem[];
  /** 货币产出列表 */
  currencies: RollResultCurrency[];
  /** 预格式化摘要文本 */
  summary: string;
}

// ============================================
// 内部类型（不导出）
// ============================================

/** resolve 后的条目（权重已归一化） */
export interface ResolvedEntry {
  /** 原始条目 */
  entry: StaticEntry | FilterEntry | CurrencyEntry;
  /** 生效权重 */
  effectiveWeight: number;
  /** 稀有度覆写（来自 PoolRefEntry） */
  rarityOverride?: Partial<Record<Rarity, number>>;
  /** 数量覆写（来自 PoolRefEntry） */
  quantityOverride?: [number, number];
}
