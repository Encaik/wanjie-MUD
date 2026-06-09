/**
 * 游戏扩展类型定义
 * 
 * 包含所有纵向扩展功能的新增类型
 * 所有新增字段都有默认值，确保旧存档兼容
 */

import { CharacterStats, GrowthStats, LegacyStats, ItemRarity, WorldType, EquipmentSlot, InventoryItem } from './types';

// ============================================
// 修炼流派系统类型
// ============================================

export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 流派进度
export interface CultivationPathProgress {
  path: CultivationPath | null;  // 当前流派
  exp: number;                   // 流派熟练度
  level: number;                 // 流派等级 1-10
  unlockedAt?: number;           // 解锁时间戳
}

// ============================================
// 境界瓶颈与渡劫系统类型
// ============================================

export type BottleneckType = 'stats' | 'insight' | 'tribulation';

export interface RealmBottleneck {
  isActive: boolean;
  type: BottleneckType | null;
  level: number;                    // 触发瓶颈时的等级
  requirements: BottleneckRequirements;
  attempts: number;                 // 尝试次数
  maxAttempts: number;              // 最大尝试次数
}

export interface BottleneckRequirements {
  stats?: Partial<GrowthStats>;  // 属性需求
  insight?: number;                 // 悟性需求
  tribulationLevel?: number;        // 渡劫难度等级
}

export interface TribulationConfig {
  realmTier: number;
  name: string;                     // 劫名
  description: string;
  baseSuccessRate: number;
  statBonuses: Partial<GrowthStats>;  // 属性加成成功率
  failPenalty: {
    hpLoss: number;                 // 失败损失HP百分比
    statLoss: Partial<GrowthStats>;   // 属性损失
    weaknessTurns: number;          // 虚弱回合数
  };
  successReward: {
    statBonus: Partial<GrowthStats>;
    specialEffect?: string;
    title?: string;                 // 渡劫成功获得称号
  };
}

export interface TribulationState {
  inProgress: boolean;
  config: TribulationConfig | null;
  currentPhase: number;             // 当前阶段
  totalPhases: number;              // 总阶段数
  successRate: number;              // 计算后的成功率
}

// ============================================
// 心境与心魔系统类型
// ============================================

export interface MentalState {
  stability: number;       // 心境稳定度 0-100
  karma: number;           // 业力值（正负）
  demonChance: number;     // 心魔触发概率
  lastDemonTime: number;   // 上次心魔时间
  lastChangeTime?: number; // 上次心境变化时间（可选，用于动画）
  mentalBuffs: MentalBuff[];
}

export interface MentalBuff {
  id: string;
  name: string;
  effect: 'positive' | 'negative';
  statChanges: Partial<CharacterStats>;
  duration: number; // 剩余次数
}

// 心魔事件
export interface DemonEncounter {
  id: string;
  name: string;
  description: string;
  choices: DemonChoice[];
}

export interface DemonChoice {
  text: string;
  successRate: number;  // 基础成功率
  statModifiers: Partial<LegacyStats>; // 属性影响成功率
  successEffect: { stability: number; stats?: Partial<LegacyStats> };
  failEffect: { stability: number; stats: Partial<LegacyStats>; demonChance: number };
}

// ============================================
// 功法熟练度与羁绊类型
// ============================================

export type ProficiencyLevel = '入门' | '小成' | '大成' | '圆满' | '化境';

export interface TechniqueProficiency {
  proficiency: number;           // 熟练度 0-1000
  level: ProficiencyLevel;       // 熟练度等级
  usageCount: number;            // 使用次数
  essence: TechniqueEssence | null; // 奥义
}

export interface TechniqueEssence {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  effect: EssenceEffect;
  unlocked: boolean;
}

export interface EssenceEffect {
  type: 'damage' | 'defense' | 'buff' | 'special';
  value: number;
  duration?: number;
  cooldown?: number;
  specialEffect?: string;
}

// ============================================
// 装备词缀与套装类型
// ============================================

export type AffixType = 'prefix' | 'suffix';

export interface EquipmentAffix {
  id: string;
  name: string;
  type: AffixType;
  rarity: ItemRarity;
  effects: AffixEffect[];
}

export interface AffixEffect {
  type: 'stat' | 'power' | 'bonus' | 'special';
  stat?: keyof CharacterStats;
  value?: number;
  specialId?: string;
  description: string;
}

export interface EquipmentEnhancement {
  level: number;          // 强化等级 0-15
  refinement: number;     // 重铸次数 0-3
  affixes: EquipmentAffix[]; // 词缀列表
  setId: string | null;   // 套装ID
}

// ============================================
// 势力进度类型（V2 重构版）
// ============================================

export type ReputationLevel = 'outsider' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

/**
 * 任务进度（V2）
 */
export interface TaskProgress {
  taskId: string;
  current: number;
  target: number;
  accepted: boolean;
  completed: boolean;
  submitted: boolean;
  acceptedTime: number;
  lastUpdateTime: number;
}

/**
 * 任务轮次状态（V2新增）
 */
export interface TaskRoundState {
  type: 'daily' | 'weekly';
  /** 当前轮次已完成的任务数 */
  completedInRound: number;
  /** 当前轮次可完成的任务上限 */
  roundLimit: number;
  /** 轮次开始时间 */
  roundStartTime: number;
  /** 轮次冷却结束时间（达到上限后） */
  roundCooldownEnd: number | null;
  /** 当前可用任务ID列表 */
  availableTasks: string[];
  /** 已接取的任务 */
  acceptedTasks: Record<string, TaskProgress>;
  /** 本轮已完成任务的ID */
  completedTaskIdsInRound: string[];
}

/**
 * 委托进度（V2新增）
 */
export interface CommissionProgress {
  commissionId: string;
  current: number;
  target: number;
  accepted: boolean;
  completed: boolean;
  submitted: boolean;
  acceptedTime: number;
  expiresAt: number | null;
}

/**
 * 委托状态（V2新增）
 */
export interface CommissionState {
  /** 当前委托列表 */
  commissions: Record<string, CommissionProgress>;
  /** 每日免费刷新次数 */
  dailyFreeRefresh: number;
  /** 上次刷新时间 */
  lastRefreshTime: number;
  /** 今日已完成委托数 */
  todayCompleted: number;
  /** 今日已用刷新次数 */
  todayRefreshUsed: number;
}

/**
 * 势力进度（V2完整版）
 */
export interface FactionProgress {
  // 基础信息
  factionId: string;
  joinTime: number;
  
  // 声望与贡献
  reputation: number;
  reputationLevel: ReputationLevel;
  contribution: number;
  
  // 职位系统
  rank: string;
  lastRankPromotion: number;
  
  // 任务轮次系统（V2新增）
  dailyRound: TaskRoundState;
  weeklyRound: TaskRoundState;
  
  // 委托系统（V2新增）
  commissions: CommissionState;
  
  // 统计数据
  tasksCompleted: number;
  commissionsCompleted: number;
  totalDonated: number;
  
  // 已解锁内容
  unlockedTechniques: string[];
  unlockedEquipments: string[];
  
  // 特殊标记
  lastDailyReward?: number;
  specialFlags: Record<string, boolean>;
}

// ============================================
// 默认值工厂函数（V2）
// ============================================

/**
 * 创建默认日常轮次状态
 */
export function createDefaultDailyRoundState(): TaskRoundState {
  return {
    type: 'daily',
    completedInRound: 0,
    roundLimit: 20,
    roundStartTime: Date.now(),
    roundCooldownEnd: null,
    availableTasks: ['daily_kill_monsters', 'daily_explore', 'daily_cultivate', 'daily_donate', 'daily_collect', 'daily_upgrade'],
    acceptedTasks: {},
    completedTaskIdsInRound: []
  };
}

/**
 * 创建默认周常轮次状态
 */
export function createDefaultWeeklyRoundState(): TaskRoundState {
  return {
    type: 'weekly',
    completedInRound: 0,
    roundLimit: 10,  // 每周最多完成10个周常任务
    roundStartTime: Date.now(),
    roundCooldownEnd: null,
    availableTasks: ['weekly_boss_hunter', 'weekly_dungeon_master', 'weekly_elite_hunter', 'weekly_upgrade_equipment'],
    acceptedTasks: {},
    completedTaskIdsInRound: []
  };
}

/**
 * 创建默认委托状态
 */
export function createDefaultCommissionState(): CommissionState {
  return {
    commissions: {},
    dailyFreeRefresh: 3,
    lastRefreshTime: Date.now(),
    todayCompleted: 0,
    todayRefreshUsed: 0
  };
}

/**
 * 创建默认势力进度（V2）
 */
export function createDefaultFactionProgress(factionId: string): FactionProgress {
  return {
    factionId,
    joinTime: Date.now(),
    reputation: 0,
    reputationLevel: 'outsider',
    contribution: 0,
    rank: 'servant',
    lastRankPromotion: 0,
    dailyRound: createDefaultDailyRoundState(),
    weeklyRound: createDefaultWeeklyRoundState(),
    commissions: createDefaultCommissionState(),
    tasksCompleted: 0,
    commissionsCompleted: 0,
    totalDonated: 0,
    unlockedTechniques: [],
    unlockedEquipments: [],
    specialFlags: {}
  };
}

// ============================================
// 货币系统类型
// ============================================

export type CurrencyType = 'spirit_stone' | 'contribution' | 'honor' | 'festival';

export interface CurrencyState {
  spirit_stone: number;
  contribution: number;
  honor: number;
  festival: number;
}

// ============================================
// 称号系统类型
// ============================================

export interface TitleProgress {
  titles: string[];           // 已获得称号ID列表
  activeTitle: string | null; // 当前激活称号
}

// ============================================
// 选择后果系统类型
// ============================================

export interface ChoiceImpact {
  eventId: number;
  choiceIndex: number;
  timestamp: number;
  consequences: Consequence[];
}

export interface Consequence {
  type: 'immediate' | 'delayed' | 'permanent';
  effect: {
    flag?: string;
    npcRelation?: { npcId: string; change: number };
    worldChange?: { location: string; state: string };
    futureEvent?: { unlock: number[]; lock: number[] };
  };
  triggerTime?: number;
}

// ============================================
// 扩展的主角接口
// ============================================

/**
 * Protagonist扩展字段（需要合并到现有Protagonist接口）
 * 所有字段都有默认值，确保存档兼容
 */
export interface ProtagonistExtension {
  // 修炼流派
  cultivationPath: CultivationPath | null;
  pathExp: number;
  pathLevel: number;
  
  // 心境系统
  mentalState: MentalState;
  
  // 境界瓶颈
  realmBottleneck: RealmBottleneck;
  
  // 渡劫状态
  tribulationState: TribulationState;
  
  // 势力进度
  factionProgress: FactionProgress | null;
  
  // 多货币
  currencies: CurrencyState;
  
  // 称号
  titles: string[];
  activeTitle: string | null;
  
  // 体力系统
  stamina: number;           // 当前体力
  maxStamina: number;        // 最大体力
  lastStaminaRecover: number; // 上次体力恢复时间
  
  // 选择历史
  choiceHistory: ChoiceImpact[];
  worldFlags: Record<string, boolean>;
  npcRelations: Record<string, number>;
  
  // 爬塔系统（可选，使用时从 tower/types 导入 TowerProgress）
  towerProgress?: any;
  idleMode?: 'cultivate' | 'recover' | 'patrol' | 'none';
}

// 默认扩展数据（用于存档迁移）
export const DEFAULT_PROTAGONIST_EXTENSION: ProtagonistExtension = {
  cultivationPath: null,
  pathExp: 0,
  pathLevel: 1,
  mentalState: {
    stability: 70,
    karma: 0,
    demonChance: 0,
    lastDemonTime: 0,
    mentalBuffs: []
  },
  realmBottleneck: {
    isActive: false,
    type: null,
    level: 0,
    requirements: {},
    attempts: 0,
    maxAttempts: 3
  },
  tribulationState: {
    inProgress: false,
    config: null,
    currentPhase: 0,
    totalPhases: 3,
    successRate: 0
  },
  factionProgress: null,
  currencies: {
    spirit_stone: 0,
    contribution: 0,
    honor: 0,
    festival: 0
  },
  titles: [],
  activeTitle: null,
  stamina: 100,
  maxStamina: 100,
  lastStaminaRecover: Date.now(),
  choiceHistory: [],
  worldFlags: {},
  npcRelations: {},
  // 爬塔系统
  towerProgress: undefined,
  idleMode: 'none',
};

// ============================================
// 功法扩展接口
// ============================================

export interface TechniqueExtension {
  proficiency: number;
  usageCount: number;
  essence: TechniqueEssence | null;
}

export const DEFAULT_TECHNIQUE_EXTENSION: TechniqueExtension = {
  proficiency: 0,
  usageCount: 0,
  essence: null
};

// ============================================
// 装备扩展接口
// ============================================

export interface EquipmentExtension {
  enhancement: number;
  refinement: number;
  affixes: EquipmentAffix[];
  setId: string | null;
}

export const DEFAULT_EQUIPMENT_EXTENSION: EquipmentExtension = {
  enhancement: 0,
  refinement: 0,
  affixes: [],
  setId: null
};

// ============================================
// 存档迁移函数
// ============================================

/**
 * 迁移旧存档数据，添加默认扩展字段
 */
export function migrateProtagonist(old: any): any {
  return {
    ...old,
    // 确保基础字段存在
    techniques: old.techniques || [],
    equipments: old.equipments || [],
    // 添加扩展字段
    ...DEFAULT_PROTAGONIST_EXTENSION,
    ...old.cultivationPath !== undefined && { cultivationPath: old.cultivationPath },
    ...old.pathExp !== undefined && { pathExp: old.pathExp },
    ...old.pathLevel !== undefined && { pathLevel: old.pathLevel },
    ...old.mentalState !== undefined && { mentalState: old.mentalState },
    ...old.factionProgress !== undefined && { factionProgress: old.factionProgress },
    ...old.currencies !== undefined && { currencies: old.currencies },
    ...old.titles !== undefined && { titles: old.titles },
    ...old.activeTitle !== undefined && { activeTitle: old.activeTitle },
    // 体力字段迁移
    ...old.stamina !== undefined && { stamina: old.stamina },
    ...old.maxStamina !== undefined && { maxStamina: old.maxStamina },
    ...old.lastStaminaRecover !== undefined && { lastStaminaRecover: old.lastStaminaRecover },
  };
}

/**
 * 迁移功法数据，添加熟练度字段
 */
export function migrateTechnique(old: any): any {
  return {
    ...old,
    proficiency: old.proficiency ?? 0,
    usageCount: old.usageCount ?? 0,
    essence: old.essence ?? null
  };
}

/**
 * 迁移装备数据，添加词缀/强化字段
 */
export function migrateEquipment(old: any): any {
  return {
    ...old,
    enhancement: old.enhancement ?? 0,
    refinement: old.refinement ?? 0,
    affixes: old.affixes ?? [],
    setId: old.setId ?? null
  };
}

// ============================================
// 飞升系统类型
// ============================================

/**
 * 飞升印记
 */
export interface AscensionMark {
  count: number;                        // 飞升次数
  totalStatBonus: import('./types').LegacyStats;       // 累计属性加成
  unlockedTitles: string[];             // 已解锁称号
  specialAbilities: string[];           // 特殊能力
  currentTitle: string | null;          // 当前佩戴称号
  rerollAvailable: boolean;             // 是否有重新随机机会
}

/**
 * 世界访问记录
 */
export interface WorldVisitRecord {
  worldType: import('./types').WorldType;  // 世界类型
  worldName: string;                       // 世界名称
  visitedAt: number;                       // 访问时间
  ascendedFrom: boolean;                   // 是否从这里飞升
  timeSpent: number;                       // 停留时长（毫秒）
  maxLevel: number;                        // 达到的最高等级
}

/**
 * 飞升记录
 */
export interface AscensionRecord {
  id: string;
  timestamp: number;                       // 飞升时间
  fromWorld: import('./types').WorldType;  // 原世界类型
  fromWorldName: string;                   // 原世界名称
  toWorld: import('./types').WorldType;    // 新世界类型
  toWorldName: string;                     // 新世界名称
  battleResult: {
    turnsUsed: number;                     // 战斗回合数
    remainingHpPercent: number;            // 剩余HP百分比
    phasesCleared: number;                 // 清除的阶段数
    bonusRewards: string[];                // 表现奖励
  };
  inheritance: {
    technique: string | null;              // 传承功法ID
    equipment: string | null;              // 传承装备ID
    spiritStones: number;                  // 携带灵石
  };
  reward: {
    statBonus: Partial<CharacterStats>;
    title: string;
  };
}

/**
 * 穿越守卫战斗状态
 */
export interface GuardianBattleState {
  guardianName: string;                    // 守卫名称
  guardianTitle: string;                   // 守卫称号
  guardianMaxHp: number;                   // 守卫最大HP
  guardianCurrentHp: number;               // 守卫当前HP
  guardianAttack: number;                  // 守卫攻击力
  guardianDefense: number;                 // 守卫防御力
  currentPhase: number;                    // 当前阶段 (1-3)
  totalPhases: number;                     // 总阶段数
  cooldownUntil: number | null;            // 冷却结束时间戳
  consecutiveFailures: number;             // 连续失败次数
}

/**
 * 飞升挑战结果
 */
export interface AscensionChallengeResult {
  success: boolean;
  battleState?: import('./types').BattleState;
  guardianBattle?: GuardianBattleState;
  reward?: {
    statBonus: Partial<LegacyStats>;
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

/**
 * 新世界信息
 */
export interface NewWorldInfo {
  type: import('./types').WorldType;
  name: string;
  description: string;
  difficulty: number;                      // 难度系数
  specialFeatures: string[];               // 世界特性
  resourceAbundance: number;               // 资源丰富度
  danger: string;                          // 危险等级描述
}

/**
 * 传承选择
 */
export interface InheritanceChoice {
  techniqueId: string | null;              // 选择的传承功法ID
  equipmentId: string | null;              // 选择的传承装备ID
  spiritStonesPercent: number;             // 携带灵石比例 (0-0.5)
}

/**
 * 已发现的世界（可用于后续前往）
 */
export interface DiscoveredWorld {
  id: string;                              // 世界唯一ID
  info: NewWorldInfo;                      // 世界信息
  discoveredAt: number;                    // 发现时间
  visited: boolean;                        // 是否已前往过
  ascensionCount: number;                  // 发现时的飞升次数
}

/**
 * 飞升流程状态
 */
export interface AscensionFlowState {
  phase: 'none' | 'battle' | 'inheritance' | 'world_reveal' | 'complete';
  battleResult?: AscensionChallengeResult;
  inheritanceChoice?: InheritanceChoice;
  newWorld?: NewWorldInfo;                 // 当前生成的新世界
  discoveredWorlds: DiscoveredWorld[];     // 已发现的世界列表
}

/**
 * 炼制状态
 */
export interface CraftingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: string;
  success: boolean;
}

/**
 * 炼器状态
 */
export interface ForgingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: string;
  success: boolean;
}

/**
 * 游戏统计
 */
export interface GameStatistics {
  totalPlayTime: number;
  totalEnemiesKilled: number;
  totalBossKilled: number;
  totalAdventuresCompleted: number;
  totalCultivations: number;
  totalItemsCollected: number;
  totalTechniquesCollected: number;
  totalEquipmentsCollected: number;
  highestLevel: number;
  highestRealm: number;
  totalAscensions: number;
}

/**
 * 飞升系统默认值
 */
export const DEFAULT_ASCENSION_MARK: AscensionMark = {
  count: 0,
  totalStatBonus: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  unlockedTitles: [],
  specialAbilities: [],
  currentTitle: null,
  rerollAvailable: false,
};

export const DEFAULT_GUARDIAN_BATTLE_STATE: GuardianBattleState = {
  guardianName: '',
  guardianTitle: '',
  guardianMaxHp: 0,
  guardianCurrentHp: 0,
  guardianAttack: 0,
  guardianDefense: 0,
  currentPhase: 1,
  totalPhases: 3,
  cooldownUntil: null,
  consecutiveFailures: 0,
};

export const DEFAULT_ASCENSION_FLOW_STATE: AscensionFlowState = {
  phase: 'none',
  discoveredWorlds: [],
};

// ============================================
// 死亡状态系统类型
// ============================================

/**
 * 死亡原因类型
 */
export type DeathCause = 
  | 'battle_defeat'      // 战斗中被击败
  | 'adventure_fail'     // 机缘中被击败逃出
  | 'tribulation_fail'   // 渡劫失败
  | 'demon_attack'       // 心魔发作
  | 'over_exertion';     // 过度消耗

/**
 * 死亡状态
 */
export interface DeathState {
  isDead: boolean;                    // 是否处于死亡状态（显示弹窗）
  cause: DeathCause | null;           // 死亡原因
  title: string;                      // 死亡大标题
  subtitle: string;                   // 死亡小标题（原因描述）
  recoveryHp: number;                 // 恢复后的HP
  timestamp: number;                  // 死亡时间戳
}

/**
 * 残血等级
 */
export type CriticalHealthLevel = 'normal' | 'warning' | 'danger' | 'critical';

/**
 * 残血状态
 */
export interface CriticalHealthState {
  level: CriticalHealthLevel;         // 残血等级
  hpPercent: number;                  // HP百分比
  glowIntensity: number;              // 光晕强度 0-1
  pulseSpeed: number;                 // 脉冲速度（毫秒）
}

/**
 * 死亡状态默认值
 */
export const DEFAULT_DEATH_STATE: DeathState = {
  isDead: false,
  cause: null,
  title: '',
  subtitle: '',
  recoveryHp: 0,
  timestamp: 0,
};

/**
 * 根据HP百分比计算残血等级
 */
export function getCriticalHealthLevel(hpPercent: number): CriticalHealthLevel {
  if (hpPercent > 30) return 'normal';
  if (hpPercent > 15) return 'warning';
  if (hpPercent > 5) return 'danger';
  return 'critical';
}

/**
 * 根据残血等级获取视觉效果参数
 */
export function getCriticalHealthEffect(level: CriticalHealthLevel): {
  glowIntensity: number;
  pulseSpeed: number;
  glowColor: string;
} {
  switch (level) {
    case 'warning':
      return { glowIntensity: 0.15, pulseSpeed: 3000, glowColor: 'rgba(239, 68, 68, 0.3)' };
    case 'danger':
      return { glowIntensity: 0.3, pulseSpeed: 2000, glowColor: 'rgba(220, 38, 38, 0.4)' };
    case 'critical':
      return { glowIntensity: 0.5, pulseSpeed: 1000, glowColor: 'rgba(185, 28, 28, 0.5)' };
    default:
      return { glowIntensity: 0, pulseSpeed: 0, glowColor: 'transparent' };
  }
}

/**
 * 根据死亡原因生成死亡文案
 */
export function getDeathMessage(cause: DeathCause): { title: string; subtitle: string } {
  const messages: Record<DeathCause, { title: string; subtitles: string[] }> = {
    battle_defeat: {
      title: '身陨道消',
      subtitles: [
        '你被敌人击败，灵力耗尽，昏死过去...\n所幸敌人并未追击，你侥幸逃过一劫',
        '一场激战过后，你倒在血泊之中...\n敌人以为你已死，你得以苟延残喘',
        '战败之际，你拼尽最后一丝灵力逃脱...\n虽然狼狈，但至少保住了性命',
      ],
    },
    adventure_fail: {
      title: '机缘未至',
      subtitles: [
        '在秘境中遭遇强敌，你被迫逃离...\n仓促间只保住了性命和部分收获',
        '机缘凶险，你低估了其中的危险...\n负伤逃出，但尚有东山再起的机会',
        '秘境探索失败，你被击退至入口...\n虽然受伤，但保全了性命',
      ],
    },
    tribulation_fail: {
      title: '劫数难逃',
      subtitles: [
        '天劫之力远超你的承受范围...\n在生死边缘徘徊，最终勉强活了下来',
        '渡劫失败，天雷劈散了你的修为...\n但天道留了一线生机，你得以幸存',
        '劫雷落下，你几乎灰飞烟灭...\n关键时刻，某件宝物护住了你的神魂',
      ],
    },
    demon_attack: {
      title: '心魔侵蚀',
      subtitles: [
        '心魔趁虚而入，侵蚀了你的神智...\n在最后一刻，你凭借意志力将其压制',
        '心魔反噬，你陷入了短暂的疯狂...\n清醒后发现自己浑身是血，却不知身在何处',
        '内心深处的执念化作心魔...\n经过一番苦战，你终于将其驱散',
      ],
    },
    over_exertion: {
      title: '透支过甚',
      subtitles: [
        '过度透支灵力，你的身体濒临崩溃...\n强撑着找了个隐蔽之处休养',
        '连续修炼导致真气逆流...\n你昏厥了很长时间，醒来时发现自己躺在地上',
        '不顾身体极限强行突破...\n虽然失败，但至少没有走火入魔',
      ],
    },
  };

  const config = messages[cause];
  const subtitle = config.subtitles[Math.floor(Math.random() * config.subtitles.length)];
  
  return { title: config.title, subtitle };
}
