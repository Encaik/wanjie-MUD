/**
 * 战斗系统类型定义
 *
 * @module core/combat
 */

import type { CoreStatValues } from '@/core/world/calculateCoreStats';

// ============================================
// 战斗开场类型
// ============================================

/** 战斗开场类型 */
export type EngagementType = 'encounter' | 'ambush' | 'surprise' | 'defense';

/** 开场类型效果 */
export interface EngagementEffect {
  /** 攻击方速度乘数（surprise: 1.5） */
  attackerSpeedMultiplier: number;
  /** 攻击方是否首轮先手（ambush: true） */
  attackerFirstStrike: boolean;
  /** 防御方物防加成（defense: +50%） */
  defenderPhysicalDEFBonus: number;
  /** 防御方特防加成（defense: +50%） */
  defenderSpecialDEFBonus: number;
}

// ============================================
// 技能
// ============================================

/** 伤害类型 */
export type DamageType = 'physical' | 'special';

/** 战斗技能 */
export interface CombatSkill {
  /** 技能 ID */
  id: string;
  /** 技能名 */
  name: string;
  /** 伤害类型 */
  damageType: DamageType;
  /** 基础威力 */
  power: number;
  /** 武器加成（正=加成，负=减益） */
  weaponModifier: number;
  /** 冷却时间（自身行动次数，每次自身行动后 CD-1） */
  cooldownSeconds: number;
  /** 当前剩余冷却次数 */
  currentCooldown: number;
}

// ============================================
// 战斗单位
// ============================================

/** 战斗单位 */
export interface CombatUnit {
  /** 单位 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 等级 */
  level: number;
  /** 核心值 */
  coreStats: CoreStatValues;
  /** 当前 HP */
  currentHp: number;
  /** 技能列表 */
  skills: CombatSkill[];
  /** 是否是玩家 */
  isPlayer: boolean;
  /** 装备/功法修正列表 */
  equipmentModifiers?: EquipmentModifier[];
}

// ============================================
// 战斗状态与结果
// ============================================

/** 战斗模式 */
export type CombatMode = 'manual' | 'auto';

/** 战斗单回合记录 */
export interface CombatRoundLog {
  /** 回合数 */
  round: number;
  /** 攻击方 */
  attackerName: string;
  /** 防御方 */
  defenderName: string;
  /** 使用的技能 */
  skillName: string;
  /** 伤害值 */
  damage: number;
  /** 攻击方 HP 变化 */
  attackerHpAfter: number;
  /** 防御方 HP 变化 */
  defenderHpAfter: number;
  /** 是否暴击 */
  isCritical: boolean;
  /** 行动者速度 */
  speed?: number;
  /** 触发时的 tick 数 */
  tick?: number;
}

// ============================================
// 装备修正
// ============================================

/** 装备/功法对核心值的修正 */
export interface EquipmentModifier {
  /** 修正目标核心值 */
  target: keyof import('@/core/world/calculateCoreStats').CoreStatValues;
  /** 修正类型 */
  type: 'flat' | 'multiplier';
  /** 修正值 */
  value: number;
  /** 触发条件（条件满足时生效，空=始终生效） */
  condition?: 'always' | 'first_round' | 'hp_below_50' | 'hp_below_25';
}

// ============================================
// CombatSession 暂停系统
// ============================================

/** 战斗会话状态 */
export type SessionState = 'running' | 'pending_input' | 'finished';

/** 待处理的行动（需要玩家选择技能） */
export interface PendingAction {
  /** 等待行动的单位 */
  unitId: string;
  /** 单位名称 */
  unitName: string;
  /** 可选技能列表 */
  availableSkills: CombatSkill[];
}

/** 战斗结果 */
export interface CombatResult {
  /** 是否胜利（从攻击方视角） */
  victory: boolean;
  /** 战斗日志 */
  logs: CombatRoundLog[];
  /** 总回合数 */
  totalRounds: number;
  /** 攻击方剩余 HP */
  attackerRemainingHp: number;
  /** 防御方剩余 HP */
  defenderRemainingHp: number;
}
