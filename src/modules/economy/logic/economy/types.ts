/**
 * 经济平衡系统 - 类型定义
 * 
 * 设计原则：
 * 1. 货币产出/消耗平衡
 * 2. 后期货币调节机制
 * 3. 多种消耗途径
 * 4. 经济监控与健康度检测
 */

import { EquipmentAffix as EquipmentAffixType } from '@/modules/equipment/data/equipmentAffixData';
import { CurrencyType, PlayerCurrencies, CURRENCY_CONFIGS } from '../shop/types';
import { ItemRarity, Protagonist, Equipment, Technique, CharacterStats } from '@/core/types';
// 导入已有的 EquipmentAffix 类型用于内部使用

// 重新导出已有的 EquipmentAffix 类型
export type { EquipmentAffix } from '@/modules/equipment/data/equipmentAffixData';

// 内部使用的类型别名（因为接口内部不能使用导入的类型作为属性）
type InternalEquipmentAffix = EquipmentAffixType;

// ============================================
// 灵石消耗系统类型
// ============================================

/** 消耗效果类型 */
export type SinkEffectType = 
  | 'stat_boost'        // 属性提升
  | 'item_reforge'      // 装备重铸
  | 'skill_upgrade'     // 功法升级
  | 'appearance'        // 外观
  | 'breakthrough'      // 境界突破辅助
  | 'stat_reset';       // 属性重置

/** 消耗途径定义 */
export interface SpiritStoneSink {
  /** 唯一标识 */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 图标 */
  icon: string;
  
  /** 消耗计算函数 */
  calculateCost: (params: Record<string, any>) => number;
  
  /** 每日限制 */
  maxPerDay?: number;
  /** 冷却时间（毫秒） */
  cooldown?: number;
  
  /** 效果类型 */
  effectType: SinkEffectType;
  /** 效果描述 */
  effectDescription: string;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 解锁条件 */
  unlockCondition?: {
    minLevel?: number;
    minRealm?: string;
    requiredItemId?: string;
  };
}

/** 消耗效果应用结果 */
export interface SinkApplyResult {
  success: boolean;
  cost: number;
  error?: string;
  effects?: {
    statBoost?: { stat: string; value: number };
    newAffixes?: InternalEquipmentAffix[];
    levelUp?: { oldLevel: number; newLevel: number };
    breakthroughBonus?: number;
    attributesReset?: boolean;
  };
}

// 注意：EquipmentAffix 类型从 '../../data/equipmentAffixData' 重新导出

// ============================================
// 货币调节系统类型
// ============================================

/** 货币调节配置 */
export interface CurrencyRegulationConfig {
  currencyType: CurrencyType;
  
  /** 基础产出倍率 */
  productionMultiplier: number;
  
  /** 等级调节配置 */
  levelScaling: {
    minLevel: number;
    maxLevel: number;
    multiplierRange: [number, number];
  };
  
  /** 后期调节阈值 */
  lateGameThresholds: Array<{
    level: number;
    multiplier: number;
  }>;
}

/** 货币奖励调节参数 */
export interface CurrencyRewardParams {
  baseReward: number;
  currencyType: CurrencyType;
  playerLevel: number;
  worldType?: string;
  enemyTier?: string;
}

// ============================================
// 经济监控系统类型
// ============================================

/** 经济统计数据 */
export interface EconomyStatistics {
  /** 总灵石产出 */
  totalSpiritStoneProduced: number;
  /** 总灵石消耗 */
  totalSpiritStoneConsumed: number;
  
  /** 各消耗途径使用次数 */
  sinkUsage: Record<string, number>;
  
  /** 按来源统计产出 */
  productionBySource: Record<string, number>;
  
  /** 统计周期开始时间 */
  periodStart: number;
  /** 最后更新时间 */
  lastUpdated: number;
  
  /** 历史数据（按天） */
  dailyHistory: DailyEconomyData[];
}

/** 每日经济数据 */
export interface DailyEconomyData {
  date: string;
  produced: number;
  consumed: number;
  ratio: number;
}

/** 经济健康状态 */
export type EconomyHealthStatus = 'healthy' | 'inflation' | 'deflation';

/** 经济健康度报告 */
export interface EconomyHealthReport {
  status: EconomyHealthStatus;
  ratio: number;
  recommendation: string;
  details: {
    produced: number;
    consumed: number;
    topSinks: Array<{ id: string; name: string; count: number }>;
    trend: 'improving' | 'stable' | 'worsening';
  };
}

// ============================================
// 装备重铸系统类型
// ============================================

/** 重铸配置 */
export interface ReforgeConfig {
  /** 稀有度倍率 */
  rarityMultiplier: Record<ItemRarity, number>;
  /** 等级基础消耗 */
  baseCostPerLevel: number;
  /** 保留词缀的额外消耗 */
  preserveAffixCost: number;
  /** 最大词缀数 */
  maxAffixes: Record<ItemRarity, number>;
}

/** 重铸请求 */
export interface ReforgeRequest {
  equipmentId: string;
  preserveAffixIds?: string[];
  targetRarity?: ItemRarity;
}

/** 重铸结果 */
export interface ReforgeResult {
  success: boolean;
  cost: number;
  newAffixes?: InternalEquipmentAffix[];
  error?: string;
}

// ============================================
// 功法突破系统类型
// ============================================

/** 功法突破配置 */
export interface TechniqueBreakthroughConfig {
  /** 每级突破消耗 */
  costPerLevel: number;
  /** 等级上限增量 */
  levelIncrease: number;
  /** 每日限制 */
  maxPerDay: number;
  /** 成功率加成（消耗后） */
  successRateBonus: number;
}

/** 功法突破请求 */
export interface TechniqueBreakthroughRequest {
  techniqueId: string;
  useSpiritStone: boolean;
}

/** 功法突破结果 */
export interface TechniqueBreakthroughResult {
  success: boolean;
  cost: number;
  newMaxLevel?: number;
  error?: string;
}

// ============================================
// 境界突破辅助系统类型
// ============================================

/** 境界突破辅助配置 */
export interface RealmBreakthroughConfig {
  /** 成功率加成 */
  successRateBonus: number;
  /** 基础消耗 */
  baseCost: number;
  /** 境界等级倍率 */
  realmMultiplier: number;
  /** 每日限制 */
  maxPerDay: number;
}

/** 境界突破辅助请求 */
export interface RealmBreakthroughRequest {
  realmLevel: number;
}

/** 境界突破辅助结果 */
export interface RealmBreakthroughResult {
  success: boolean;
  cost: number;
  bonusApplied: boolean;
  error?: string;
}

// ============================================
// 属性重置系统类型
// ============================================

/** 属性重置配置 */
export interface StatResetConfig {
  /** 固定消耗 */
  fixedCost: number;
  /** 每日限制 */
  maxPerDay: number;
  /** 是否返还所有属性点 */
  returnAllPoints: boolean;
}

/** 属性重置结果 */
export interface StatResetResult {
  success: boolean;
  cost: number;
  returnedPoints: number;
  error?: string;
}

// ============================================
// 消耗途径配置
// ============================================

/** 灵石消耗途径配置表 */
export const SPIRIT_STONE_SINKS: SpiritStoneSink[] = [
  {
    id: 'equipment_reforge',
    name: '装备重铸',
    description: '消耗灵石重新生成装备词缀',
    icon: '⚒️',
    calculateCost: (params) => {
      const { level, rarity } = params;
      const rarityMultiplier: Record<string, number> = {
        '普通': 1,
        '稀有': 2,
        '史诗': 5,
        '传说': 10,
      };
      return level * 100 * (rarityMultiplier[String(rarity)] || 1);
    },
    cooldown: 0,
    effectType: 'item_reforge',
    effectDescription: '重新生成装备词缀',
    enabled: true,
    unlockCondition: {
      minLevel: 10,
    },
  },
  {
    id: 'technique_breakthrough',
    name: '功法突破',
    description: '消耗灵石提升功法等级上限',
    icon: '📚',
    calculateCost: (params) => {
      const { currentMaxLevel } = params;
      return currentMaxLevel * 200;
    },
    maxPerDay: 3,
    effectType: 'skill_upgrade',
    effectDescription: '功法等级上限+5',
    enabled: true,
    unlockCondition: {
      minLevel: 20,
    },
  },
  {
    id: 'realm_breakthrough_assist',
    name: '境界突破辅助',
    description: '消耗灵石提高突破成功率15%',
    icon: '🌟',
    calculateCost: (params) => {
      const { realmLevel } = params;
      return realmLevel * 500;
    },
    maxPerDay: 5,
    effectType: 'breakthrough',
    effectDescription: '突破成功率+15%',
    enabled: true,
    unlockCondition: {
      minLevel: 15,
    },
  },
  {
    id: 'stat_reset',
    name: '属性重置',
    description: '消耗灵石重新分配属性点',
    icon: '🔄',
    calculateCost: () => 1000,
    maxPerDay: 1,
    effectType: 'stat_reset',
    effectDescription: '重置所有属性点',
    enabled: true,
    unlockCondition: {
      minLevel: 30,
    },
  },
];

/** 获取消耗途径配置 */
export function getSinkConfig(sinkId: string): SpiritStoneSink | undefined {
  return SPIRIT_STONE_SINKS.find(s => s.id === sinkId);
}

/** 获取所有启用的消耗途径 */
export function getEnabledSinks(): SpiritStoneSink[] {
  return SPIRIT_STONE_SINKS.filter(s => s.enabled);
}

// ============================================
// 货币调节配置
// ============================================

/** 灵石调节配置 */
export const SPIRIT_STONE_REGULATION: CurrencyRegulationConfig = {
  currencyType: 'spirit_stone',
  productionMultiplier: 1.0,
  levelScaling: {
    minLevel: 1,
    maxLevel: 100,
    multiplierRange: [1.0, 0.5],
  },
  lateGameThresholds: [
    { level: 60, multiplier: 0.85 },
    { level: 80, multiplier: 0.7 },
    { level: 100, multiplier: 0.5 },
  ],
};

/** 飞升印记调节配置 */
export const ASCENSION_MARK_REGULATION: CurrencyRegulationConfig = {
  currencyType: 'ascension_mark',
  productionMultiplier: 1.0,
  levelScaling: {
    minLevel: 1,
    maxLevel: 100,
    multiplierRange: [0.5, 1.5],
  },
  lateGameThresholds: [
    { level: 100, multiplier: 1.5 },
  ],
};

/** 所有货币调节配置 */
export const CURRENCY_REGULATIONS: Record<CurrencyType, CurrencyRegulationConfig | null> = {
  spirit_stone: SPIRIT_STONE_REGULATION,
  ascension_mark: ASCENSION_MARK_REGULATION,
  contribution: null,
  sect_point: null,
  honor: null,
  event_token: null,
};

// ============================================
// 重铸配置
// ============================================

/** 装备重铸配置 */
export const REFORGE_CONFIG: ReforgeConfig = {
  rarityMultiplier: {
    '普通': 1,
    '稀有': 2,
    '史诗': 5,
    '传说': 10,
    '神话': 20,
  },
  baseCostPerLevel: 100,
  preserveAffixCost: 500,
  maxAffixes: {
    '普通': 1,
    '稀有': 2,
    '史诗': 3,
    '传说': 4,
    '神话': 5,
  },
};

/** 功法突破配置 */
export const TECHNIQUE_BREAKTHROUGH_CONFIG: TechniqueBreakthroughConfig = {
  costPerLevel: 200,
  levelIncrease: 5,
  maxPerDay: 3,
  successRateBonus: 0.15,
};

/** 境界突破辅助配置 */
export const REALM_BREAKTHROUGH_CONFIG: RealmBreakthroughConfig = {
  successRateBonus: 0.15,
  baseCost: 500,
  realmMultiplier: 1,
  maxPerDay: 5,
};

/** 属性重置配置 */
export const STAT_RESET_CONFIG: StatResetConfig = {
  fixedCost: 1000,
  maxPerDay: 1,
  returnAllPoints: true,
};
