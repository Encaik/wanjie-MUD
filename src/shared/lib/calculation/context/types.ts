/**
 * 计算上下文类型定义
 */

// ============================================
// 输入数据类型
// ============================================

/** 基础属性输入 */
export interface BaseStatsInput {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/** 装备输入 */
export interface EquipmentInput {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  level: number;
  attackBonus: number;
  defenseBonus: number;
  power: number;
  element: string | null;
}

/** 功法输入 */
export interface TechniqueInput {
  id: string;
  name: string;
  type: 'attack' | 'defense';
  rarity: string;
  level: number;
  power: number;
  bonus: number;
  element: string;
}

/** 世界效果输入 */
export interface WorldEffectInput {
  id: string;
  name: string;
  type: 'danger' | 'opportunity';
  level: number;
  statModifications: Partial<Record<string, number>>;
  resourceModifications?: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
  };
  enemyBuffs?: {
    attackBonus?: number;
    defenseBonus?: number;
    hpBonus?: number;
  };
  specialEffects?: string[];
}

/** Buff输入 */
export interface BuffInput {
  id: string;
  name: string;
  type: string;
  value: number;
  duration: number;
  remainingDuration: number;
  targetStat?: string;
}

/** 激活效果输入（丹药等） */
export interface ActiveEffectInput {
  id: string;
  itemId: string;
  itemName: string;
  type: string;
  value: number;
  remainingCount: number;
}

/** 称号效果输入 */
export interface TitleEffectInput {
  targetStat: string;
  calcType: string;
  value: number;
}

/** 称号输入 */
export interface TitleInput {
  id: string;
  name: string;
  rarity: string;
  effects: TitleEffectInput[];
}

/** 境界输入 */
export interface RealmInput {
  name: string;
  level: number;
}

/** 势力特性效果输入 */
export interface FactionTraitEffectInput {
  type: 'stat_bonus' | 'skill_bonus' | 'cultivation_bonus' | 'special_ability' | 'resource_bonus';
  params: Record<string, number | string | boolean>;
  displayText: string;
}

/** 势力特性输入 */
export interface FactionTraitInput {
  id: string;
  name: string;
  description: string;
  type: 'combat' | 'cultivation' | 'resource' | 'special';
  effects: FactionTraitEffectInput[];
}

/** 势力输入 */
export interface FactionInput {
  id: string;
  name: string;
  type: string;
  worldType: string;
  traits: FactionTraitInput[];
  rank?: string; // 势力职阶：disciple, deacon, elder, vice_leader, leader
}

/** 流派输入 */
export interface SchoolInput {
  id: string;
  name: string;
  type: string; // sword, fist, spell, etc.
  worldType: string;
  traits: FactionTraitInput[]; // 复用特性结构
  level?: number; // 流派熟练度等级
}

/** 统一角色上下文（主角和敌人通用） */
export interface CharacterContext {
  /** 角色ID */
  id: string;
  /** 角色类型 */
  type: 'protagonist' | 'enemy' | 'npc';
  /** 等级 */
  level: number;
  /** 境界名称 */
  realm: string;
  /** 境界等级 */
  realmLevel: number;
  /** 基础属性 */
  baseStats: BaseStatsInput;
  /** 阵营标签（用于效果过滤） */
  tags?: string[];
}

// ============================================
// 完整计算上下文
// ============================================

/** 计算输入上下文 */
export interface CalculationContext {
  /** 计算ID（用于追溯） */
  calculationId: string;
  
  /** 计算时间戳 */
  timestamp: number;
  
  /** 角色基础数据（统一格式，主角和敌人通用） */
  character: CharacterContext;
  
  /** 装备数据 */
  equipment: {
    melee: EquipmentInput | null;
    ranged: EquipmentInput | null;
    head: EquipmentInput | null;
    body: EquipmentInput | null;
    legs: EquipmentInput | null;
    feet: EquipmentInput | null;
  };
  
  /** 功法数据 */
  techniques: TechniqueInput[];
  
  /** 世界数据 */
  world: {
    id: string;
    type: string;
    actualCoefficient: number;
    dangers: WorldEffectInput[];
    opportunities: WorldEffectInput[];
  };
  
  /** 当前状态 */
  state: {
    inBattle: boolean;
    currentHp: number;
    maxHp: number;
    currentMp: number;
    maxMp: number;
    activeBuffs: BuffInput[];
    activeEffects: ActiveEffectInput[];
  };
  
  /** 已激活称号 */
  titles: TitleInput[];
  
  /** 境界信息 */
  realm: RealmInput;
  
  /** 势力信息（可选） */
  faction?: FactionInput;
  
  /** 流派信息（可选） */
  school?: SchoolInput;
}

// ============================================
// 上下文构建器选项
// ============================================

/** 上下文构建器选项 */
export interface ContextBuilderOptions {
  /** 是否启用验证 */
  enableValidation: boolean;
  
  /** 是否启用日志 */
  enableLogging: boolean;
  
  /** 自义计算ID */
  calculationId?: string;
}
