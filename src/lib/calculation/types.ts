/**
 * 统一数值计算系统 - 核心类型定义
 * 
 * 定义所有数值计算相关的类型，确保类型安全和一致性
 */

// ============================================
// 基础类型定义
// ============================================

/** 可计算属性名称 */
export type CalculableStat = 
  // 战斗属性
  | 'maxHp'           // 最大生命值
  | 'maxMp'           // 最大法力值
  | 'attack'          // 攻击力
  | 'defense'         // 防御力
  | 'critRate'        // 暴击率
  | 'critDamage'      // 暴击伤害
  | 'dodgeRate'       // 闪避率
  // 修炼属性
  | 'cultivationExp'  // 修炼经验效率
  | 'breakthroughRate'// 突破成功率
  | 'techniqueExp'    // 功法经验效率
  // 经济属性
  | 'expGain'         // 经验获取倍率
  | 'spiritStoneGain' // 灵石获取倍率
  | 'dropRate'        // 掉落率
  | 'rarityBoost'     // 稀有度提升
  // 特殊属性
  | 'luck'            // 幸运值（影响暴击、闪避、掉落等）
  | 'power'           // 综合战力
  ;

/** 可计算属性列表（用于遍历） */
export const CalculableStatList: CalculableStat[] = [
  'maxHp', 'maxMp', 'attack', 'defense', 'critRate', 'critDamage', 'dodgeRate',
  'cultivationExp', 'breakthroughRate', 'techniqueExp',
  'expGain', 'spiritStoneGain', 'dropRate', 'rarityBoost',
  'luck', 'power',
];

/** 战斗属性子集 */
export type CombatStat = Extract<CalculableStat, 'maxHp' | 'maxMp' | 'attack' | 'defense' | 'critRate' | 'critDamage' | 'dodgeRate'>;

/** 经济属性子集 */
export type EconomyStat = Extract<CalculableStat, 'expGain' | 'spiritStoneGain' | 'dropRate' | 'rarityBoost'>;

/** 修炼属性子集 */
export type CultivationStat = Extract<CalculableStat, 'cultivationExp' | 'breakthroughRate' | 'techniqueExp'>;

/** 属性名别名映射（兼容旧系统） */
export type StatName = CalculableStat;

/** 属性分类 */
export type StatCategory = 'combat' | 'cultivation' | 'economy' | 'special';

/** 效果来源类型 */
export type EffectSourceType = 
  | 'world_danger'      // 世界危险
  | 'world_opportunity' // 世界机缘
  | 'world_base'        // 世界基础加成
  | 'pill'              // 丹药
  | 'equipment'         // 装备
  | 'technique'         // 功法
  | 'title'             // 称号
  | 'buff'              // 战斗Buff
  | 'realm'             // 境界加成
  | 'state'             // 状态效果
  | 'passive'           // 被动技能
  | 'faction'           // 势力特性
  | 'school'            // 流派加成
  | 'enemy_buff'        // 敌人增益（用于世界危险给敌人加成）
  ;

/** 效果计算类型 */
export type EffectCalcType = 
  | 'add'       // 加法叠加：final = base + sum(values)
  | 'multiply'  // 乘法叠加：final = base * (1 + sum(ratios))
  | 'override'  // 覆盖取最大/最小：final = max/min(values)
  | 'chain'     // 链式乘法：final = base * ratio1 * ratio2 * ...
  ;

/** 计算类型别名 */
export type CalculationType = EffectCalcType;

/** 效果优先级 */
export type EffectPriority = 
  | 'base'      // 1: 基础值（角色属性）
  | 'passive'   // 2: 被动加成（功法、装备）
  | 'faction'   // 3: 势力加成（势力特性、流派加成）
  | 'buff'      // 4: Buff效果（临时加成）
  | 'world'     // 5: 世界效果（环境修正）
  | 'special'   // 6: 特殊效果（覆盖性修正）
  ;

/** 效果状态 */
export type EffectState = 'active' | 'suspended' | 'expired' | 'dispelled';

/** 属性到分类的映射 */
export const STAT_CATEGORIES: Record<CalculableStat, StatCategory> = {
  // 战斗属性
  maxHp: 'combat',
  maxMp: 'combat',
  attack: 'combat',
  defense: 'combat',
  critRate: 'combat',
  critDamage: 'combat',
  dodgeRate: 'combat',
  // 修炼属性
  cultivationExp: 'cultivation',
  breakthroughRate: 'cultivation',
  techniqueExp: 'cultivation',
  // 经济属性
  expGain: 'economy',
  spiritStoneGain: 'economy',
  dropRate: 'economy',
  rarityBoost: 'economy',
  // 特殊属性
  luck: 'special',
  power: 'special',
};

/** 优先级数值映射（用于排序） */
export const PRIORITY_ORDER: Record<EffectPriority, number> = {
  base: 1,
  passive: 2,
  faction: 3,
  buff: 4,
  world: 5,
  special: 6,
};

// ============================================
// 效果定义
// ============================================

/** 统一效果定义 */
export interface UnifiedEffect {
  /** 效果唯一ID */
  id: string;
  
  /** 效果来源类型 */
  sourceType: EffectSourceType;
  
  /** 效果来源ID（如装备ID、功法ID等） */
  sourceId: string;
  
  /** 效果来源名称（用于显示和追溯） */
  sourceName: string;
  
  /** 目标属性 */
  targetStat: CalculableStat;
  
  /** 计算类型 */
  calcType: EffectCalcType;
  
  /** 效果值 */
  value: number;
  
  /** 优先级 */
  priority: EffectPriority;
  
  /** 效果标签（用于分组和过滤） */
  tags: string[];
  
  /** 生效条件（可选） */
  condition?: EffectCondition;
  
  /** 持续时间（-1表示永久，0表示即时） */
  duration: number;
  
  /** 剩余持续时间（动态） */
  remainingDuration: number;
  
  /** 是否可驱散 */
  dispellable: boolean;
  
  /** 效果层级（同优先级内的排序） */
  layer: number;
}

/** 效果条件 */
export interface EffectCondition {
  /** 条件类型 */
  type: 'in_battle' | 'out_battle' | 'in_world' | 'hp_below' | 'mp_below' | 'random';
  
  /** 条件参数 */
  params?: Record<string, number | string | boolean>;
  
  /** 条件取反 */
  negate?: boolean;
}

/** 效果贡献记录（用于追溯） */
export interface EffectContribution {
  /** 来源类型 */
  sourceType: EffectSourceType;
  
  /** 来源名称 */
  sourceName: string;
  
  /** 计算类型 */
  calcType: EffectCalcType;
  
  /** 效果值 */
  value: number;
  
  /** 对最终值的贡献（计算后） */
  contribution: number;
  
  /** 效果ID */
  effectId: string;
}

// ============================================
// 边界约束定义
// ============================================

/** 属性边界约束 */
export interface StatBounds {
  /** 属性名 */
  stat: CalculableStat;
  
  /** 下界 */
  min: number;
  
  /** 上界 */
  max: number;
  
  /** 下界行为 */
  minBehavior: 'clamp' | 'error' | 'warn';
  
  /** 上界行为 */
  maxBehavior: 'clamp' | 'error' | 'warn';
  
  /** 默认值（用于异常情况） */
  defaultValue: number;
}

// ============================================
// 计算结果定义
// ============================================

/** 单属性计算结果 */
export interface StatCalculationResult {
  /** 目标属性 */
  stat: CalculableStat;
  
  /** 最终值 */
  finalValue: number;
  
  /** 基础值 */
  baseValue: number;
  
  /** 计算前的值 */
  preClampValue: number;
  
  /** 边界约束信息 */
  clamping: {
    applied: boolean;
    lowerBound: number;
    upperBound: number;
  };
  
  /** 效果贡献列表（按贡献排序） */
  contributions: EffectContribution[];
  
  /** 计算公式描述 */
  formulaDescription: string;
  
  /** 警告信息 */
  warnings: string[];
}

/** 批量计算结果 */
export interface CalculationResult {
  /** 计算ID */
  calculationId: string;
  
  /** 计算时间 */
  timestamp: number;
  
  /** 各属性结果 */
  stats: Map<CalculableStat, StatCalculationResult>;
  
  /** 全局警告 */
  globalWarnings: string[];
  
  /** 计算耗时（毫秒） */
  duration: number;
}

// ============================================
// 效果聚合定义
// ============================================

/** 聚合后的效果组 */
export interface AggregatedEffects {
  /** 加法效果列表 */
  additives: UnifiedEffect[];
  
  /** 乘法效果列表 */
  multipliers: UnifiedEffect[];
  
  /** 覆盖效果列表 */
  overrides: UnifiedEffect[];
  
  /** 链式效果列表 */
  chains: UnifiedEffect[];
}

// ============================================
// 额外类型定义
// ============================================

/** 效果元数据 */
export interface EffectMetadata {
  /** 来源类型 */
  sourceType: EffectSourceType;
  /** 来源ID */
  sourceId: string;
  /** 来源名称 */
  sourceName: string;
  /** 创建时间 */
  createdAt?: number;
  /** 额外信息 */
  extra?: Record<string, unknown>;
}

/** 效果约束条件 */
export interface EffectConstraint {
  /** 条件类型 */
  type: string;
  /** 条件参数 */
  value?: number | string | boolean;
  /** 是否取反 */
  negate?: boolean;
}

/** 效果追踪记录 */
export interface EffectTrace {
  /** 效果ID */
  effectId: string;
  /** 来源信息 */
  source: EffectMetadata;
  /** 计算类型 */
  calcType: CalculationType;
  /** 原始值 */
  originalValue: number;
  /** 应用后的值 */
  appliedValue: number;
  /** 计算顺序 */
  order: number;
}

/** 计算警告 */
export interface CalculationWarning {
  /** 警告类型 */
  type: 'overflow' | 'underflow' | 'invalid' | 'missing' | 'conflict';
  /** 警告消息 */
  message: string;
  /** 相关属性 */
  stat?: CalculableStat;
  /** 相关效果ID */
  effectId?: string;
  /** 时间戳 */
  timestamp: number;
}

/** 边界配置 */
export interface BoundaryConfig {
  /** 是否启用边界检查 */
  enabled: boolean;
  /** 溢出行为 */
  overflowBehavior: 'clamp' | 'error' | 'warn';
  /** 下溢行为 */
  underflowBehavior: 'clamp' | 'error' | 'warn';
  /** 自定义边界 */
  customBounds?: Partial<Record<CalculableStat, { min: number; max: number }>>;
}

/** 属性边界（简化版） */
export interface StatBound {
  /** 下界 */
  min: number;
  /** 上界 */
  max: number;
}

/** 系统配置 */
export interface SystemConfig {
  /** 边界配置 */
  boundary: BoundaryConfig;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存TTL（毫秒） */
  cacheTTL: number;
  /** 是否启用追踪 */
  enableTracing: boolean;
  /** 最大效果数量 */
  maxEffects: number;
}
