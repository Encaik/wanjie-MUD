/**
 * 战斗策略系统 - 类型定义
 * 
 * 设计原则：
 * 1. 所有数值有上下界约束
 * 2. 状态机完整，无遗漏分支
 * 3. 接口抽象，便于扩展
 */

import { RestraintResult, EnemyAttributes } from '@/modules/combat/logic/restraintSystem';
import { 
  Technique, 
  Equipment, 
  InventoryItem, 
  ActiveEffect, 
  Element, 
  WeaponCategory,
  EnemyTier,
  ItemRarity,
  CharacterStats,
  BattleLog,
  BattleState,
  Protagonist,
  LegacyStats,
} from '@/shared/lib/types';

// ============================================
// 战斗行动类型
// ============================================

/** 战斗行动类型 */
export type BattleActionType = 
  | 'normal_attack'   // 普通攻击（无消耗，伤害低）
  | 'technique_attack' // 法技（功法技能：有cd，消耗法力，伤害高）
  | 'combat_technique' // 斗技（武器技巧：有cd，无消耗，伤害中等）
  | 'defend'          // 防御（无cd，无消耗，减伤+回蓝）
  | 'use_item'        // 使用物品（消耗道具）
  | 'flee';           // 逃跑（有成功率）

/** 战斗行动定义 */
export interface BattleAction {
  type: BattleActionType;
  /** 法技ID（来自功法） */
  techniqueSkillId?: string;
  /** 斗技ID（来自武器） */
  combatTechniqueId?: string;
  /** 物品ID */
  itemId?: string;
  /** 目标敌人索引（多敌人战斗时使用） */
  targetEnemyIndex?: number;
}

// ============================================
// 战斗技能系统
// ============================================

/** 战斗技能类型 */
export type BattleSkillType = 'attack' | 'defense' | 'buff' | 'debuff' | 'special';

/** 属性增益/减益效果 */
export interface StatBuff {
  /** Buff唯一ID */
  id?: string;
  /** Buff名称 */
  name?: string;
  /** 图标 */
  icon?: string;
  /** 影响的属性 */
  stat: 'attack' | 'defense' | 'critRate' | 'evasion' | 'speed' | 'crit' | 'all';
  /** 固定值加成 */
  value: number;
  /** 百分比加成 */
  percent?: number;
  /** 持续回合数，-1表示永久 */
  duration?: number;
  /** 剩余回合数 */
  remainingCount?: number;
  /** 层数 */
  stacks?: number;
  /** 来源标识 */
  source: string;
}

/** 特殊效果类型 */
export type SpecialEffectType = 
  | { type: 'life_steal'; percent: number }           // 吸血
  | { type: 'ignore_defense'; percent: number }       // 无视防御
  | { type: 'multi_hit'; count: number }              // 多段攻击
  | { type: 'stun'; rounds: number }                  // 眩晕
  | { type: 'poison'; damagePerRound: number; rounds: number } // 中毒
  | { type: 'shield'; amount: number }                // 护盾
  | { type: 'reflect'; percent: number };             // 反伤

/** 战斗技能定义 */
export interface BattleSkill {
  /** 技能唯一ID */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述 */
  description: string;
  /** 技能类型 */
  type: BattleSkillType;
  
  // 消耗与冷却
  /** 法力消耗 */
  mpCost: number;
  /** 冷却回合数 */
  cooldown: number;
  
  // 效果
  effect: {
    /** 攻击倍率（相对于基础攻击力） */
    damageMultiplier?: number;
    /** 固定治疗量 */
    healing?: number;
    /** 百分比治疗（相对于最大HP） */
    healingPercent?: number;
    /** 增益效果 */
    buff?: StatBuff;
    /** 减益效果（对敌人） */
    debuff?: StatBuff;
    /** 特殊效果 */
    special?: SpecialEffectType;
  };
  
  // 条件
  requirements?: {
    /** 最低血量百分比 */
    minHpPercent?: number;
    /** 最低法力 */
    minMp?: number;
    /** 最低等级 */
    minLevel?: number;
  };
  
  // 属性（继承自功法）
  /** 元素属性 */
  element?: Element | null;
  /** 武器类别 */
  weaponCategory?: WeaponCategory | null;
  
  // 来源与分类
  /** 关联的功法ID */
  techniqueId?: string;
  /** 关联的装备ID */
  equipmentId?: string;
  /** 技能来源 */
  source: 'technique' | 'equipment' | 'innate';
  /** 技能分类：technique=法技（功法）, combat=斗技（武器） */
  skillCategory: 'technique' | 'combat';
  /** 技能标签（如 'execute' 斩杀, 'aoe' 范围等） */
  tags?: string[];
}

// ============================================
// 战斗行动结果
// ============================================

/** 战斗行动结果 */
export interface BattleActionResult {
  /** 执行的行动 */
  action: BattleAction;
  /** 是否成功 */
  success: boolean;
  /** 造成的伤害 */
  damage?: number;
  /** 恢复的生命 */
  healing?: number;
  /** 消耗的法力（负值表示消耗，正值表示恢复） */
  mpChange?: number;
  /** 行动描述 */
  message: string;
  /** 触发的效果 */
  effects?: ActiveEffect[];
  /** 是否暴击 */
  critical?: boolean;
  /** 是否闪避 */
  dodged?: boolean;
  /** 克制关系 */
  restraint?: RestraintResult;
  /** 使用的技能 */
  skill?: BattleSkill;
  /** 使用的物品 */
  item?: InventoryItem;
  /** 失败原因 */
  failReason?: string;
}

// ============================================
// 战斗事件系统
// ============================================

/** 战斗事件触发时机 */
export type BattleEventTriggerType = 
  | 'battle_start'    // 战斗开始
  | 'round_start'     // 回合开始
  | 'round_end'       // 回合结束
  | 'turn_start'      // 单位回合开始
  | 'turn_end'        // 单位回合结束
  | 'critical_hit'    // 暴击时
  | 'low_hp'          // 低血量时
  | 'kill_enemy'      // 击杀敌人时
  | 'player_turn'     // 玩家回合
  | 'enemy_turn'      // 敌人回合
  | 'skill_used'      // 使用技能时
  | 'item_used';      // 使用物品时

/** 战斗事件定义 */
export interface BattleEventDefinition {
  /** 事件唯一ID */
  id: string;
  /** 事件名称 */
  name: string;
  /** 事件描述 */
  description: string;
  /** 触发时机 */
  trigger: {
    type: BattleEventTriggerType;
    /** 额外条件 */
    condition?: (context: BattleEventContext) => boolean;
    /** 触发概率 */
    probability: number;
  };
  /** 事件效果 */
  effects: BattleEventEffect[];
  /** 效果持续回合 */
  duration?: number;
  /** 是否一次性事件 */
  oneTime?: boolean;
  /** 事件图标 */
  icon?: string;
}

/** 战斗事件效果 */
export interface BattleEventEffect {
  /** 效果类型 */
  type: 'buff' | 'debuff' | 'damage' | 'healing' | 'mp_change' | 'special';
  /** 目标 */
  target: 'player' | 'enemy' | 'both';
  /** 效果值 */
  value: number;
  /** 描述文本 */
  description: string;
  /** 图标 */
  icon?: string;
}

/** 战斗事件上下文 */
export interface BattleEventContext {
  /** 当前战斗状态 */
  state: ExtendedBattleState;
  /** 当前回合数 */
  round: number;
  /** 当前行动者 */
  currentActor: 'player' | 'enemy';
  /** 触发的事件 */
  trigger: BattleEventTriggerType;
}

/** 战斗事件实例（运行时） */
export interface BattleEventInstance {
  /** 事件定义 */
  definition: BattleEventDefinition;
  /** 剩余持续回合 */
  remainingDuration: number;
  /** 是否已触发（用于一次性事件） */
  triggered: boolean;
}

// ============================================
// 扩展战斗状态
// ============================================

/** 扩展战斗状态（包含新系统所需信息） */
export interface ExtendedBattleState extends BattleState {
  // 玩家扩展状态
  /** 玩家当前MP */
  playerCurrentMp: number;
  /** 玩家最大MP */
  playerMaxMp: number;
  /** 本回合是否防御 */
  playerIsDefending: boolean;
  /** 玩家等级 */
  playerLevel: number;
  /** 玩家幸运值 */
  playerLuck: number;
  
  // 技能系统
  /** 可用技能列表 */
  availableSkills: BattleSkill[];
  /** 技能冷却映射 */
  skillCooldowns: Map<string, number>;
  
  // 物品系统
  /** 可用物品列表 */
  availableItems: InventoryItem[];
  /** 物品冷却映射 (物品定义ID -> 剩余冷却回合) */
  itemCooldowns: Map<string, number>;
  
  // Buff系统
  /** 玩家身上的Buff */
  playerBuffs: StatBuff[];
  /** 敌人身上的Debuff（已废弃，使用 enemies[].buffs） */
  enemyBuffs: StatBuff[];
  
  // 事件系统
  /** 活跃的事件 */
  activeEvents: BattleEventInstance[];
  /** 事件历史记录 */
  eventHistory: TriggeredEvent[];
  
  // ============================================
  // 多敌人系统（新增）
  // ============================================
  
  /** 多敌人列表（新系统） */
  enemies: import('./enemyState').BattleEnemy[];
  /** 当前行动顺序 */
  turnOrder: import('./enemyState').TurnOrderEntry[];
  /** 当前行动者索引 */
  currentTurnIndex: number;
  /** 当前选中的敌人索引（玩家选择攻击目标） */
  selectedEnemyIndex: number;
  
  // ============================================
  // 单敌人兼容字段（已废弃，保留向后兼容）
  // ============================================
  
  /** @deprecated 使用 enemies[0].attributes 代替 */
  enemyAttributes: EnemyAttributes;
  /** @deprecated 使用 enemies[0].skills 代替 */
  enemySkills?: BattleSkill[];
  /** @deprecated 使用 enemies[0].skillCooldowns 代替 */
  enemySkillCooldowns?: Map<string, number>;
  /** @deprecated 使用 enemies[0].currentMp 代替 */
  enemyCurrentMp?: number;
  /** @deprecated 使用 enemies[0].maxMp 代替 */
  enemyMaxMp?: number;
  /** @deprecated 使用 enemies[0].isStunned 代替 */
  enemyStunned?: boolean;
  /** @deprecated 使用 enemies[0].stunRounds 代替 */
  enemyStunRounds?: number;
  /** 敌人增强描述 */
  enemyEnhancementDesc?: string;
  
  // 行动历史
  /** 行动记录（用于回放） */
  actionHistory: BattleActionRecord[];
  
  // 战斗配置
  /** 战斗配置 */
  battleConfig: BattleConfig;
  
  // 状态机状态
  /** 当前战斗阶段 */
  phase: BattlePhase;
}

/** 战斗阶段 */
export type BattlePhase = 
  | 'init'           // 初始化
  | 'preparing'      // 准备阶段
  | 'player_turn'    // 玩家回合
  | 'enemy_turn'     // 敌人回合
  | 'round_end'      // 回合结束
  | 'battle_end';    // 战斗结束

/** 战斗行动记录 */
export interface BattleActionRecord {
  /** 回合数 */
  round: number;
  /** 行动者 */
  actor: 'player' | 'enemy';
  /** 行动 */
  action: BattleAction;
  /** 结果 */
  result: BattleActionResult;
  /** 时间戳 */
  timestamp: number;
}

/** 战斗配置 */
export interface BattleConfig {
  /** 最大回合数 */
  maxRounds: number;
  /** 是否允许逃跑 */
  canFlee: boolean;
  /** 战斗类型 */
  battleType: 'normal' | 'boss' | 'pvp' | 'weekly_boss';
  /** 难度等级 */
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  /** 是否启用战斗事件 */
  enableEvents: boolean;
  /** 是否自动战斗 */
  autoPlay?: boolean;
}

// ============================================
// 决策系统
// ============================================

/** 决策选项 */
export interface DecisionOption {
  /** 行动 */
  action: BattleAction;
  /** 显示标签 */
  label: string;
  /** 详细描述 */
  description: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 禁用原因 */
  disabledReason?: string;
  /** 是否推荐 */
  recommended?: boolean;
  /** 推荐原因 */
  recommendedReason?: string;
  /** 图标 */
  icon?: string;
  /** 额外信息 */
  extraInfo?: {
    mpCost?: number;
    cooldown?: number;
    damage?: number | string;
    healing?: number | string;
  };
}

/** 决策上下文 */
export interface DecisionContext {
  /** 战斗状态 */
  state: ExtendedBattleState;
  /** 当前回合 */
  round: number;
}

// ============================================
// 回合结果
// ============================================

/** 回合结果 */
export interface TurnResult {
  /** 玩家行动结果 */
  playerResult?: BattleActionResult;
  /** 敌人行动结果 */
  enemyResult?: BattleActionResult;
  /** 触发的事件 */
  events: TriggeredEvent[];
  /** 战斗是否结束 */
  battleOver: boolean;
  /** 胜利方 */
  victory?: boolean;
  /** 是否逃跑成功 */
  fled?: boolean;
  /** 结束原因 */
  endReason?: string;
}

// ============================================
// 战斗结果扩展
// ============================================

/** 扩展战斗结果 */
export interface ExtendedBattleResult {
  /** 是否胜利 */
  victory: boolean;
  /** 结果消息 */
  message: string;
  /** 战斗状态 */
  battleState?: ExtendedBattleState;
  /** 奖励 */
  rewards?: {
    stats?: Partial<CharacterStats>;
    items?: InventoryItem[];
    experience?: number;
    technique?: Technique;
    equipment?: Equipment;
  };
  /** 战斗后HP */
  playerHpAfter?: number;
  /** 战斗后MP */
  playerMpAfter?: number;
  /** 统计数据 */
  statistics: BattleStatistics;
}

/** 战斗统计数据 */
export interface BattleStatistics {
  /** 总回合数 */
  totalRounds: number;
  /** 已玩回合数 */
  turnsPlayed?: number;
  /** 玩家总伤害 */
  playerTotalDamage: number;
  /** 敌人总伤害 */
  enemyTotalDamage: number;
  /** 暴击次数 */
  critCount: number;
  /** 闪避次数 */
  dodgeCount: number;
  /** 技能使用次数 */
  skillUseCount: number;
  /** 物品使用次数 */
  itemUseCount: number;
  /** 防御次数 */
  defendCount: number;
  /** 最高单次伤害 */
  maxDamageDealt: number;
  /** 最高单次受到伤害 */
  maxDamageReceived: number;
}

// ============================================
// 常量配置
// ============================================

/** 战斗相关常量 */
export const BATTLE_CONSTANTS = {
  /** 逃跑基础成功率 */
  BASE_FLEE_RATE: 0.3,
  /** 等级差对逃跑的影响 */
  FLEE_LEVEL_BONUS: 0.05,
  /** Boss战逃跑惩罚 */
  FLEE_BOSS_PENALTY: 0.2,
  /** 逃跑成功率下界 */
  MIN_FLEE_RATE: 0.1,
  /** 逃跑成功率上界 */
  MAX_FLEE_RATE: 0.8,
  
  /** 防御减伤比例 */
  DEFEND_DAMAGE_REDUCTION: 0.5,
  /** 防御MP恢复 */
  DEFEND_MP_RECOVERY: 5,
  
  /** 功法技能触发概率（自动战斗时） */
  AUTO_SKILL_TRIGGER_RATE: 0.3,
  
  /** 伤害下界比例（最低伤害占攻击力的比例） */
  MIN_DAMAGE_RATIO: 0.15,
  /** 伤害上界比例（单次伤害占目标最大HP的比例） */
  MAX_DAMAGE_RATIO: 0.6,
  
  /** 低血量阈值（触发事件） */
  LOW_HP_THRESHOLD: 0.2,
  
  /** 暴击伤害倍率 */
  CRIT_DAMAGE_MULTIPLIER: 1.5,
} as const;

// ============================================
// 工厂函数
// ============================================

/** 创建默认战斗配置 */
export function createDefaultBattleConfig(): BattleConfig {
  return {
    maxRounds: 20,
    canFlee: true,
    battleType: 'normal',
    difficulty: 'normal',
    enableEvents: true,
  };
}

/** 创建默认战斗统计 */
export function createDefaultBattleStatistics(): BattleStatistics {
  return {
    totalRounds: 0,
    playerTotalDamage: 0,
    enemyTotalDamage: 0,
    critCount: 0,
    dodgeCount: 0,
    skillUseCount: 0,
    itemUseCount: 0,
    defendCount: 0,
    maxDamageDealt: 0,
    maxDamageReceived: 0,
  };
}

/** 创建默认扩展战斗状态 */
export function createDefaultExtendedBattleState(): Partial<ExtendedBattleState> {
  return {
    playerCurrentMp: 0,
    playerMaxMp: 0,
    playerIsDefending: false,
    playerLevel: 1,
    playerLuck: 0,
    availableSkills: [],
    skillCooldowns: new Map(),
    availableItems: [],
    itemCooldowns: new Map(),
    playerBuffs: [],
    enemyBuffs: [],
    activeEvents: [],
    eventHistory: [],
    actionHistory: [],
    battleConfig: createDefaultBattleConfig(),
    phase: 'init',
    // 多敌人系统
    enemies: [],
    turnOrder: [],
    currentTurnIndex: 0,
    selectedEnemyIndex: 0,
  };
}

// ============================================
// 事件系统扩展类型
// ============================================

/** 触发的事件 */
export interface TriggeredEvent {
  /** 事件类型 */
  type: BattleEventType;
  /** 事件消息 */
  message: string;
  /** 事件数据 */
  data: Record<string, any>;
  /** 触发回合 */
  round?: number;
  /** 时间戳 */
  timestamp?: number;
}

/** 战斗事件类型 */
export type BattleEventType = 
  | 'crit'           // 暴击
  | 'dodge'          // 闪避
  | 'counter'        // 反击
  | 'combo'          // 连击
  | 'shield'         // 护盾
  | 'berserk'        // 狂暴
  | 'lifesteal'      // 吸血
  | 'stun'           // 眩晕
  | 'ignore_defense' // 无视防御
  | 'multi_hit'      // 多段攻击
  | 'restraint'      // 克制
  | 'random'         // 随机事件
  | 'buff_expire'    // Buff过期
  | 'enemy_enhancement'; // 敌人增强

/** 战斗事件选项 */
export interface BattleEventOptions {
  /** 是否检查闪避 */
  checkDodge?: boolean;
  /** 是否检查反击 */
  checkCounter?: boolean;
  /** 是否检查连击 */
  checkCombo?: boolean;
  /** 克制关系 */
  restraint?: RestraintResult;
}

/** Buff事件 */
export interface BuffEvent {
  type: 'buff_apply' | 'buff_expire';
  buff: StatBuff;
}

/** 连击事件 */
export interface ComboEvent {
  type: 'combo';
  count: number;
  damage: number;
}

// ============================================
// 导出工具类型
// ============================================

// 注意：Enemy 类型已移至 enemy/types.ts，请从 '../enemy/types' 导入

/** 玩家数据 */
export interface PlayerData {
  name: string;
  level: number;
  attributes: LegacyStats;
  health?: number;
  mana?: number;
  /** 最大生命值 - 使用玩家实际属性 */
  maxHp?: number;
  /** 最大法力值 - 使用玩家实际属性 */
  maxMp?: number;
  /** 攻击力 - 使用玩家实际属性 */
  attack?: number;
  /** 防御力 - 使用玩家实际属性 */
  defense?: number;
  techniques?: (Technique | null)[];
  inventory?: InventoryItem[];
  equippedMelee?: Equipment | null;
  equippedRanged?: Equipment | null;
}
