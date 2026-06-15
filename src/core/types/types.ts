import { FragmentDropData, FragmentDropResult } from '@/modules/crafting/logic/fragmentSystem';
import type { RealmSystem } from '@/modules/progression/data/realmCore';

// 重新导出难度级别类型
export type { DifficultyLevel } from '@/modules/identity/data/worldData';

// 重新导出碎片相关类型
export type { FragmentDropData, FragmentDropResult } from '@/modules/crafting/logic/fragmentSystem';

// 重新导出势力相关类型
export type { Faction, FactionType } from '@/modules/faction/data/factionData';
export { FactionTypeNames, getFactionsByWorld, getFactionById } from '@/modules/faction/data/factionData';

// 重新导出克制关系类型
export type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
export {
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
  ELEMENT_KEYWORDS,
  WEAPON_KEYWORDS,
  getElementIcon,
  getWeaponCategoryIcon,
} from '@/modules/combat/logic/restraintSystem';

// 敌人等级类型（在此定义，避免循环依赖）
export type EnemyTier = 'normal' | 'elite' | 'miniboss' | 'boss';

// ============================================
// 新数值系统：属性 (Attribute) + 核心值 (CoreStat)
// ============================================

/** 属性分类标签（用于计算引擎按分类查找属性，不依赖属性名） */
export type AttributeCategory = 'primary_physical' | 'primary_spiritual' | 'primary_martial' | 'secondary';

/**
 * 核心值维度 key（固定 11 维，全世界观通用）
 *
 * 核心值是战斗/养成系统消费的统一数值层，
 * 由世界观属性通过 AttributeDefinition.calculations 映射派生。
 *
 * 分类：
 *   战斗(6): maxHp 生命值 / physicalATK 物理攻击 / specialATK 特殊攻击
 *            physicalDEF 物理防御 / specialDEF 特殊防御 / speed 出手速度
 *   养成(4): intelligence 学习速度 / willpower 修炼毅力/突破
 *            lifespan 剩余寿元 / perception 探索范围/隐藏发现
 *   专属(1): specialResourceCap 专项数值上限(修仙→法力/魔法→魔力/科技→能量)
 */
export type CoreStatKey =
  | 'maxHp'              // 生命值 —— 归零死亡
  | 'physicalATK'        // 物理攻击 —— 肉体/武器造成的伤害基准
  | 'specialATK'         // 特殊攻击 —— 法术/精神/元素伤害基准
  | 'physicalDEF'        // 物理防御 —— 减免物理伤害
  | 'specialDEF'         // 特殊防御 —— 减免特殊伤害
  | 'speed'              // 速度 —— 回合制出手顺序
  | 'intelligence'       // 智力 —— 学习功法/技能的速度
  | 'willpower'          // 毅力 —— 挂机修炼收益、突破成功率
  | 'lifespan'           // 寿命 —— 剩余寿元，耗尽陨落
  | 'perception'         // 感知 —— 探索范围、隐藏事件发现
  | 'specialResourceCap'; // 专项数值上限 —— 修仙=法力/魔法=魔力/科技=能量

/** 核心值基础值定义 */
export type CoreStatBaseValues = Record<CoreStatKey, number>;

/** 属性到核心值的映射计算定义（数值型属性用） */
export interface AttributeCalculation {
  targetCoreStat: CoreStatKey;
  multiplier: number;
}

/** 枚举型属性的一个选项 */
export interface AttributeEnumValue {
  value: string;
  bonuses: Partial<Record<CoreStatKey, number>>;
}

// ── 属性模板（Mod 内容类型 attributes 定义）──

/** 属性模板（Mod 属性池中定义，不含成长规则） */
export type AttributeTemplate =
  | NumericAttributeTemplate
  | EnumAttributeTemplate;

export interface NumericAttributeTemplate {
  type: 'numeric';
  key: string;
  displayName: string;
  category: AttributeCategory;
  baseValue: number;
  calculations: AttributeCalculation[];
}

export interface EnumAttributeTemplate {
  type: 'enum';
  key: string;
  displayName: string;
  category: AttributeCategory;
  enumValues: AttributeEnumValue[];
}

// ── 用户可见的属性分解 ——

/**
 * 属性明细（玩家可见的数值构成）
 *
 * 影响链：基础值 + 随机分配 + 等级成长 + 天赋 + 种族 + 物品 = 最终属性值 → 核心值
 */

/** 单个属性的贡献来源 */
export interface AttributeBreakdown {
  /** 最终值 */
  value: number;
  /** 属性模板基础值 */
  base: number;
  /** 随机分配（角色模板生成时） */
  rolled: number;
  /** 天赋加成 */
  talent: number;
  /** 种族加成 */
  race: number;
  /** 等级成长 */
  growth: number;
  /** 物品/丹药加成（预留） */
  item: number;
}

// ── 属性成长规则 ——

/** 单个成长计算项 */
export type AttributeGrowthTerm =
  | { type: 'linear'; multiplier: number }
  | { type: 'exponential'; baseMultiplier: number }
  | { type: 'constant'; value: number }
  | { type: 'perRealm'; realmBonuses: Record<string, number> };

/**
 * 属性成长规则——由多项计算组合而成
 *
 * attrValue = baseValue + Σ(各项计算结果)
 *
 * 示例（线性 + 常数）：
 *   [{ type: 'linear', multiplier: 0.5 }, { type: 'constant', value: 2 }]
 *   → attrValue = baseValue + 0.5*level + 2
 *
 * 示例（指数 + 境界加成）：
 *   [{ type: 'exponential', baseMultiplier: 1.02 }, { type: 'perRealm', realmBonuses: { '筑基': 2, '金丹': 5 } }]
 *   → attrValue = baseValue * (1.02^level) + realmBonus
 */
export type AttributeGrowthRule = AttributeGrowthTerm[];

// ── 世界观中的属性配置 ——

/** 世界观属性配置：选属性 key + 定本世界观的成长规则 */
export interface WorldviewAttributeConfig {
  /** 属性 key（引用 AttributeRegistry 中的模板） */
  key: string;
  /** 本世界观的成长规则（多项组合，与境界体系挂钩） */
  growthRule: AttributeGrowthRule;
}

// ── 兼容别名（过渡期）──

/** 属性定义（兼容旧名） */
export type AttributeDefinition = AttributeTemplate;
/** 数值型属性（兼容旧名） */
export type NumericAttributeDefinition = NumericAttributeTemplate;
/** 枚举型属性（兼容旧名） */
export type EnumAttributeDefinition = EnumAttributeTemplate;

/** 专项数值定义（世界观决定槽位名和内容：修仙→法力、魔法→魔力、科技→能量） */
export interface SpecialResourceDef {
  /** 显示名（如 "法力"、"魔力"） */
  displayName: string;
  /** 默认上限 */
  defaultCap: number;
  /** 每级上限成长 */
  capGrowthPerLevel: number;
  /** 受哪些属性影响（属性 displayName 列表） */
  affectedBy: string[];
}

// ============================================
// 种族 (Race) 与天赋 (Talent)
// ============================================

/** 天生能力定义 */
export interface InnateAbility {
  id: string;
  name: string;
  description: string;
  /** 对核心值的固定修正 */
  effects: Partial<Record<CoreStatKey, { flat?: number; multiplier?: number }>>;
}

/** 种族定义（Mod 内容类型：races） */
export interface RaceDefinition {
  /** 全局唯一标识（kebab-case，如 "human"、"demon"） */
  id: string;
  /** 中文显示名 */
  name: string;
  /** 种族描述 */
  description: string;
  /** 限制出现的世界观 ID 列表（空 = 全世界观可用） */
  worldviewRestrictions?: string[];
  /** 对属性层的基础加成（属性 displayName → 加成值） */
  baseAttributeBonuses: Record<string, number>;
  /** 可选天赋 ID 列表 */
  talentPool: string[];
  /** 天生能力列表 */
  innateAbilities: InnateAbility[];
  /** 寿命修正倍数（1.0 = 标准人族寿命） */
  lifespanModifier: number;
}

/** 天赋修正效果（仅影响属性层，核心值自动重新计算） */
export interface TalentEffect {
  /** 修正目标（属性 key，如 "constitution"、"spiritPower"） */
  target: string;
  /** 效果类型（attribute_flat = 属性值固定加成） */
  type: 'attribute_flat';
  /** 修正值 */
  value: number;
}

/** 天赋稀有度 */
export type TalentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** 天赋定义（Mod 内容类型：talents） */
export interface TalentDefinition {
  /** 全局唯一标识 */
  id: string;
  /** 中文显示名 */
  name: string;
  /** 天赋描述 */
  description: string;
  /** 限制种族 ID 列表（空 = 全种族可用） */
  raceRestrictions?: string[];
  /** 限制世界观 ID 列表（空 = 全世界观可用） */
  worldviewRestrictions?: string[];
  /** 修正效果列表 */
  effects: TalentEffect[];
  /** 稀有度 */
  rarity: TalentRarity;
  /** 互斥天赋 ID 列表 */
  conflictsWith?: string[];
  /** 对话检定标签 */
  dialogueTag?: string;
}

// ============================================
// CRPG 对话检定
// ============================================

/** 对话检定定义（挂载在对话选项上） */
export interface DialogueCheck {
  /** 检定类型 */
  type: 'attribute' | 'coreStat' | 'talent';
  /** 检定目标（属性 displayName / 核心值 key / 天赋 ID） */
  target: string;
  /** 难度等级（1-30） */
  difficulty: number;
  /** 成功文本 */
  successText: string;
  /** 失败文本 */
  failureText: string;
  /** 成功分支 ID */
  successBranch: string;
  /** 失败分支 ID */
  failureBranch: string;
}

/** 检定结果 */
export interface CheckResult {
  /** 是否通过 */
  success: boolean;
  /** d20 投骰结果 */
  roll: number;
  /** 属性/核心值修正值 */
  modifier: number;
  /** 最终值（roll + modifier） */
  total: number;
  /** 难度等级 */
  difficulty: number;
  /** 检定类型 */
  type: 'attribute' | 'coreStat' | 'talent';
  /** 检定目标 */
  target: string;
}

// ============================================
// NPC 系统
// ============================================

/** 态度等级（NPC 对玩家的好感度分层） */
export type AttitudeLevel = 'adoration' | 'friendly' | 'amiable' | 'neutral' | 'cold' | 'hostile' | 'vengeful';

/** 态度等级区间映射 */
export const ATTITUDE_LEVEL_RANGES: Record<AttitudeLevel, { min: number; max: number; label: string }> = {
  adoration: { min: 81, max: 100, label: '崇拜' },
  friendly:  { min: 51, max: 80,  label: '友好' },
  amiable:   { min: 21, max: 50,  label: '善意' },
  neutral:   { min: -20, max: 20, label: '中立' },
  cold:      { min: -50, max: -21, label: '冷淡' },
  hostile:   { min: -80, max: -51, label: '敌视' },
  vengeful:  { min: -100, max: -81, label: '仇恨' },
};

/** 态度配置（NPC JSON 中定义初始态度参数） */
export interface NPCAttitudeConfig {
  /** 初始态度值（默认 0） */
  initialValue: number;
  /** 态度变化速率倍率（1.0 = 标准速率） */
  changeRateModifier: number;
  /** 最低可能态度值（默认 -100） */
  minValue?: number;
  /** 最高可能态度值（默认 100） */
  maxValue?: number;
}

/** 阵营关系等级 */
export type FactionRelation = 'allied' | 'friendly' | 'neutral' | 'hostile' | 'atWar';

/** 阵营关系对态度的影响配置 */
export const FACTION_RELATION_CONFIG: Record<FactionRelation, {
  initialAttitude: number;
  positiveMultiplier: number;
  negativeMultiplier: number;
  label: string;
}> = {
  allied:   { initialAttitude: 40,  positiveMultiplier: 1.5, negativeMultiplier: 0.5, label: '同盟' },
  friendly: { initialAttitude: 20,  positiveMultiplier: 1.2, negativeMultiplier: 0.8, label: '友好' },
  neutral:  { initialAttitude: 0,   positiveMultiplier: 1.0, negativeMultiplier: 1.0, label: '中立' },
  hostile:  { initialAttitude: -30, positiveMultiplier: 0.5, negativeMultiplier: 1.5, label: '敌对' },
  atWar:    { initialAttitude: -60, positiveMultiplier: 0.3, negativeMultiplier: 2.0, label: '交战' },
};

/** 核心值门槛（对话选项中检查角色核心值是否达标） */
export interface StatGate {
  /** 核心值 key */
  coreStat: CoreStatKey;
  /** 最低值 */
  minValue: number;
  /** 不达标时的提示文本 */
  failureHint: string;
}

/** NPC 对话选项 */
export interface NPCDialogueOption {
  /** 选项 ID */
  id: string;
  /** 选项文本 */
  text: string;
  /** 态度门槛（低于此值选项隐藏或灰掉） */
  minAttitude?: number;
  /** 核心值门槛列表（任一不达标则选项灰掉） */
  statGates?: StatGate[];
  /** CRPG 检定（达标后可选，但需 d20 投骰） */
  check?: DialogueCheck;
  /** 无检定时选中后跳转的对话行 ID */
  resultBranch: string;
}

/** NPC 对话行（对话树节点） */
export interface NPCDialogueLine {
  /** 行 ID */
  id: string;
  /** NPC 说的文本 */
  text: string;
  /** 玩家可选选项列表 */
  options: NPCDialogueOption[];
  /** 是否可重复触发 */
  repeatable: boolean;
  /** 冷却时间（秒，仅 repeatable=true 时有效） */
  cooldownSeconds?: number;
  /** 进入此对话行时触发的事件 ID 列表 */
  onEnter?: string[];
}

/** NPC 商品/交易物品 */
export interface NPCShopItem {
  /** 物品/道具 ID（引用物品系统） */
  itemId: string;
  /** 基准价格 */
  basePrice: number;
  /** 当前库存（undefined = 无限供应） */
  quantity?: number;
  /** 最大库存（用于自动补货） */
  maxQuantity?: number;
  /** 补货间隔（秒，undefined = 不自动补货） */
  restockIntervalSeconds?: number;
  /** 最低态度要求（低于此值不售卖） */
  minAttitude?: number;
}

/** NPC 战斗风格 */
export type NPCCombatStyle = 'melee' | 'ranged' | 'caster' | 'support';

/** NPC 战斗行为配置 */
export interface NPCCombatBehavior {
  /** 敌意阈值（态度低于此值主动攻击，默认 -50） */
  aggressionThreshold: number;
  /** 逃跑阈值（HP 比例 0~1，0 = 不逃跑） */
  fleeThreshold: number;
  /** 战斗风格 */
  combatStyle: NPCCombatStyle;
  /** 技能使用优先级（技能 ID 列表） */
  skillPriority: string[];
}

/** NPC AI 对话配置（扩展点，当前预留） */
export interface NPCAIDialogueConfig {
  /** 是否启用 AI 对话 */
  enabled: boolean;
  /** AI 角色设定 prompt */
  systemPrompt?: string;
  /** 上下文窗口 token 数 */
  contextTokens?: number;
  /** 允许的对话主题 */
  allowedTopics?: string[];
  /** AI 不可用时的回落对话行 ID 列表 */
  fallbackLines?: string[];
}

/** NPC 完整定义（Mod 内容类型：npcs） */
export interface NPCDefinition {
  /** 全局唯一标识（kebab-case） */
  id: string;
  /** 中文显示名 */
  name: string;
  /** NPC 描述文本 */
  description: string;
  /** 限制出现的世界观 ID 列表（空 = 全世界观可用） */
  worldviewRestrictions?: string[];
  /** 所属阵营 ID */
  factionId?: string;

  // 战斗相关（复用角色模型）
  /** 属性值（key 需匹配目标世界观的 attributeDefinitions） */
  attributes: Record<string, number>;
  /** 核心值 */
  coreStats: Record<CoreStatKey, number>;
  /** 种族 ID（引用 races 注册中心） */
  raceId?: string;
  /** 天赋 ID 列表（引用 talents 注册中心） */
  talentIds?: string[];

  // NPC 专属字段
  /** 态度配置 */
  attitude: NPCAttitudeConfig;
  /** 对话行库（ID → 对话树节点） */
  dialogueLines: Record<string, NPCDialogueLine>;
  /** 交易物品（空数组或 undefined = 非商人） */
  shopItems?: NPCShopItem[];
  /** 是否支持 AI 对话 */
  supportsAIDialogue: boolean;
  /** AI 对话配置（supportsAIDialogue=true 时生效） */
  aiDialogueConfig?: NPCAIDialogueConfig;
  /** 战斗行为配置 */
  combatBehavior: NPCCombatBehavior;
}

// ============================================
// 任务系统 (Quest)
// ============================================

/** 任务类型 */
export type QuestType = 'main' | 'side' | 'hidden' | 'daily' | 'event';

/** 任务目标类型 */
export type QuestObjectiveType =
  | 'talk_to_npc'
  | 'kill_enemy'
  | 'collect_item'
  | 'reach_realm'
  | 'reach_level'
  | 'explore_location'
  | 'use_item'
  | 'dialogue_check'
  | 'custom';

/** 前置条件类型 */
export type QuestPrerequisiteType =
  | 'level'
  | 'realm'
  | 'quest_completed'
  | 'faction'
  | 'attitude'
  | 'coreStat'
  | 'attribute'
  | 'item_owned';

/** 任务目标定义 */
export interface QuestObjective {
  /** 目标类型 */
  type: QuestObjectiveType;
  /** 目标 ID（NPC ID / 物品 ID / 境界名 / 位置 ID） */
  target: string;
  /** 数量要求（默认 1） */
  count?: number;
  /** 显示给玩家的描述 */
  description: string;
  /** 是否隐藏目标（不显示给玩家） */
  hidden?: boolean;
}

/** Stage 完成后的分支选项 */
export interface QuestStageCompletion {
  /** 本分支的描述 */
  description: string;
  /** 下一 Stage ID（undefined = 任务结束） */
  nextStageId?: string;
  /** 本阶段奖励 */
  stageRewards?: QuestReward[];
}

/** 任务阶段 */
export interface QuestStage {
  /** Stage ID */
  id: string;
  /** Stage 名称 */
  name: string;
  /** Stage 描述 */
  description: string;
  /** 完成目标列表 */
  objectives: QuestObjective[];
  /** 完成后的分支选项（key = 完成方式标识，如 "fight"、"persuade"） */
  completions: Record<string, QuestStageCompletion>;
  /** 进入此 Stage 时触发的 NPC 对话（可选） */
  npcDialogueOnEnter?: { npcId: string; lineId: string };
}

/** 任务前置条件 */
export interface QuestPrerequisite {
  /** 条件类型 */
  type: QuestPrerequisiteType;
  /** 目标值（level=5, realm=筑基, quest=quest_001, faction=righteous_sect 等） */
  target: string;
  /** 最小值 */
  minValue?: number;
  /** 最大值（可选） */
  maxValue?: number;
}

/** 任务奖励 */
export interface QuestReward {
  /** 经验值 */
  experience?: number;
  /** 灵石 */
  spiritStones?: number;
  /** 物品奖励 */
  items?: { itemId: string; quantity: number }[];
  /** 声望变化 */
  reputation?: { factionId: string; change: number };
  /** 态度值变化 */
  attitudeChanges?: { npcId: string; change: number }[];
  /** 解锁新任务 ID 列表 */
  unlockQuests?: string[];
}

/** 任务完整定义（Mod 内容类型：quests） */
export interface QuestDefinition {
  /** 全局唯一标识（kebab-case） */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务描述 */
  description: string;
  /** 任务类型 */
  type: QuestType;
  /** 限制出现的世界观 ID 列表 */
  worldviewRestrictions?: string[];
  /** 前置条件（所有条件必须同时满足） */
  prerequisites: QuestPrerequisite[];
  /** 阶段列表 */
  stages: QuestStage[];
  /** 最终完成奖励 */
  rewards: QuestReward[];
  /** 是否可重复（daily 类型默认为 true） */
  repeatable: boolean;
  /** 冷却时间（秒，仅 repeatable 任务有效） */
  cooldownSeconds?: number;
}

// ── 运行时状态 ──

/** 活跃任务（玩家进行中的任务） */
export interface ActiveQuest {
  /** 任务 ID */
  questId: string;
  /** 当前阶段 ID */
  currentStageId: string;
  /** 目标进度（key = "type:target"，value = 当前进度） */
  objectives: Record<string, number>;
  /** 开始时间戳 */
  startedAt: number;
}

/** 任务系统全局状态 */
export interface QuestState {
  /** 活跃任务（key = questId） */
  activeQuests: Record<string, ActiveQuest>;
  /** 已完成任务 ID 列表 */
  completedQuests: string[];
  /** 已领取奖励的任务 ID 列表（用于 repeatable 任务） */
  claimedRewards: string[];
  /** 阶段历史（questId → 已完成的 stageId 列表，用于分支追踪） */
  stageHistory: Record<string, string[]>;
}

/** 创建默认任务状态 */
export function createDefaultQuestState(): QuestState {
  return {
    activeQuests: {},
    completedQuests: [],
    claimedRewards: [],
    stageHistory: {},
  };
}

// ============================================
// 旧属性系统（DEPRECATED — 迁移到新 Attribute/CoreStat 系统）
// ============================================

/**
 * 固定属性（由词条决定，不可通过修炼提升）
 * @deprecated 使用 AttributeDefinition[] + Record<string, number> 替代。
 *             新代码应使用动态属性结构，不硬编码属性名。
 */
export interface BaseStats {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/**
 * 可成长属性（通过修炼、突破等事件获得）
 * @deprecated 使用 AttributeDefinition[] + Record<string, number> 替代。
 */
export interface GrowthStats {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/**
 * 角色属性完整结构（V2 — 将被新系统替代）
 *
 * @deprecated 新代码使用 CharacterAttributesV3:
 *   type CharacterAttributesV3 = {
 *     attributes: Record<string, number>;
 *     coreStats: Record<CoreStatKey, number>;
 *   };
 */
export interface CharacterStats {
  base: BaseStats;
  growth: GrowthStats;
}

/** 角色属性 V3（新系统） */
export interface CharacterAttributesV3 {
  /** 属性最终值（key → 数值，已含天赋/种族/等级加成） */
  attributes: Record<string, number>;
  /** 属性分解明细（key → 各来源贡献值） */
  attributeBreakdown?: Record<string, AttributeBreakdown>;
  /** 派生的核心值 */
  coreStats: Record<CoreStatKey, number>;
  /** 种族 ID */
  raceId: string;
  /** 天赋 ID 列表 */
  talentIds: string[];
}

/**
 * 快捷函数：获取最终属性（base + growth）
 * @deprecated 使用 calculateCoreStats() 替代
 */
export function getFinalStats(stats: CharacterStats): BaseStats {
  return {
    体质: stats.base.体质 + stats.growth.体质,
    灵根: stats.base.灵根 + stats.growth.灵根,
    悟性: stats.base.悟性 + stats.growth.悟性,
    幸运: stats.base.幸运 + stats.growth.幸运,
    意志: stats.base.意志 + stats.growth.意志,
  };
}

/**
 * 属性键类型
 * @deprecated 使用 CoreStatKey 或动态 AttributeDefinition.key 替代
 */
export type StatKey = '体质' | '灵根' | '悟性' | '幸运' | '意志';

/** 扁平属性值字典：将 StatKey 映射为数值 */
export type FlatStats = Record<StatKey, number>;

/**
 * 快捷函数：获取属性键列表
 * @deprecated 使用 AttributeDefinition[] 动态获取
 */
export function getStatKeys(): StatKey[] {
  return ['体质', '灵根', '悟性', '幸运', '意志'];
}

/**
 * 工厂函数：创建默认 CharacterStats
 * @deprecated 使用世界观 attributeDefinitions 创建默认属性
 */
export function createDefaultStats(baseValues?: Partial<BaseStats>): CharacterStats {
  const defaultBase: BaseStats = {
    体质: 50,
    灵根: 50,
    悟性: 50,
    幸运: 50,
    意志: 50,
    ...baseValues,
  };
  return {
    base: defaultBase,
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 工厂函数：从 BaseStats 创建 CharacterStats（growth 置零）
 * @deprecated 使用新属性系统替代
 */
export function fromOldStats(oldStats: BaseStats): CharacterStats {
  return {
    base: { ...oldStats },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 工厂函数：创建带加成的 CharacterStats
 */
export function createStatsWithBonuses(
  baseValues: BaseStats,
  growthBonuses: Partial<GrowthStats>
): CharacterStats {
  return {
    base: { ...baseValues },
    growth: {
      体质: growthBonuses.体质 || 0,
      灵根: growthBonuses.灵根 || 0,
      悟性: growthBonuses.悟性 || 0,
      幸运: growthBonuses.幸运 || 0,
      意志: growthBonuses.意志 || 0,
    },
  };
}

/**
 * 更新成长属性
 */
export function updateGrowthStats(
  stats: CharacterStats,
  changes: Partial<GrowthStats>
): CharacterStats {
  return {
    ...stats,
    growth: {
      ...stats.growth,
      ...changes,
    },
  };
}

/**
 * 更新基础属性
 */
export function updateBaseStats(
  stats: CharacterStats,
  changes: Partial<BaseStats>
): CharacterStats {
  return {
    ...stats,
    base: {
      ...stats.base,
      ...changes,
    },
  };
}

/**
 * 获取可成长属性上限
 * @param level 等级
 * @returns 可成长属性上限
 */
export function getGrowthStatCap(level: number): number {
  return level * 2;
}

/**
 * 限制可成长属性值不超过上限
 * @param value 当前属性值
 * @param level 等级
 * @returns 限制后的属性值
 */
export function clampGrowthStatValue(value: number, level: number): number {
  const maxCap = getGrowthStatCap(level);
  return Math.max(0, Math.min(value, maxCap));
}

/**
 * 创建默认角色属性
 */
export function createDefaultCharacterStats(): CharacterStats {
  const base = 50;
  return {
    base: { 体质: base, 灵根: base, 悟性: base, 幸运: base, 意志: base },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 统一品质类型（全局统一，从高到低）
 * 红色(mythic) > 橙色(legendary) > 黄色(epic) > 紫色(rare) > 蓝色(uncommon) > 绿色(common) > 灰色(poor) > 白色(basic)
 */
export type Quality = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'poor' | 'basic';

// 品质中文名称映射
export const QualityNames: Record<Quality, string> = {
  mythic: '传说',
  legendary: '史诗',
  epic: '稀有',
  rare: '精良',
  uncommon: '优秀',
  common: '普通',
  poor: '劣质',
  basic: '基础',
};

// 影响类型（兼容旧代码，映射到品质）
export type ImpactLevel = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

// 属性名称类型
export type StatName = '体质' | '灵根' | '悟性' | '幸运' | '意志';

// 属性影响
export interface StatImpact {
  体质?: number;
  灵根?: number;
  悟性?: number;
  幸运?: number;
  意志?: number;
}

// 带影响的词条
export interface ImpactfulTrait {
  name: string;
  description: string; // 简短描述对属性的影响
  impact: StatImpact;
  totalImpact: number; // 总影响权重（正数为增益，负数为减益）
  level: ImpactLevel;
}

// 角色信息
export interface Character {
  id: number;
  name: string;
  gender: '男' | '女';
  age: number;
  origin: ImpactfulTrait; // 出身（带影响）
  trait: ImpactfulTrait; // 特性（新增，带影响）
  personality: ImpactfulTrait; // 性格（带影响）
  talent: ImpactfulTrait; // 天赋（带影响）
  background: string; // 背景故事
  stats: CharacterStats;
  totalPower: number; // 总权重，用于平衡
  /** 多维度评分 */
  dimensionScores?: DimensionScores;
  /** 检测到的协同效果 */
  synergies?: SynergyEffect[];
  /** 角色定位 */
  archetype?: RoleProfile;
}

// ============================================
// 角色评估系统类型
// ============================================

/**
 * 维度评分
 */
export interface DimensionScores {
  combat: number;      // 战斗评分
  cultivation: number; // 修炼评分
  survival: number;    // 生存评分
  exploration: number;  // 探索评分
  overall: number;     // 综合评分
}

/**
 * 角色定位类型
 */
export type RoleArchetype = 
  | 'combat_warrior'    // 战斗型
  | 'cultivation_genius' // 修炼型
  | 'survival_master'    // 生存型
  | 'fortune_seeker'     // 探索型
  | 'balanced'           // 均衡型
  | 'specialist';       // 特化型

/**
 * 角色定位档案
 */
export interface RoleProfile {
  archetype: RoleArchetype;
  label: string;                    // 定位标签（如"战斗型"）
  description: string;               // 定位描述
  recommendedPlaystyle: string;      // 推荐玩法
  strengths: string[];               // 优势
  weaknesses: string[];              // 劣势
}

/**
 * 协同效果
 */
export interface SynergyEffect {
  id: string;                        // 效果ID
  name: string;                      // 效果名称（如"战魂"）
  description: string;               // 效果描述
  traits: string[];                 // 参与的词条名列表
  stats: string[];                  // 影响的属性列表
  bonus: number;                     // 额外加成值
  type: 'combat' | 'cultivation' | 'survival' | 'exploration';
}

/**
 * 完整角色评估
 */
export interface CharacterEvaluation {
  scores: DimensionScores;
  synergies: SynergyEffect[];
  archetype: RoleProfile;
  hints: string[];
}

// ============================================
// 世界类型
// ============================================

/**
 * WorldType 品牌符号（Mod 可扩展类型）
 *
 * 品牌字符串类型，支持通过 Mod 系统扩展新的世界类型。
 * 通过 asWorldType() 工厂函数在运行时校验。
 *
 * 迁移说明：当前 WorldType 仍保留为联合类型以兼容已有代码。
 * 消费者逐步迁移到使用此品牌类型 + asWorldType()。
 * 迁移完成后，WorldType 将改为品牌类型，联合类型将移除。
 */
declare const WorldTypeBrand: unique symbol;

/**
 * 可扩展世界类型（品牌字符串）
 *
 * 用于新代码和 Mod 系统中的世界类型值。
 * 通过 shared/lib/registry 的 asWorldType() 工厂函数创建。
 */
export type ExtensibleWorldType = string & { [WorldTypeBrand]: true };

/**
 * 世界类型（可扩展字符串）
 *
 * 新世界类型通过 Mod 系统在 WorldViewRegistry 中注册。
 * 不再硬编码联合类型——任何已注册的字符串 ID 都是有效的世界类型。
 * 如需类型级校验，使用 ExtensibleWorldType + asWorldType()。
 */
export type WorldType = string;

/**
 * @deprecated 使用 WorldViewRegistry.getAllIds() 替代
 */
export function getBuiltinWorldTypes(): string[] {
  // Dynamic import not possible at module level; callers should use registry directly
  return ['修仙', '高武', '科技', '魔幻', '异能', '仙侠', '武侠', '末世'];
}

// 世界难度等级（由世界系数决定）
export type WorldDifficulty = '简单' | '普通' | '困难' | '噩梦' | '地狱' | '深渊';

// 世界影响
export interface WorldImpact {
  description: string; // 描述
  impact: StatImpact; // 对属性的影响
  impactDescription: string; // 影响说明
}

// 世界中的势力信息（生成后）
export interface WorldFaction {
  id: string;
  name: string;
  type: string; // 势力类型名称（宗门、皇朝等）
  description: string;
}

// 世界信息
/**
 * 世界战斗基础数值（客户端计算所需子集）
 *
 * 嵌入 World 对象中，由服务端生成时从 WorldviewDefinition.stats 填充，
 * 避免客户端访问 WorldViewRegistry。
 */
export interface WorldBalanceStats {
  baseHp: number;
  hpPerLevel: number;
  hpPerConstitution: number;
  baseAttack: number;
  attackPerLevel: number;
  attackPerConstitution: number;
  attackPerSpiritRoot: number;
  baseDefense: number;
  defensePerLevel: number;
  defensePerWillpower: number;
}

export interface World {
  /**
   * 世界唯一标识（即种子字符串，如 "a0b1c2d3"）
   *
   * id === seed，相同 seed 永远生成相同的世界。
   */
  id: string;
  /** 由 seed 派生的确定性随机数（所有子生成器的唯一随机源） */
  random: number;
  /** 世界生成时的游戏版本号（semver 格式，如 "0.1.0"） */
  gameVersion: string;
  /** 世界观标识（English kebab-case，对应 WorldviewDefinition.id，如 "cultivation"） */
  worldviewId: string;
  name: string;
  type: WorldType;
  description: string;
  powerSystem: string; // 力量体系描述（用于显示）
  realmSystem: RealmSystem; // 境界系统（用于计算）
  majorForces: string; // 主要势力描述（兼容旧代码）
  /** 具体势力列表（新生成） */
  factions: WorldFaction[];

  // === 难度系统 ===
  /** 世界基础系数（固定值，根据世界类型） */
  baseCoefficient: number;
  /** 世界实际系数（基础系数 + 飞升加成） */
  actualCoefficient: number;
  /** 世界难度（由实际系数计算得出） */
  difficulty: WorldDifficulty;

  // === 危险与机缘 ===
  /** 世界危险效果列表 */
  dangers: import('@/modules/identity/data/worldEffectsData').WorldDanger[];
  /** 世界机缘效果列表 */
  opportunities: import('@/modules/identity/data/worldEffectsData').WorldOpportunity[];

  // === 综合评价 ===
  /** 世界综合评价分数（1-100，由评分系统计算，生成时默认为 0） */
  ratingScore: number;

  // === 前端展示数据（由服务端生成时填充，前端直接从 World 对象读取，无需查注册中心） ===
  /** 世界视觉配置（图标、配色、渐变等） */
  visualConfig: {
    icon: string;
    accentColor: string;
    gradientClass: string;
    borderColor: string;
    bgGradient: string;
    colorGradient: string;
  };
  /** 属性显示名映射（内部键 → 世界对应的显示名，如 { 体质: '根骨', 灵根: '悟性' }） */
  statDisplayNames: Record<string, string>;
  /** 属性完整定义（模板 + 世界观成长规则合并，前端动态渲染） */
  attributeDefinitions: (AttributeTemplate & { growthRule: AttributeGrowthRule })[];
  /** 该世界观可用的种族 ID 列表（V3 新增） */
  racePool: string[];
  /** 该世界观可遭遇的任务 ID 列表（V3 新增，空数组 = 所有 worldview 兼容任务可用） */
  questPool: string[];
  /** 专项数值定义（V3 新增，如修仙的"法力"——仅定义显示名，基础值在代码常量） */
  specialResource?: SpecialResourceDef;
  /** 世界战斗基础数值（由服务端从 WorldviewDefinition.stats 填入，供前端计算 HP/MP/攻击/防御，避免访问 WorldViewRegistry） */
  worldStats: WorldBalanceStats;

  // === 特殊剧情 ===
  /** 特殊剧情引用（指向 modules/narrative/story 中的 Story） */
  specialPlot?: {
    storyId: string;
    title: string;
    description: string;
  } | null;
}

// 道具类型
export type ItemType = '丹药' | '材料' | '功法' | '装备' | '消耗品' | '灵石' | '碎片';

// 道具稀有度（新增神话等级）
export type ItemRarity = '普通' | '稀有' | '史诗' | '传说' | '神话';

// 道具效果类型
export type EffectType = 
  | 'cultivation_boost' // 修炼增益
  | 'stat_boost' // 属性增益
  | 'restore' // 恢复
  | 'luck_boost' // 幸运增益
  | 'combat_boost' // 战斗增益
  | 'breakthrough_boost' // 突破增益
  | 'restore_hp' // 恢复生命
  | 'restore_mp'; // 恢复法力

// 道具效果
export interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number; // 持续次数，-1表示永久
  description: string;
}

// 道具定义
export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effects: ItemEffect[];
  stackable: boolean;
  maxStack: number;
  worldTypes?: WorldType[]; // 限定世界类型，undefined表示通用
  // 丹药境界限制
  realmLevel?: number; // 适用境界等级（1-10），用于丹药
  unlockLevel?: number; // 解锁等级，用于丹药和其他物品
}

// 背包道具实例
export interface InventoryItem {
  id: string;
  definition: ItemDefinition;
  quantity: number;
  remainingUses?: number; // 剩余使用次数（用于持续效果道具）
}

/**
 * 创建背包道具实例的工厂函数
 * 自动生成唯一 ID
 */
export function createInventoryItem(
  definition: ItemDefinition,
  quantity: number = 1,
  existingItem?: Partial<InventoryItem>
): InventoryItem {
  return {
    id: existingItem?.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    definition,
    quantity,
    remainingUses: existingItem?.remainingUses,
  };
}

/**
 * 将旧格式的 InventoryItem（无 id）转换为新格式（有 id）
 */
export function migrateInventoryItem(item: Partial<InventoryItem> & { definition: ItemDefinition; quantity: number }): InventoryItem {
  if (item.id) {
    return item as InventoryItem;
  }
  return createInventoryItem(item.definition, item.quantity);
}

// 活跃效果（正在生效的道具效果）
export interface ActiveEffect {
  itemId: string;
  itemName: string;
  type: EffectType;
  value: number;
  remainingCount: number; // 剩余次数
}

// 战斗记录
export interface BattleLog {
  round: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage?: number;
  heal?: number;
  special?: string;
}

// 战斗状态
export interface BattleState {
  enemyName: string;
  enemyMaxHp: number;
  enemyCurrentHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemyLevel: number;
  enemyRealm: string;
  enemyTier?: EnemyTier; // 敌人等级类型
  enemyCombatPower: number; // 敌人战力
  playerMaxHp: number;
  playerCurrentHp: number;
  playerMaxMp: number;
  playerCurrentMp: number;
  playerAttack: number;
  playerDefense: number;
  playerCombatPower: number; // 玩家战力
  logs: BattleLog[];
  currentRound: number;
  isOver: boolean;
  victory?: boolean;
  /** 是否通过逃跑结束战斗 */
  fled?: boolean;
}

/**
 * 交互式战斗状态
 * 用于手动操作战斗流程
 */
export interface ActiveBattleState {
  /** 战斗格子类型 */
  cellType: CellType;
  /** 敌人名称 */
  enemyName: string;
  /** 敌人等级 */
  enemyLevel: number;
  /** 敌人格子位置 */
  cellPosition: { row: number; col: number };
  /** 战斗是否开始 */
  isActive: boolean;
  /** 战斗来源：adventure(历练) 或 tower(爬塔) */
  source?: 'adventure' | 'tower';
  /** 爬塔楼层（仅 source='tower' 时有效） */
  towerFloor?: number;
  /** 爬塔敌人信息（用于战斗结算） */
  towerEnemy?: import('@/modules/tower/logic/types').TowerEnemy;
}

// 主角完整信息
export interface Protagonist {
  character: Character;
  world: World;
  backstory: string;
  level: number;
  realm: string;
  stats: CharacterStats;
  statCapBonuses: Partial<BaseStats>; // 属性上限加成（来自机缘等）
  inventory: InventoryItem[]; // 背包（包含所有物品和资源）
  activeEffects: ActiveEffect[]; // 当前生效的效果
  experience: number;
  overflowExperience: number; // 超出上限的经验（升级后会保留到下一级）
  // HP/MP系统
  currentHp: number; // 当前生命值
  maxHp: number; // 最大生命值
  currentMp: number; // 当前法力值
  maxMp: number; // 最大法力值
  // 功法系统
  techniques: Technique[]; // 已获得的功法
  equippedAttackTechniques: (Technique | null)[]; // 装备的攻击功法（最多3本）
  equippedDefenseTechniques: (Technique | null)[]; // 装备的防御功法（最多3本）
  // 装备系统
  equipments: Equipment[]; // 已获得的装备
  equippedMelee: Equipment | null; // 装备的近战武器
  equippedRanged: Equipment | null; // 装备的远程武器
  equippedHead: Equipment | null; // 装备的头部护甲
  equippedBody: Equipment | null; // 装备的身体护甲
  equippedLegs: Equipment | null; // 装备的腿部护甲
  equippedFeet: Equipment | null; // 装备的脚部护甲
  // 势力系统
  factionId: string | null; // 当前加入的势力ID
  factionJoinTime?: number; // 加入势力的时间戳
  // 扩展系统 - 修炼流派
  cultivationPath?: CultivationPath | null; // 当前修炼流派
  pathExp?: number; // 流派经验
  pathLevel?: number; // 流派等级
  // 修炼系统扩展
  insightMarks?: number; // 顿悟印记数量
  // 扩展系统 - 心境状态
  mentalState?: import('./typesExtension').MentalState; // 心境状态
  // 扩展系统 - 势力进度
  factionProgress?: import('./typesExtension').FactionProgress | null; // 势力声望与任务进度
  currencies?: PlayerCurrencies; // 玩家货币（贡献点等）
  /** 当前体力 */
  stamina?: number;
  /** 最大体力 */
  maxStamina?: number;
  // 飞升系统
  ascensionMark?: import('./typesExtension').AscensionMark; // 飞升印记
  guardianBattle?: import('./typesExtension').GuardianBattleState; // 守卫战斗状态
  worldVisitHistory?: import('./typesExtension').WorldVisitRecord[]; // 世界访问历史
  ascensionHistory?: import('./typesExtension').AscensionRecord[]; // 飞升历史记录
  // 残本/残片系统
  fragmentInventory?: import('@/modules/crafting/logic/fragmentSystem').FragmentInventory; // 残本/残片库存
  // 爬塔系统
  towerProgress?: import('@/modules/tower/logic/types').TowerProgress; // 爬塔进度
  // V3 新格式属性数据
  v3Attributes?: Record<string, number | string>;
  v3CoreStats?: Record<string, number>;
  v3RaceId?: string;
  v3TalentIds?: string[];
}

// 修炼流派类型（与 cultivationPathData.ts 保持一致）
export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 势力进度（扩展）- 重新导出以保持类型一致
export type { FactionProgress, ReputationLevel, TaskProgress } from './typesExtension';

// 玩家货币（扩展）
// 完整货币定义请使用 import { PlayerCurrencies } from './shop/types'
// 此处保留简化版本用于向后兼容
export interface PlayerCurrencies {
  spirit_stone?: number; // 灵石
  contribution: number; // 势力贡献点
  sect_point?: number; // 宗门积分
  honor_point?: number; // 荣誉值
  ascension_mark?: number; // 飞升印记
  event_token?: number; // 活动代币
}

// 功法槽位数量
export const TECHNIQUE_SLOT_COUNT = 3;

// 功法类型
export type TechniqueType = 'attack' | 'defense';

// 功法定义（重构版 - 包含法技系统）
export interface Technique {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  type: TechniqueType;
  rarity: ItemRarity;
  description: string;
  
  // ========== 等级系统（10级制） ==========
  level: number; // 功法等级（1-maxLevel）
  exp: number; // 当前经验值
  expToNext: number; // 升级所需经验
  maxLevel: number; // 最大等级（按稀有度：普通5/稀有7/史诗8/传说9/神话10）
  
  // ========== 基础数值 ==========
  power: number; // 功法威力
  bonus: number; // 加成百分比
  baseMpCost: number; // 基础法力消耗
  
  // ========== 元素属性 ==========
  element: import('@/modules/combat/logic/restraintSystem').Element; // 主元素属性（必有）
  subElement?: import('@/modules/combat/logic/restraintSystem').Element; // 副元素属性（稀有及以上可能拥有）
  
  // ========== 武器契合 ==========
  compatibleWeapon: import('@/modules/combat/logic/restraintSystem').WeaponCategory | null; // 契合武器类型
  compatibleBonus: number; // 契合加成百分比
  
  // ========== 法技系统 ==========
  skillSlots: number; // 已解锁的技能槽位数量
  maxSkillSlots: number; // 最大技能槽位数量
  allSkills: import('@/modules/techniques/logic/skillTypes').TechniqueSkill[]; // 全部可解锁技能
  equippedSkills: (string | null)[]; // 当前装备的技能ID列表（按槽位顺序，null表示空槽）
  
  // ========== 来源信息 ==========
  worldType?: WorldType; // 世界类型（可选）
  source: 'drop' | 'synthesis' | 'quest' | 'initial'; // 来源
  
  // ========== 残本系统 ==========
  isFragment: boolean; // 是否为残本
  fragmentIndex?: number; // 残本序号（1-N）
  fragmentsRequired?: number; // 完本所需残本数量
  relatedFragmentIds?: string[]; // 关联的残本ID列表
  
  // ========== 兼容字段（旧代码过渡用，后续可删除） ==========
  mpCost?: number; // 法力消耗（旧系统）
  proficiency?: number; // 熟练度（旧系统）
  proficiencyLevel?: number; // 熟练度等级（旧系统）
}

// 装备槽位类型
export type EquipmentSlot = 'melee' | 'ranged' | 'head' | 'body' | 'legs' | 'feet';

// 装备槽位名称
export const EquipmentSlotNames: Record<EquipmentSlot, string> = {
  melee: '近战',
  ranged: '远程',
  head: '头部',
  body: '身体',
  legs: '腿部',
  feet: '脚部',
};

// 装备槽位影响属性
export const EquipmentSlotEffect: Record<EquipmentSlot, 'attack' | 'defense'> = {
  melee: 'attack',
  ranged: 'attack',
  head: 'defense',
  body: 'defense',
  legs: 'defense',
  feet: 'defense',
};

// 装备定义（重构版 - 包含斗技系统）
export interface Equipment {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  description: string;
  
  // ========== 等级系统（10级制） ==========
  level: number; // 武器等级（1-maxLevel）
  exp: number; // 当前经验值
  expToNext: number; // 升级所需经验
  maxLevel: number; // 最大等级（按稀有度：普通5/稀有7/史诗8/传说9/神话10）
  
  // ========== 武器类型 ==========
  weaponCategory: import('@/modules/combat/logic/restraintSystem').WeaponCategory | null; // 武器类别（仅武器类装备有）
  
  // ========== 元素契合 ==========
  element: import('@/modules/combat/logic/restraintSystem').Element | null; // 主元素属性
  compatibleElement: import('@/modules/combat/logic/restraintSystem').Element | null; // 契合元素类型
  compatibleBonus: number; // 契合加成百分比
  
  // ========== 基础数值 ==========
  attackBonus: number; // 攻击加成
  defenseBonus: number; // 防御加成
  power: number; // 装备威力值
  
  // ========== 斗技系统 ==========
  techniqueSlots: number; // 已解锁的技巧槽位数量
  maxTechniqueSlots: number; // 最大技巧槽位数量
  allTechniques: import('@/modules/techniques/logic/skillTypes').WeaponTechnique[]; // 全部可解锁技巧
  equippedTechniques: (string | null)[]; // 当前装备的技巧ID列表
  
  // ========== 来源信息 ==========
  worldType?: WorldType; // 世界类型（可选）
  source: 'drop' | 'reforge' | 'quest' | 'initial'; // 来源
  
  // ========== 残片系统 ==========
  isFragment: boolean; // 是否为残片
  fragmentIndex?: number; // 残片序号（1-N）
  fragmentsRequired?: number; // 重铸所需残片数量
  
  // ========== 兼容字段（旧代码过渡用，后续可删除） ==========
  enhancement?: number; // 强化等级（旧系统）
  refinement?: number; // 重铸次数（旧系统）
  affixes?: import('@/modules/equipment/data/equipmentAffixData').EquipmentAffix[]; // 词缀列表（旧系统）
  setId?: string | null; // 套装ID（旧系统）
}

// 装备词缀 - 重新导出以保持类型一致
export type { EquipmentAffix, AffixType, AffixEffect } from '@/modules/equipment/data/equipmentAffixData';

// 升级系统类型
export type UpgradeableItemType = 'technique' | 'equipment';

// 升级材料（可升级物品的统一表示）
export interface UpgradeMaterial {
  id: string;
  name: string;
  type: UpgradeableItemType;
  rarity: ItemRarity;
  level: number;
  exp: number;
  expValue: number; // 作为材料时提供的经验值
}

// 升级配置
export const UPGRADE_CONFIG = {
  maxLevel: 10, // 最高等级
  baseExpRequired: 100, // 1级升2级所需基础经验
  expMultiplier: 1.5, // 每级所需经验倍率
  materialExpBase: 50, // 1级材料提供的基础经验
  materialExpPerLevel: 30, // 每级额外提供的经验
  rarityExpMultiplier: {
    '普通': 1,
    '稀有': 1.5,
    '史诗': 2,
    '传说': 3,
    '神话': 4,
  },
};

// 游戏阶段
export type GamePhase = 'world-select' | 'character-select' | 'backstory' | 'playing';

// 修炼结果
export interface CultivationResult {
  success: boolean;
  message: string;
  statChanges: Partial<GrowthStats>;
  itemsCost?: InventoryItem[]; // 消耗的道具
  canAfford?: boolean; // 是否有足够资源
  breakthroughAttempt?: boolean; // 是否尝试突破
  breakthroughSuccess?: boolean; // 突破是否成功
  cultivationBoost?: number; // 丹药加成百分比
  baseGains?: Partial<GrowthStats>; // 基础数值（不含加成）
  boostGains?: Partial<GrowthStats>; // 丹药加成数值
  experienceGain?: number; // 获得的经验值
  experienceBoost?: number; // 丹药带来的经验值加成
}

/**
 * 属性变化类型 - 支持新旧两种格式
 */
export type StatChanges = Partial<FlatStats>;

// 历练事件选项
export interface EventChoice {
  text: string;
  effects: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[]; // 可能获得道具
    experience?: number;
    special?: string;
  };
  result: string;
  /** 战斗选项：触发战斗 */
  battle?: {
    /** 敌人类型 */
    enemyType: 'enemy' | 'boss';
    /** 敌人等级偏移（相对于玩家等级） */
    levelOffset?: number;
  };
}

// 历练事件
export interface AdventureEvent {
  id: number;
  title: string;
  description: string;
  choices: EventChoice[];
}

// 机缘冒险格子类型
export type CellType = 'empty' | 'treasure' | 'enemy' | 'elite' | 'miniboss' | 'boss' | 'event' | 'rest' | 'portal';

// 机缘冒险格子
export interface AdventureCell {
  type: CellType;
  cleared: boolean;
  content?: string;
  portalTarget?: { row: number; col: number }; // 传送目标位置
  visited?: boolean; // 是否被访问过
}

// 秘境难度配置
export interface DungeonConfig {
  rows: number; // 行数
  cols: number; // 列数
  difficulty: number; // 难度等级（对应境界）
  realmName: string; // 境界名称
  enemyLevelMin: number; // 敌人最小等级
  enemyLevelMax: number; // 敌人最大等级
  rewardMultiplier: number; // 奖励倍率
  portalCount: number; // 传送门数量
  difficultyLevel?: 'easy' | 'normal' | 'hard' | 'nightmare'; // 难度级别
  requiredPower?: number; // 一键扫荡所需战力（保留用于判断是否可扫荡）
  staminaCost?: number; // 扫荡消耗体力
  isNovice?: boolean; // 是否为新手引导难度
  isUnlocked?: boolean; // 是否已解锁（机缘等级 <= 玩家等级）
}

// 机缘战斗结果
export interface BattleResult {
  victory: boolean;
  /** 是否通过逃跑结束（仅当 victory=false 时有效） */
  fled?: boolean;
  message: string;
  battleState?: BattleState; // 战斗过程
  rewards?: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[]; // 可能获得道具
    experience?: number;
    technique?: Technique; // 可能获得功法
    equipment?: Equipment; // 可能获得装备
    fragments?: FragmentDropData[]; // 碎片奖励
    techniques?: Technique[]; // 完整功法掉落（多个，新增）
    equipments?: Equipment[]; // 完整装备掉落（多个，新增）
    completeItems?: FragmentDropResult['completeItems']; // 完整物品掉落（功法/装备，新增）
  };
  hpRestored?: number; // 休息格恢复的HP
  mpRestored?: number; // 休息格恢复的MP
  playerHpAfter?: number; // 战斗后的HP
  playerMpAfter?: number; // 战斗后的MP
  fragmentDrop?: FragmentDropResult; // 碎片掉落详情
}

// 消息记录
export interface MessageRecord {
  id: string;
  timestamp: number;
  type: 'success' | 'failure' | 'info' | 'warning';
  title: string;
  content: string;
  /** 消息通道（如 combat、cultivation、system），用于按业务域分类显示 */
  channel?: string;
  details?: string;
  rewards?: {
    stats?: Partial<GrowthStats>;
    statDetails?: { stat: string; base: number; boost: number }[]; // 详细属性变化：基础+加成
    items?: InventoryItem[];
    experience?: number;
    experienceBoost?: number; // 丹药带来的经验值加成
    technique?: Technique;
    equipment?: Equipment;
    techniques?: Technique[]; // 完整功法掉落（多个，新增）
    equipments?: Equipment[]; // 完整装备掉落（多个，新增）
    fragments?: FragmentDropData[]; // 碎片掉落奖励
  };
}

// 通用行动结果
export interface ActionResult {
  success?: boolean;
  victory?: boolean;
  message: string;
  statChanges?: Partial<GrowthStats>;
  itemsCost?: InventoryItem[];
  rewards?: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[];
    experience?: number;
  };
  battleState?: BattleState; // 战斗过程
  breakthroughAttempt?: boolean; // 是否尝试突破
  breakthroughSuccess?: boolean; // 突破是否成功
}

// 当前操作Tab
export type ActionTab = 'cultivation' | 'experience' | 'adventure' | 'shop' | 'technique' | 'equipment' | 'skill' | 'alchemy' | 'forge' | 'fragment' | 'tower' | 'achievement' | 'collection' | 'statistics';

// 机缘难度选择阶段
export type AdventurePhase = 'select' | 'playing';

// 游戏状态
// 炼丹状态
export interface CraftingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '极品' | '上品' | '中品' | '下品';
  success: boolean;
}

// 炼器状态
export interface ForgingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '完美' | '优秀' | '精良' | '普通';
  success: boolean;
}

// ============================================
// 机缘行动力系统
// ============================================

/** 机缘会话行动力状态 */
export interface AdventureSessionState {
  /** 是否在机缘中 */
  isActive: boolean;
  /** 当前行动力 */
  currentStamina: number;
  /** 最大行动力 */
  maxStamina: number;
  /** 进入时间戳 */
  enterTime: number;
  /** 上次退出机缘时间戳（用于冷却） */
  lastExitTime: number;
  /** 已击败的敌人数量 */
  enemiesDefeated: number;
  /** 是否已击败Boss */
  bossDefeated: boolean;
}

export interface GameState {
  phase: GamePhase;
  characters: Character[];
  worlds: World[];
  selectedCharacter: Character | null;
  selectedWorld: World | null;
  protagonist: Protagonist | null;
  currentEvent: AdventureEvent | null;
  lastActionResult: ActionResult | null;
  adventureGrid: AdventureCell[][] | null;
  adventurePosition: { row: number; col: number } | null;
  adventureConfig: DungeonConfig | null; // 秘境配置
  adventurePhase: AdventurePhase; // 机缘阶段
  adventureLoot: InventoryItem[]; // 机缘战利品（物品）
  adventureExperience: number; // 机缘战利品（待结算经验值）
  adventureFragments?: FragmentDropData[]; // 机缘战利品（碎片）
  /** 机缘会话状态（行动力、击败数等） */
  adventureSession?: AdventureSessionState | null;
  currentTab: ActionTab;
  battleState: BattleState | null; // 当前战斗状态（用于显示战斗结果）
  /** 交互式战斗状态（用于手动操作战斗） */
  activeBattle: ActiveBattleState | null;
  messages: MessageRecord[]; // 消息记录（内存中只保留最新100条）
  totalMessageCount: number; // 消息总数量
  autoCultivating: boolean; // 自动修炼状态
  autoBattle: boolean; // 自动战斗状态（默认false，需要手动操作）
  crafting: CraftingState | null; // 炼丹状态
  forging: ForgingState | null; // 炼器状态
  // 统计数据（用于成就和图鉴）
  statistics: GameStatistics;
  // 已解锁的成就ID列表
  unlockedAchievementIds: string[];
  // 已领取奖励的成就ID列表
  claimedAchievementIds: string[];
  // 已完成的新手任务ID列表（持久化，防止进度后退）
  completedTutorialTaskIds: string[];
  // 是否已完成新手机缘（用于显示新手难度选项）
  hasCompletedNoviceAdventure?: boolean;
  // 是否显示新手引导完成弹窗（显示后清除）
  showNoviceCompletionDialog?: boolean;
  // 是否显示新手任务全部完成弹窗（显示后清除）
  showTutorialCompletionDialog?: boolean;
  // 任务系统状态 - 统一管理各任务系统
  taskSystems?: import('@/modules/faction/logic/types').AllTaskSystemsState;
  // 扩展系统 - 势力相关
  currentFactionId?: string | null; // 当前加入的势力ID
  factionProgress?: import('./typesExtension').FactionProgress | null; // 势力进度
  /** 统一时间系统状态 — 由 core/time/ 管理 */
  time: import('@/core/time').TimeState;
  // 事件历史记录（用于事件因果链）
  eventHistory?: import('../events/types').EventRecord[];
  // 世界状态标记（用于持久后果）
  worldFlags?: Record<string, unknown>;
  // 开发者调试状态
  devMode?: {
    invincible: boolean; // 战斗无敌模式
  };
  // 飞升流程状态
  ascensionFlow?: import('./typesExtension').AscensionFlowState;
  // 死亡状态（显示死亡弹窗）
  deathState?: import('./typesExtension').DeathState;
  // 任务系统状态
  questState: QuestState;
}

// 消息存储配置
export const MESSAGE_CONFIG = {
  memoryLimit: 100, // 内存中保留的消息数量
  chunkSize: 100, // 每个分片的大小
  storageKeyPrefix: 'wanjie_messages_chunk_', // localStorage 分片键名前缀
  STORAGE_KEY: 'wanjie_messages_chunks', // 旧版 localStorage 键名（兼容）
  defaultGameId: 'default', // 默认游戏ID
};

// ============================================
// 成就系统
// ============================================

// 成就类型
export type AchievementType = 'level' | 'combat' | 'collection' | 'exploration' | 'cultivation' | 'special';

// 成就状态
export interface AchievementStatus {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 当前进度
  target: number; // 目标进度
}

// 成就定义
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string; // 图标名称
  target: number; // 目标数值
  rewards: {
    items?: InventoryItem[];
    stats?: Partial<GrowthStats>;
    experience?: number;
  };
  hidden?: boolean; // 是否隐藏（未解锁前不显示详情）
  rarity?: ItemRarity; // 成就稀有度
}

// ============================================
// 图鉴系统
// ============================================

// 羁绊类型
export type BondType = 'element' | 'weapon' | 'rarity';

// 羁绊等级
export interface BondLevel {
  level: number;
  required: number; // 所需收集数量
  multiplier: number; // 倍率加成
}

// 羁绊奖励
export interface BondReward {
  level: number;
  stats: Record<string, number>; // 属性加成
}

// 羁绊定义
export interface BondDefinition {
  id: string;
  name: string;
  type: BondType;
  description: string;
  keywords: string[]; // 匹配关键词
  rewards: BondReward[];
}

// 图鉴收集状态
export interface CollectionStatus {
  techniqueIds: string[]; // 已获得的功法ID列表
  equipmentIds: string[]; // 已获得的装备ID列表
  techniqueNames: string[]; // 已获得的功法名称列表（用于羁绊匹配）
  equipmentNames: string[]; // 已获得的装备名称列表（用于羁绊匹配）
}

// 图鉴条目
export interface CollectionEntry {
  id: string;
  name: string;
  type: 'technique' | 'equipment';
  rarity: ItemRarity;
  collected: boolean;
  collectedAt?: number;
}

// ============================================
// 游戏统计数据（用于成就和图鉴）
// ============================================

export interface GameStatistics {
  // 等级相关
  maxLevel: number; // 最高等级
  
  // 战斗相关
  totalEnemiesKilled: number; // 总击败敌人数
  totalBossKilled: number; // 总击败Boss数
  totalEliteKilled: number; // 总击败精英数
  
  // 收集相关
  totalTechniquesCollected: number; // 总获得的功法数（去重）
  totalEquipmentsCollected: number; // 总获得的装备数（去重）
  
  // 探索相关
  totalAdventuresCompleted: number; // 总完成的秘境探索次数
  clearedDifficulties: number[]; // 已通关的机缘难度等级列表
  
  // 修炼相关
  totalCultivations: number; // 总修炼次数
  totalBreakthroughs: number; // 总突破次数
  
  // 特殊成就追踪
  legendaryItemsObtained: number; // 获得的传说品质物品数
  hasFullEquipment: boolean; // 是否所有装备槽位都已装备
  maxLevelTechniques: number; // 满级功法数量
  maxLevelEquipments: number; // 满级装备数量
  
  // 历史收集（用于去重判断）
  collectedTechniqueNames: string[]; // 已收集过的功法名称（数组格式，便于序列化）
  collectedEquipmentNames: string[]; // 已收集过的装备名称（数组格式，便于序列化）
  
  // ========== 扩展系统统计 ==========
  
  // 流派相关
  pathSelected: boolean; // 是否选择了流派
  pathLevel: number; // 流派等级
  
  // 功法熟练度
  techniqueProficiencyXiaocheng: number; // 达到小成境界的功法数量
  techniqueProficiencyDacheng: number; // 达到大成境界的功法数量
  techniqueProficiencyHuajing: number; // 达到化境界的功法数量
  
  // 羁绊相关
  bondsActivated: number; // 激活的羁绊数量
  bondLevel3Activated: boolean; // 是否激活了3级羁绊
  
  // 装备强化
  maxEnhancementLevel: number; // 最高强化等级
  
  // 势力声望
  factionJoined: boolean; // 是否加入了势力
  reputationFriendly: boolean; // 是否达到友善声望
  reputationHonored: boolean; // 是否达到尊敬声望
  reputationExalted: boolean; // 是否达到崇敬声望
  
  // 成就系统
  achievementRewardsClaimed: number; // 已领取的成就奖励数量
  
  // 物品使用
  totalItemsUsed: number; // 总使用物品次数
  
  // ========== 新增：势力任务相关统计 ==========
  
  // 资源相关
  totalSpiritStonesGained: number;    // 获得灵石总数
  totalSpiritStonesSpent: number;      // 消耗灵石总数
  
  // 材料相关
  totalMaterialsCollected: number;     // 获得材料总数
  totalFragmentsCollected: number;     // 获得碎片总数
  
  // 合成相关
  totalEquipmentsCrafted: number;      // 合成装备数量
  totalTechniquesSynthesized: number;  // 合成功法数量
  
  // 贡献相关
  totalContribution: number;           // 累计贡献值
  totalDonations: number;              // 捐献次数
  totalSpiritStonesDonated: number;    // 捐献灵石总数
  
  // 碎片合成相关
  totalFragmentsSynthesized: number;   // 碎片合成次数
}

// 默认统计数据
export const DEFAULT_STATISTICS: GameStatistics = {
  maxLevel: 1,
  totalEnemiesKilled: 0,
  totalBossKilled: 0,
  totalEliteKilled: 0,
  totalTechniquesCollected: 0,
  totalEquipmentsCollected: 0,
  totalAdventuresCompleted: 0,
  clearedDifficulties: [], // 已通关的机缘难度等级列表
  totalCultivations: 0,
  totalBreakthroughs: 0,
  legendaryItemsObtained: 0,
  hasFullEquipment: false,
  maxLevelTechniques: 0,
  maxLevelEquipments: 0,
  collectedTechniqueNames: [],
  collectedEquipmentNames: [],
  // 扩展系统默认值
  pathSelected: false,
  pathLevel: 0,
  techniqueProficiencyXiaocheng: 0,
  techniqueProficiencyDacheng: 0,
  techniqueProficiencyHuajing: 0,
  bondsActivated: 0,
  bondLevel3Activated: false,
  maxEnhancementLevel: 0,
  factionJoined: false,
  reputationFriendly: false,
  reputationHonored: false,
  reputationExalted: false,
  achievementRewardsClaimed: 0,
  totalItemsUsed: 0,
  // 新增：势力任务相关统计默认值
  totalSpiritStonesGained: 0,
  totalSpiritStonesSpent: 0,
  totalMaterialsCollected: 0,
  totalFragmentsCollected: 0,
  totalEquipmentsCrafted: 0,
  totalTechniquesSynthesized: 0,
  totalContribution: 0,
  totalDonations: 0,
  totalSpiritStonesDonated: 0,
  totalFragmentsSynthesized: 0,
}
