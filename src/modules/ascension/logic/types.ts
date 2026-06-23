/**
 * 终局玩法系统类型定义
 * 
 * 根据 comprehensive-optimization-design.md 设计文档实现
 * 包含：飞升境界、排行榜、每周Boss、飞升商店
 */

import { CharacterStats, GrowthStats, ItemDefinition, WorldType, Technique, Equipment, Protagonist } from '@/core/types';
import { Element } from '@/modules/combat/logic/restraintSystem';

// 重新导出 Element 类型供其他模块使用
export type { Element } from '@/modules/combat/logic/restraintSystem';

// ============================================
// 飞升境界系统
// ============================================

/** 飞升境界定义 */
export interface AscensionRealm {
  id: string;
  name: string;
  description: string;
  requiredMarks: number; // 需要的飞升印记
  
  // 加成效果
  bonuses: {
    statMultiplier: number;      // 属性倍率
    expMultiplier: number;       // 经验倍率
    dropRateBonus: number;       // 掉率加成
    newFeatures: string[];       // 解锁的新功能
  };
  
  // 外观
  appearance: {
    title: string;               // 称号
    aura: string;                // 光环效果
    auraColor: string;           // 光环颜色
  };
}

/** 飞升印记来源类型 */
export type AscensionMarkSource = 
  | 'boss'           // Boss击杀
  | 'weekly_boss'    // 每周Boss
  | 'pvp'            // PVP胜利
  | 'achievement'    // 成就完成
  | 'season'         // 赛季奖励
  | 'challenge';     // 挑战完成

/** 飞升印记获取配置 */
export interface AscensionMarkGainConfig {
  source: AscensionMarkSource;
  baseAmount: number;
  levelScaling: number; // 每级增加比例
}

/** 玩家飞升状态 */
export interface PlayerAscensionState {
  /** 当前飞升印记数量 */
  marks: number;
  /** 累计获得的飞升印记 */
  totalMarksEarned: number;
  /** 当前境界ID */
  currentRealmId: string | null;
  /** 飞升次数（穿越世界次数） */
  ascensionCount: number;
  /** 解锁的功能列表 */
  unlockedFeatures: string[];
  /** 当前使用的称号 */
  currentTitle: string | null;
  /** 解锁的称号列表 */
  unlockedTitles: string[];
}

// ============================================
// 排行榜系统
// ============================================

/** 排行榜类型 */
export type LeaderboardType = 
  | 'combat_power'   // 战力排行
  | 'speedrun'       // 通关速度
  | 'achievement'    // 成就点数
  | 'ascension'      // 飞升境界
  | 'weekly_damage'; // 每周Boss伤害

/** 排行榜条目 */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  extraData?: Record<string, unknown>;
  updatedAt: number;
}

/** 排行榜奖励 */
export interface LeaderboardReward {
  rankRange: [number, number]; // [minRank, maxRank]
  rewards: {
    spiritStones: number;
    ascensionMarks: number;
    items?: ItemDefinition[];
    title?: string;
  };
}

/** 排行榜结算结果 */
export interface LeaderboardSettlement {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  rewards: Map<string, LeaderboardReward>;
  settledAt: number;
}

// ============================================
// 每周Boss系统
// ============================================

/** 每周Boss特殊能力 */
export interface WeeklyBossAbility {
  id: string;
  name: string;
  description: string;
  trigger: 'round_start' | 'hp_threshold' | 'turn_count';
  triggerValue?: number; // 触发阈值
  effect: {
    type: 'damage' | 'buff' | 'summon' | 'special' | 'aoe_damage' | 'heal';
    value: number;
    target?: 'player' | 'self';
    stat?: string;
  };
  cooldown?: number;
}

/** 每周Boss奖励 */
export interface WeeklyBossReward {
  type: 'first_kill' | 'daily_damage' | 'ranking';
  threshold?: number; // 伤害阈值或排名
  rewards: {
    ascensionMarks: number;
    items?: ItemDefinition[];
  };
}

/** 每周Boss定义 */
export interface WeeklyBoss {
  id: string;
  name: string;
  description: string;
  
  // 属性
  element: Element;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  
  // 特殊能力
  specialAbility: WeeklyBossAbility;
  
  // 奖励
  rewards: WeeklyBossReward[];
  
  // 时间
  availableFrom: number;
  availableUntil: number;
  weekNumber: number;
}

/** 玩家对每周Boss的伤害记录 */
export interface WeeklyBossDamageRecord {
  playerId: string;
  playerName: string;
  bossId: string;
  weekNumber: number;
  totalDamage: number;
  bestDamage: number; // 单次最高伤害
  attempts: number;
  firstKill: boolean;
  lastAttemptAt: number;
}

/** 每周Boss战斗状态 */
export interface WeeklyBossBattleState {
  boss: WeeklyBoss;
  bossCurrentHp: number;
  currentRound: number;
  isOver: boolean;
  victory: boolean;
  totalDamageDealt: number;
}

// ============================================
// 飞升商店系统
// ============================================

/** 飞升商店商品类型 */
export type AscensionShopItemType = 
  | 'technique'      // 功法
  | 'equipment'      // 装备
  | 'item'           // 消耗品
  | 'appearance'     // 外观
  | 'boost';         // 增益道具

/** 飞升商店商品 */
export interface AscensionShopItem {
  id: string;
  type: AscensionShopItemType;
  name: string;
  description: string;
  
  // 商品内容
  content: {
    techniqueId?: string;
    equipmentId?: string;
    itemId?: string;
    boostType?: string;
    boostValue?: number;
    boostDuration?: number;
  };
  
  // 价格
  price: number; // 飞升印记
  
  // 限制
  purchaseLimit?: number; // 购买上限
  requiredRealm?: string; // 需要的境界
  requiredFeature?: string; // 需要解锁的功能
}

/** 飞升商店购买记录 */
export interface AscensionShopPurchase {
  itemId: string;
  purchasedAt: number;
  quantity: number;
}

// ============================================
// 赛季系统
// ============================================

/** 赛季定义 */
export interface Season {
  id: string;
  name: string;
  description: string;
  
  // 时间
  startDate: number;
  endDate: number;
  
  // 特殊内容
  specialBosses: string[]; // 特殊Boss ID列表
  bonusRewards: {
    type: string;
    multiplier: number;
  }[];
  
  // 排行榜奖励
  leaderboardRewards: LeaderboardReward[];
}

/** 玩家赛季数据 */
export interface PlayerSeasonData {
  seasonId: string;
  playerId: string;
  
  // 统计
  totalBossDamage: number;
  weeklyBossKills: number;
  pvpWins: number;
  achievementsUnlocked: number;
  
  // 排名
  finalRank: number | null;
  rewardsClaimed: boolean;
}

// ============================================
// 飞升挑战系统（保留原有功能）
// ============================================

/** 守卫特殊能力 */
export interface GuardianAbility {
  name: string;
  description: string;
  triggerCondition: 'phase' | 'hp' | 'round' | 'random';
  triggerValue?: number;
  triggerPhase?: number;
  effect: {
    type: 'damage' | 'buff' | 'debuff' | 'heal' | 'dispel' | 'silence' | 'multi_attack' | 'aoe_damage' | 'copy_skill' | 'seal_slot';
    value?: number;
    target?: 'player' | 'self';
    stat?: string;
    duration?: number;
    count?: number;
    min?: number;
    max?: number;
  };
  cooldown: number;
}

/** 守卫战斗台词 */
export interface GuardianBattleCries {
  start: string;
  phase2: string;
  phase3: string;
  defeat: string;
}

/** 守卫配置 */
export interface GuardianConfig {
  name: string;
  title: string;
  description: string;
  personality: string;
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  specialAbility: GuardianAbility[];
  phases: number;
  phaseThresholds: number[];
  battleCries: GuardianBattleCries;
}

/** 守卫战斗状态 */
export interface GuardianBattleState {
  guardianName: string;
  guardianTitle: string;
  guardianMaxHp: number;
  guardianCurrentHp: number;
  guardianAttack: number;
  guardianDefense: number;
  currentPhase: number;
  totalPhases: number;
  cooldownUntil: number | null;
  consecutiveFailures: number;
}

/** 飞升挑战结果 */
export interface AscensionChallengeResult {
  success: boolean;
  reward?: {
    statBonus: Partial<CharacterStats>;
    bonusRewards: { type: string; name: string; bonus: number }[];
    bonusMultiplier: number;
  };
  penalty?: {
    hpLoss: number;
    mpLoss: number;
    mentalDrop: number;
    demonChanceAdd: number;
    cooldownHours: number;
    phasesCleared: number;
  };
}

/** 新世界信息 */
export interface NewWorldInfo {
  type: WorldType;
  name: string;
  description: string;
  difficulty: number;
  specialFeatures: string[];
  resourceAbundance: number;
  danger: string;
}

/** 传承选择 */
export interface InheritanceChoice {
  techniqueId?: string;
  equipmentId?: string;
  spiritStonesPercent: number;
}

/** 传承结果 */
export interface InheritanceResult {
  techniques: Technique[];
  equipments: Equipment[];
  spiritStones: number;
}

// ============================================
// 综合配置
// ============================================

/** 飞升系统核心配置 */
export interface AscensionConfig {
  // 基础成功率
  baseSuccessRate: number;
  
  // 成功率加成条件
  successRateBonuses: {
    mentalStability70: number;
    mentalStability90: number;
    ascensionPill: number;
    pathLevel5: number;
    pathLevel8: number;
    fullLegendaryEquipment: number;
    tribulationPassed: number;
  };
  
  // 战斗参数
  battle: {
    maxTurns: number;
    phaseThresholds: number[];
  };
  
  // 失败惩罚
  penalty: {
    hpLossPercent: number;
    mpLossPercent: number;
    mentalDrop: number;
    demonChanceAdd: number;
    cooldownBaseHours: number;
    cooldownMaxHours: number;
  };
  
  // 传承限制
  inheritance: {
    maxSpiritStonesPercent: number;
    maxTechniques: number;
    maxEquipments: number;
    extraSlots: {
      ascensionRequired: number;
      extraTechniques: number;
      extraEquipments: number;
    };
  };
}

/** 飞升里程碑 */
export interface AscensionMilestone {
  statBonus: Partial<GrowthStats>;
  title: string;
  ability: string;
  description: string;
}
