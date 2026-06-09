/**
 * 战斗系统类型定义
 *
 * 定义手动回合制战斗所需的状态、动作和结果类型。
 * 与 adventure 模块中的 BattleState（用于展示自动战斗日志）互补，
 * 此文件专注于玩家主动操作的战斗流程。
 */

import type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';

// ============================================
// 战斗动作
// ============================================

/** 战斗动作类型 */
export type BattleActionType = 'attack' | 'defend' | 'flee' | 'use_skill';

/** AI 战斗策略 */
export type AutoBattleStrategy = 'aggressive' | 'conservative' | 'balanced';

/** 手动战斗中的单个动作 */
export interface BattleAction {
  /** 动作类型 */
  type: BattleActionType;
  /** 使用的招式 ID（type='attack' 或 'use_skill' 时必填） */
  techniqueId?: string;
  /** 动作来源：player 或 ai */
  source?: 'player' | 'ai';
}

// ============================================
// 招式槽位（战斗中可用招式）
// ============================================

/** 战斗中可用的招式槽位 */
export interface CombatTechniqueSlot {
  /** 招式 ID */
  techniqueId: string;
  /** 招式名称 */
  name: string;
  /** 真气消耗 */
  mpCost: number;
  /** 威力倍率 */
  powerMultiplier: number;
  /** 元素属性 */
  element: Element;
  /** 武器契合类型 */
  compatibleWeapon: WeaponCategory | null;
  /** 是否处于冷却中 */
  isOnCooldown: boolean;
  /** 剩余冷却回合数 */
  cooldownRemaining: number;
  /** 是否可用（真气足够 + 非冷却） */
  isAvailable: boolean;
  /** 对当前敌人的元素克制状态 */
  elementalStatus?: 'advantage' | 'disadvantage' | 'neutral';
}

// ============================================
// 战斗回合状态（扩展版）
// ============================================

/** 单次行动的结果 */
export interface TurnResult {
  /** 行动者 */
  actor: 'player' | 'enemy';
  /** 执行的行动 */
  action: BattleAction;
  /** 造成的伤害 */
  damageDealt: number;
  /** 造成的治疗 */
  healDone: number;
  /** 元素克制补正 */
  elementalModifier: number;
  /** 是否暴击 */
  isCrit: boolean;
  /** 是否闪避（敌方行动时） */
  isDodge: boolean;
  /** 描述文本 */
  description: string;
}

/** 完整的手动战斗回合状态 */
export interface ManualBattleState {
  /** 玩家最大 HP */
  playerMaxHp: number;
  /** 玩家当前 HP */
  playerCurrentHp: number;
  /** 玩家最大 MP */
  playerMaxMp: number;
  /** 玩家当前 MP */
  playerCurrentMp: number;
  /** 玩家攻击力 */
  playerAttack: number;
  /** 玩家防御力 */
  playerDefense: number;
  /** 玩家速度 */
  playerSpeed: number;
  /** 玩家元素属性 */
  playerElement: Element;
  /** 玩家武器类型 */
  playerWeapon: WeaponCategory | null;
  /** 可用招式列表 */
  availableTechniques: CombatTechniqueSlot[];

  /** 敌人名称 */
  enemyName: string;
  /** 敌人最大 HP */
  enemyMaxHp: number;
  /** 敌人当前 HP */
  enemyCurrentHp: number;
  /** 敌人攻击力 */
  enemyAttack: number;
  /** 敌人防御力 */
  enemyDefense: number;
  /** 敌人速度 */
  enemySpeed: number;
  /** 敌人等级 */
  enemyLevel: number;
  /** 敌人元素属性 */
  enemyElement: Element;
  /** 敌人武器类型 */
  enemyWeapon: WeaponCategory | null;
  /** 敌人境界名称 */
  enemyRealm: string;

  /** 当前回合数 */
  currentRound: number;
  /** 最大回合数 */
  maxRounds: number;
  /** 本回合行动历史 */
  turnHistory: TurnResult[];
  /** 战斗是否结束 */
  isOver: boolean;
  /** 是否胜利 */
  victory?: boolean;
  /** 是否逃跑 */
  fled?: boolean;
  /** 是否自动战斗 */
  isAutoBattle: boolean;
  /** AI 策略（自动战斗时） */
  autoStrategy: AutoBattleStrategy;
  /** 领域展开状态（45级解锁） */
  domainActive?: boolean;
  /** 领域剩余回合数 */
  domainRemainingRounds?: number;
}

// ============================================
// 战斗结果（扩展版）
// ============================================

/** 手动战斗结算结果 */
export interface ManualBattleResult {
  /** 是否胜利 */
  victory: boolean;
  /** 是否逃跑 */
  fled?: boolean;
  /** 战斗状态（含完整回合历史） */
  battleState: ManualBattleState;
  /** 奖励（仅胜利时） */
  rewards?: {
    experience?: number;
    items?: Array<{ id: string; name: string; quantity: number }>;
    spiritStones?: number;
    equipment?: { id: string; name: string; rarity: string };
    technique?: { id: string; name: string; rarity: string };
  };
  /** 玩家战后 HP */
  playerHpAfter: number;
  /** 玩家战后 MP */
  playerMpAfter: number;
}

// ============================================
// AI 决策
// ============================================

/** AI 决策结果 */
export interface AIDecision {
  /** 选择的行为 */
  action: BattleAction;
  /** 决策理由（调试用） */
  reason: string;
}
