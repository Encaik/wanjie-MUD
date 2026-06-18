/**
 * 心魔突破系统核心类型定义
 *
 * 定义了心魔动态生成、三阶段突破流程、心魔图鉴等核心类型。
 * 第一阶段 MVP 仅包含核心逻辑所需类型，后续阶段扩展视觉和交互相关类型。
 *
 * @module modules/progression/logic/demonBreakthrough
 */

import type { GrowthStats } from '@/core/types';

// ============================================
// 心魔类型枚举
// ============================================

/** 基础心魔类型 */
export type DemonType = 'greed' | 'fear' | 'arrogance' | 'regret' | 'doubt';

/** 心魔类型中文名称映射 */
export const DEMON_TYPE_NAMES: Record<DemonType, string> = {
  greed: '贪念',
  fear: '恐惧',
  arrogance: '傲慢',
  regret: '悔恨',
  doubt: '疑惑',
};

// ============================================
// 心魔动态生成
// ============================================

/** 心魔攻击偏向 */
export type DemonAttackBias = 'physical' | 'special' | 'balanced' | 'will';

/** 心魔视觉预设（MVP阶段为文本描述，后续替换为视觉资源key） */
export interface DemonVisualPreset {
  /** 视觉主题 key */
  theme: string;
  /** 心魔形态描述 */
  formDescription: string;
  /** 背景氛围描述 */
  atmosphereDescription: string;
}

/** 动态生成的心魔 */
export interface GeneratedDemon {
  /** 心魔唯一标识（gen时生成） */
  id: string;
  /** 心魔类型 */
  type: DemonType;
  /** 心魔名称（如 "贪婪之煞"、"恐惧梦魇"） */
  name: string;
  /** 所属世界观标识 */
  worldType: string;
  /** 视觉预设 */
  visualPreset: DemonVisualPreset;
  /** 心魔战斗属性 */
  stats: DemonBattleStats;
  /** 阶段二的诱惑/考验文本 */
  temptation: string;
  /** 弱点类型（决定哪种攻击方式最有效） */
  weakPointType: DemonAttackBias;
  /** 心魔来源因素（用于日志/调试） */
  sourceFactors: DemonSourceFactors;
}

/** 心魔战斗属性 */
export interface DemonBattleStats {
  /** 对心境护盾的物理冲击 */
  physicalAttack: number;
  /** 对心境护盾的法术/精神冲击 */
  specialAttack: number;
  /** 对意志力的直接侵蚀 */
  willErosion: number;
}

/** 心魔生成的来源因素（记录为什么生成这个心魔） */
export interface DemonSourceFactors {
  /** 基础生成seed */
  seed: number;
  /** 玩家等级加权 */
  levelWeight: number;
  /** 世界观难度系数 */
  worldDifficulty: number;
  /** 业力值影响 */
  karmaModifier: number;
  /** 流派影响 */
  pathModifier: number;
}

// ============================================
// 阶段一：属性检定
// ============================================

/** 单项检定结果 */
export interface SingleAttributeCheck {
  /** 检定类型 */
  type: 'physical' | 'special' | 'will';
  /** 玩家防御值 */
  playerValue: number;
  /** 心魔攻击值 */
  demonValue: number;
  /** 造成的伤害 */
  damage: number;
  /** 是否通过（damage == 0 为通过） */
  passed: boolean;
}

/** 阶段一属性检定整体结果 */
export interface AttributeCheckResult {
  /** 三项检定明细 */
  checks: {
    physical: SingleAttributeCheck;
    special: SingleAttributeCheck;
    will: SingleAttributeCheck;
  };
  /** 心境总伤害（限制上限） */
  totalMindDamage: number;
  /** 提供的检定加成来源 */
  bonuses: string[];
}

// ============================================
// 阶段二：策略选择
// ============================================

/** 策略选择关联的属性类型 */
export type StrategyStatType = 'willpower' | 'intelligence' | 'physicalATK' | 'specialATK';

/** 阶段二的策略选项 */
export interface StrategyChoice {
  /** 选项索引 */
  index: number;
  /** 选项文本 */
  text: string;
  /** 对应的检定属性类型 */
  statType: StrategyStatType;
  /** 基础成功率 (0-1) */
  baseRate: number;
  /** 计算后的实际成功率 (0-1) */
  actualRate: number;
  /** 检定属性值 */
  statValue: number;
  /** 属性权重 */
  statWeight: number;
  /** 成功效果 */
  successEffect: StrategyEffect;
  /** 失败效果 */
  failEffect: StrategyEffect;
  /** 是否为魔修专属选项 */
  demonExclusive: boolean;
}

/** 策略选择的效果 */
export interface StrategyEffect {
  /** 心境稳定度变化 */
  stabilityChange: number;
  /** 属性变化（突破成功后应用） */
  statBonus: Partial<GrowthStats>;
  /** 心魔概率变化 */
  demonChanceChange: number;
  /** 心魔是否被削弱（失败时仍可削弱） */
  demonWeakened: boolean;
  /** 效果描述文本 */
  description: string;
}

/** 阶段二策略选择结果 */
export interface StrategyChoiceResult {
  /** 选择的选项索引 */
  choiceIndex: number;
  /** 是否为魔修吸收选项 */
  isDemonAbsorb: boolean;
  /** 是否成功 */
  success: boolean;
  /** 结果消息 */
  message: string;
  /** 属性变化 */
  statChanges: Partial<GrowthStats>;
  /** 心境稳定度变化 */
  stabilityChange: number;
  /** 心魔概率变化 */
  demonChanceChange: number;
}

// ============================================
// 阶段三：心魔炼化
// ============================================

/** 弱点类型（点击交互中的弱点球颜色） */
export type WeaknessType = 'physical' | 'special' | 'critical' | 'recovery' | 'trap';

/** 弱点命中记录 */
export interface WeaknessHit {
  /** 弱点类型 */
  type: WeaknessType;
  /** 造成的炼化伤害 */
  damage: number;
  /** 是否为暴击 */
  critical: boolean;
}

/** 阶段三炼化战斗参数 */
export interface RefineBattleParams {
  /** 物理攻击力 */
  physicalATK: number;
  /** 特殊攻击力 */
  specialATK: number;
  /** 速度（影响弱点刷新频率） */
  speed: number;
  /** 感知（影响弱点发现率） */
  perception: number;
  /** 心境护盾初始值 */
  mindShield: number;
  /** 持续时长（秒） */
  duration: number;
  /** 弱点最大同时出现数 */
  maxWeaknesses: number;
  /** 已携带道具ID列表 */
  items: string[];
  /** 流派终结技是否可用 */
  finalSkillAvailable: boolean;
  /** 流派类型 */
  pathType: string | null;
}

/** 阶段三炼化战斗结果 */
export interface RefineBattleResult {
  /** 炼化进度 (0-100) */
  progress: number;
  /** 剩余心境护盾 */
  mindShield: number;
  /** 命中弱点记录 */
  hits: WeaknessHit[];
  /** 击中弱点总数 */
  weaknessesHit: number;
  /** 错过弱点总数 */
  weaknessesMissed: number;
  /** 是否触发完美炼化 */
  perfectTriggered: boolean;
  /** 使用的道具ID列表 */
  itemsUsed: string[];
  /** 是否使用了流派终结技 */
  finalSkillUsed: boolean;
  /** 战斗结果文本（用于UI展示） */
  battleLog: string[];
}

// ============================================
// 心魔图鉴
// ============================================

/** 心魔图鉴条目 */
export interface DemonMemory {
  /** 心魔类型 */
  demonType: DemonType;
  /** 心魔名称（记录首次遭遇时的名称） */
  name: string;
  /** 遭遇总次数 */
  encounters: number;
  /** 战胜次数 */
  victories: number;
  /** 上次遭遇时间戳 */
  lastEncountered: number;
  /** 上次遭遇的世界观 */
  lastWorldType: string;
  /** 是否已成为宿敌心魔（连败3次+） */
  isArchNemesis: boolean;
  /** 连败计数 */
  consecutiveLosses: number;
}

// ============================================
// 世界观心魔配置
// ============================================

/** 世界观心魔配置 */
export interface WorldDemonConfig {
  /** 世界观标识 */
  worldType: string;
  /** 心魔主题（如修仙→"七情六欲"、科技→"系统故障"） */
  demonTheme: string;
  /** 视觉主题 key */
  visualTheme: string;
  /** 攻击属性偏向 */
  attackProfile: {
    /** 偏向类型 */
    bias: DemonAttackBias;
    /** 物理攻击倍率 */
    physicalMultiplier: number;
    /** 特殊攻击倍率 */
    specialMultiplier: number;
    /** 意志侵蚀倍率 */
    willErosionMultiplier: number;
  };
  /** 诱惑文本模板池 */
  temptationTemplates: Record<DemonType, string[]>;
  /** 心魔名称后缀（世界观特色，如修仙→"之煞"、科技→"故障"） */
  nameSuffixes: Record<DemonType, string>;
}

// ============================================
// 整体突破结果
// ============================================

/** 心魔突破流程的整体结果 */
export interface BreakthroughResult {
  /** 突破是否成功（提升等级） */
  success: boolean;
  /** 实际提升的等级数（0或1） */
  levelUp: boolean;
  /** 获得的属性增长 */
  statGains: Partial<GrowthStats>;
  /** 心魔是否被击败（即使突破失败也可能削弱心魔） */
  demonDefeated: boolean;
  /** 心境护盾变化 */
  mindShieldChange: number;
  /** 心境稳定度变化 */
  stabilityChange: number;
  /** 更新的心魔图鉴条目 */
  demonMemory: DemonMemory;
  /** 流程中所有消息（用于UI展示和消息记录） */
  messages: string[];
  /** 各阶段详细结果 */
  phaseResults: {
    phase1: AttributeCheckResult;
    phase2: StrategyChoiceResult;
    phase3: RefineBattleResult;
  };
}

// ============================================
// 锻造心魔引擎参数
// ============================================

/** forgeDemon() 的输入参数 */
export interface DemonForgeParams {
  /** 世界观类型标识 */
  worldType: string;
  /** 玩家等级 */
  playerLevel: number;
  /** 玩家CoreStats快照 */
  playerCoreStats: PlayerCoreStatsSnapshot;
  /** 业力值（-1000 到 1000） */
  karma: number;
  /** 修炼流派 */
  cultivationPath: string | null;
  /** 生成seed（确保可复现） */
  seed: number;
  /** 心魔图鉴（用于宿敌/抗性计算） */
  demonCodex: DemonMemory[];
}

/** 玩家CoreStats快照（用于心魔/突破计算） */
export interface PlayerCoreStatsSnapshot {
  maxHp: number;
  physicalATK: number;
  specialATK: number;
  physicalDEF: number;
  specialDEF: number;
  speed: number;
  intelligence: number;
  willpower: number;
  lifespan: number;
  perception: number;
  specialResourceCap: number;
}

/**
 * 从角色最终属性计算 CoreStats 快照
 *
 * 将5维基础属性映射为11维 CoreStats，用于心魔突破系统的各项计算。
 * 映射权重设计参考 V3 coreStatFormulas.ts 中的公式体系。
 *
 * @param flatStats - getFinalStats() 返回的最终角色属性
 * @returns 11维 CoreStats 快照
 */
export function computeCoreStats(flatStats: {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}): PlayerCoreStatsSnapshot {
  return {
    maxHp: 100 + flatStats.体质 * 10,
    physicalATK: Math.floor(flatStats.体质 * 1.5),
    specialATK: Math.floor(flatStats.灵根 * 2.0),
    physicalDEF: flatStats.体质,
    specialDEF: flatStats.灵根,
    speed: Math.floor(flatStats.体质 * 0.3 + flatStats.灵根 * 0.3),
    intelligence: flatStats.悟性,
    willpower: flatStats.意志,
    lifespan: 100 + flatStats.体质 * 2,
    perception: Math.floor(flatStats.幸运 * 0.5 + flatStats.悟性 * 0.5),
    specialResourceCap: 50 + flatStats.灵根 * 5,
  };
}
