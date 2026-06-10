/**
 * 敌人系统类型定义
 * 
 * 核心设计：
 * 1. 敌人模板与玩家同构
 * 2. 敌人拥有真实的功法和装备
 * 3. 支持多敌人战斗
 */

import { BattleSkill } from '@/modules/combat/logic/battle/types';
import {
  WorldType,
  EnemyTier,
  Technique,
  Equipment,
  ItemRarity,
} from '@/core/types';
import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';

// ============================================
// 行为类型
// ============================================

/** 敌人AI行为类型 */
export type EnemyBehaviorType = 
  | 'aggressive'    // 激进型：优先攻击，高伤害技能
  | 'defensive'     // 防守型：优先防御，低血量回血
  | 'balanced'      // 平衡型：根据情况选择
  | 'strategic'     // 战略型：智能决策
  | 'tactical';     // 战术型：专注目标

// ============================================
// 敌人统计属性
// ============================================

/** 敌人统计属性 */
export interface EnemyStats {
  /** 攻击力 */
  attack: number;
  /** 防御力 */
  defense: number;
  /** 速度 */
  speed: number;
  /** 最大生命值 */
  maxHp: number;
  /** 最大法力值 */
  maxMp: number;
}

// ============================================
// 难度配置
// ============================================

/** 难度系数配置 */
export interface EnemyDifficultyConfig {
  /** 难度系数范围 */
  difficultyRange: { min: number; max: number };
  /** 掉落倍率 */
  dropMultiplier: number;
  /** 经验倍率 */
  expMultiplier: number;
}

/** 分级难度配置 */
export const DIFFICULTY_CONFIG: Record<EnemyTier, EnemyDifficultyConfig> = {
  normal: {
    difficultyRange: { min: 0.8, max: 1.2 },
    dropMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  elite: {
    difficultyRange: { min: 1.2, max: 1.6 },
    dropMultiplier: 1.5,
    expMultiplier: 1.5,
  },
  miniboss: {
    difficultyRange: { min: 1.6, max: 2.0 },
    dropMultiplier: 2.5,
    expMultiplier: 2.5,
  },
  boss: {
    difficultyRange: { min: 2.0, max: 3.0 },
    dropMultiplier: 5.0,
    expMultiplier: 5.0,
  },
};

// ============================================
// 功法装备配置
// ============================================

/** 分级功法装备配置 */
export interface TierEquipmentConfig {
  /** 功法槽位数范围 */
  techniqueSlots: { min: number; max: number };
  /** 功法稀有度权重 */
  techniqueRarity: Record<ItemRarity, number>;
  /** 装备件数 */
  equipmentSlots: number;
  /** 装备稀有度权重 */
  equipmentRarity: Record<ItemRarity, number>;
}

/** 分级功法装备配置 */
export const TIER_EQUIPMENT_CONFIG: Record<EnemyTier, TierEquipmentConfig> = {
  normal: {
    techniqueSlots: { min: 0, max: 1 },
    techniqueRarity: { '普通': 90, '稀有': 10, '史诗': 0, '传说': 0, '神话': 0 },
    equipmentSlots: 1,
    equipmentRarity: { '普通': 90, '稀有': 10, '史诗': 0, '传说': 0, '神话': 0 },
  },
  elite: {
    techniqueSlots: { min: 1, max: 2 },
    techniqueRarity: { '普通': 60, '稀有': 35, '史诗': 5, '传说': 0, '神话': 0 },
    equipmentSlots: 2,
    equipmentRarity: { '普通': 60, '稀有': 35, '史诗': 5, '传说': 0, '神话': 0 },
  },
  miniboss: {
    techniqueSlots: { min: 2, max: 3 },
    techniqueRarity: { '普通': 30, '稀有': 50, '史诗': 18, '传说': 2, '神话': 0 },
    equipmentSlots: 3,
    equipmentRarity: { '普通': 30, '稀有': 50, '史诗': 18, '传说': 2, '神话': 0 },
  },
  boss: {
    techniqueSlots: { min: 3, max: 6 },
    techniqueRarity: { '普通': 10, '稀有': 40, '史诗': 35, '传说': 14, '神话': 1 },
    equipmentSlots: 6,
    equipmentRarity: { '普通': 10, '稀有': 40, '史诗': 35, '传说': 14, '神话': 1 },
  },
};

// ============================================
// 敌人模板
// ============================================

/** 敌人模板定义 */
export interface EnemyTemplate {
  /** 模板唯一ID */
  id: string;
  /** 敌人名称 */
  name: string;
  /** 敌人描述 */
  description: string;
  /** 敌人等级类型 */
  tier: EnemyTier;
  /** 基础等级范围 */
  baseLevelRange: [number, number];
  /** 属性模板ID */
  attributeTemplate: string;
  /** 行为类型 */
  behaviorType: EnemyBehaviorType;
  /** 偏好元素 */
  preferredElement: Element;
  /** 描述模板 */
  descriptionTemplate: string;
  /** 掉落倍率 */
  dropRateMultiplier: number;
  /** 经验倍率 */
  expMultiplier: number;
}

// ============================================
// 敌人实例
// ============================================

/** 敌人实例（运行时） */
export interface Enemy {
  /** 实例唯一ID */
  id: string;
  /** 敌人名称 */
  name: string;
  /** 敌人描述 */
  description: string;
  /** 等级 */
  level: number;
  /** 敌人等级类型 */
  tier: EnemyTier;
  /** 模板ID */
  templateId: string;
  
  // 属性
  /** 属性 */
  stats: EnemyStats;
  
  // 战斗状态
  /** 当前HP */
  currentHp: number;
  /** 最大HP */
  maxHp: number;
  /** 当前MP */
  currentMp: number;
  /** 最大MP */
  maxMp: number;
  
  // 功法装备
  /** 功法列表 */
  techniques: Technique[];
  /** 装备列表 */
  equipments: Equipment[];
  
  // 技能
  /** 可用技能 */
  skills: BattleSkill[];
  /** 技能冷却 */
  skillCooldowns: Record<string, number>;
  
  // AI
  /** 行为类型 */
  behaviorType: EnemyBehaviorType;
  
  // 难度
  /** 难度系数 */
  difficultyMultiplier: number;
  
  // 元素
  /** 偏好元素 */
  preferredElement: Element;
  
  // 掉落
  /** 掉落倍率 */
  dropRateMultiplier: number;
  /** 经验倍率 */
  expMultiplier: number;
  
  // 奖励
  /** 经验奖励 */
  expReward: number;
  /** 金币奖励 */
  goldReward: number;
  /** 掉落物品列表 */
  drops?: Array<{
    itemId: string;
    chance: number;
    minQuantity?: number;
    maxQuantity?: number;
  }>;
}

// ============================================
// 敌人组
// ============================================

/** 行动顺序条目 */
export interface TurnOrderEntry {
  /** 敌人ID */
  enemyId: string;
  /** 敌人索引 */
  enemyIndex: number;
  /** 速度值 */
  speed: number;
  /** 基础速度 */
  baseSpeed: number;
  /** 是否已行动 */
  acted: boolean;
}

/** 敌人组类型 */
export type EnemyGroupType = 'patrol' | 'elite' | 'miniboss' | 'boss' | 'ambush';

/** 敌人组配置 */
export interface EnemyGroupConfig {
  /** 敌人数量范围 */
  enemyCount: { min: number; max: number };
  /** 普通敌人数量范围 */
  normalCount: { min: number; max: number };
  /** 精英敌人数量范围 */
  eliteCount: { min: number; max: number };
  /** 小Boss数量范围 */
  minibossCount: { min: number; max: number };
  /** Boss数量范围 */
  bossCount: { min: number; max: number };
}

/** 敌人组配置映射 */
export const ENEMY_GROUP_CONFIG: Record<EnemyGroupType, EnemyGroupConfig> = {
  patrol: {
    enemyCount: { min: 1, max: 3 },
    normalCount: { min: 1, max: 3 },
    eliteCount: { min: 0, max: 0 },
    minibossCount: { min: 0, max: 0 },
    bossCount: { min: 0, max: 0 },
  },
  elite: {
    enemyCount: { min: 2, max: 4 },
    normalCount: { min: 1, max: 2 },
    eliteCount: { min: 1, max: 2 },
    minibossCount: { min: 0, max: 0 },
    bossCount: { min: 0, max: 0 },
  },
  miniboss: {
    enemyCount: { min: 1, max: 3 },
    normalCount: { min: 0, max: 2 },
    eliteCount: { min: 0, max: 0 },
    minibossCount: { min: 1, max: 1 },
    bossCount: { min: 0, max: 0 },
  },
  boss: {
    enemyCount: { min: 1, max: 2 },
    normalCount: { min: 0, max: 0 },
    eliteCount: { min: 0, max: 1 },
    minibossCount: { min: 0, max: 0 },
    bossCount: { min: 1, max: 1 },
  },
  ambush: {
    enemyCount: { min: 3, max: 5 },
    normalCount: { min: 2, max: 3 },
    eliteCount: { min: 1, max: 2 },
    minibossCount: { min: 0, max: 0 },
    bossCount: { min: 0, max: 0 },
  },
};

/** 敌人组 */
export interface EnemyGroup {
  /** 敌人列表 */
  enemies: Enemy[];
  /** 行动顺序 */
  turnOrder: TurnOrderEntry[];
  /** 当前行动索引 */
  currentTurnIndex: number;
  /** 组类型 */
  groupType: EnemyGroupType;
  /** 组描述 */
  description: string;
  /** 总经验 */
  totalExp: number;
}

// ============================================
// 等级压制
// ============================================

/** 等级压制级别 */
export type SuppressionLevel = 'none' | 'warning' | 'danger' | 'instant_kill';

/** 等级压制配置 */
export interface LevelSuppressionConfig {
  /** 警告阈值（等级差） */
  warningThreshold: number;
  /** 危险阈值（等级差） */
  dangerThreshold: number;
  /** 秒杀阈值（等级差） */
  instantKillThreshold: number;
  /** 等级差伤害修正系数（每级差） */
  levelDiffModifier: number;
  /** 最大等级差修正 */
  maxLevelDiffModifier: number;
}

/** 等级压制配置 */
export const LEVEL_SUPPRESSION: LevelSuppressionConfig = {
  warningThreshold: 5,
  dangerThreshold: 10,
  instantKillThreshold: 15,
  levelDiffModifier: 0.05,
  maxLevelDiffModifier: 0.5,
};

// ============================================
// AI决策
// ============================================

/** AI决策结果 */
export interface AIDecision {
  /** 行动类型 */
  action: 'attack' | 'skill';
  /** 使用的技能（如果有） */
  skill: BattleSkill | null;
  /** 决策原因 */
  reason?: string;
}

/** 技能优先级配置 */
export interface SkillPriority {
  attack: number;
  defense: number;
  heal: number;
}

// ============================================
// 导出
// ============================================

// 重新导出现有类型以便使用
export type { EnemyTier, ItemRarity } from '@/core/types';
export type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
