/**
 * 世界观注册中心（WorldViewRegistry）
 *
 * 单例注册中心，管理所有 WorldviewDefinition 的注册与查询。
 * 替代旧的 WorldViewRegistry，作为世界观数据的唯一来源。
 *
 * 设计原则：
 * - 单例模式：全局唯一实例
 * - 只管理 WorldviewDefinition：不再存储零散 pools
 * - 类型安全：所有 API 使用精确的 TypeScript 类型
 *
 * @module core/registry
 */

import { createLogger } from '@/core/logger';
import type { ImpactLevel, StatName, ExtensibleWorldType } from '@/core/types';

/** WorldViewRegistry 日志记录器 */
const log = createLogger('WorldViewRegistry');

// ============================================
// 注册中心数据类型定义
// ============================================

/** 世界视觉配置（图标、强调色、渐变等，由 Mod 数据提供，消除硬编码） */
export interface WorldVisualConfig {
  /** 图标（emoji 字符，如 "☯"、"⚔"） */
  icon: string;
  /** 强调文字颜色（Tailwind CSS class，如 "text-amber-400"） */
  accentColor: string;
  /** 卡片渐变背景（Tailwind CSS class，如 "from-amber-500/20 to-yellow-600/10"） */
  gradientClass: string;
  /** 边框颜色（Tailwind CSS class，如 "border-amber-500/30"） */
  borderColor: string;
  /** 卡片完整背景（Tailwind CSS class，含 dark 模式） */
  bgGradient: string;
  /** 覆盖层渐变色（用于 WorldReveal 揭示动画，如 "from-purple-500 to-blue-500"） */
  colorGradient: string;
}

/** 默认视觉配置（用于未知世界观类型的 fallback） */
export const DEFAULT_VISUAL_CONFIG: WorldVisualConfig = {
  icon: '🌐',
  accentColor: 'text-slate-400',
  gradientClass: 'from-slate-500/20 to-slate-600/10',
  borderColor: 'border-slate-500/30',
  bgGradient: 'bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30',
  colorGradient: 'from-slate-500 to-gray-500',
};

/** 世界数值配置（全由注册数据提供，消费代码无硬编码兜底） */
export interface WorldStatsData {
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
  enemyAttackBonus: number;
  enemyDefenseBonus: number;
  statDisplayNames: Record<string, string>;
}

// ============================================
// 世界观文本类型定义
// ============================================

/** 术语文案 */
export interface WorldTerminology {
  resource: string;
  power: string;
  energy: string;
  practice: string;
  core: string;
  breakthrough: string;
  enemy: string;
  dungeon: string;
  pill: string;
  treasure: string;
  dungeonDesc: string;
  dungeonLocation: string;
  breakthroughPill: string;
  cultivationPill: string;
}

/** 属性名称 */
export interface WorldStatNames {
  body: string;
  talent: string;
  wisdom: string;
  luck: string;
  will: string;
}

/** 战斗文案模板 */
export interface WorldCombatTexts {
  victory: string;
  defeat: string;
  damageDeal: string;
  damageReceive: string;
  damageCrit: string;
  dodge: string;
  round: string;
  start: string;
  end: string;
}

/** 修炼文案模板 */
export interface WorldCultivationTexts {
  success: string;
  failure: string;
  breakthrough: string;
  breakthroughFail: string;
  overflowWarning: string;
  cost: string;
}

/** 资源文案模板 */
export interface WorldResourceTexts {
  gain: string;
  spend: string;
  insufficient: string;
}

/** 物品文案模板 */
export interface WorldItemTexts {
  use: string;
  obtain: string;
  sell: string;
}

/** 秘境文案模板 */
export interface WorldDungeonTexts {
  enter: string;
  exit: string;
  clear: string;
  sweep: string;
  staminaCost: string;
  powerRequire: string;
}

/** UI 文案模板 */
export interface WorldUITexts {
  level: string;
  realm: string;
  combatPower: string;
  exp: string;
  hp: string;
  mp: string;
  stamina: string;
}

/** 突破文案模板 */
export interface WorldBreakthroughTexts {
  success: string;
  fail: string;
  rate: string;
  pillBonus: string;
}

/** 消息文案模板 */
export interface WorldMessageTexts {
  offlineTitle: string;
  offlineContent: string;
}

/** 流派类型标识 */
export type PathTypeId = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

/** 属性键名 */
export type StatKey = 'body' | 'talent' | 'wisdom' | 'luck' | 'will';

/** 单个流派文案定义 */
export interface PathTextDefinition {
  id: PathTypeId;
  name: string;
  description: string;
  primaryStatKey: StatKey;
  secondaryStatKey: StatKey;
  ultimateAbility: {
    name: string;
    description: string;
    effect: string;
  };
}

/** 流派文案集合 */
export interface WorldPathTexts {
  body: PathTextDefinition;
  sword: PathTextDefinition;
  spell: PathTextDefinition;
  alchemy: PathTextDefinition;
  demon: PathTextDefinition;
}

/** 世界观文案完整定义 */
export interface WorldTextDefinition {
  name: string;
  description: string;
  terminology: WorldTerminology;
  stats: WorldStatNames;
  combat: WorldCombatTexts;
  cultivation: WorldCultivationTexts;
  resource: WorldResourceTexts;
  item: WorldItemTexts;
  dungeon: WorldDungeonTexts;
  ui: WorldUITexts;
  breakthrough: WorldBreakthroughTexts;
  message: WorldMessageTexts;
  paths: WorldPathTexts;
}

// ============================================
// 世界观定义（WorldviewDefinition）
// ============================================

/** 世界影响描述数据 */
export interface WorldImpactData {
  description: string;
  impact: Partial<Record<StatName, number>>;
  impactDescription: string;
}

/** 触发条件 */
export interface TriggerConditionData {
  type: 'on_enter' | 'on_battle_start' | 'on_battle_end' | 'on_turn' | 'on_explore' | 'random';
  chance: number;
}

/** 危险效果 */
export interface DangerEffectData {
  statModifications?: Partial<Record<StatName, number>>;
  resourceModifications?: { hp?: number; mp?: number; spiritStones?: number };
  enemyBuffs?: { attackBonus?: number; defenseBonus?: number; hpBonus?: number };
  specialEffects?: {
    type: 'no_heal' | 'no_escape' | 'double_damage_chance' | 'curse' | 'reduced_exp';
    value?: number;
  };
}

/** 机缘效果 */
export interface OpportunityEffectData {
  statModifications?: Partial<Record<StatName, number>>;
  resourceGains?: { hp?: number; mp?: number; spiritStones?: number; exp?: number };
  specialEffects?: {
    type: 'double_exp' | 'double_drop' | 'free_retreat' | 'extra_loot' | 'reduced_damage';
    value?: number;
  };
  dropBonus?: { rarityBoost: number; extraDropChance: number };
}

/** 危险效果定义 */
export interface DangerData {
  id: string;
  type: 'stat_debuff' | 'resource_drain' | 'enemy_buff' | 'special_mechanic' | 'random_event';
  name: string;
  description: string;
  triggerCondition: TriggerConditionData;
  effect: DangerEffectData;
  duration: number;
  dispellable: boolean;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  worldTypes?: string[];
}

/** 机缘效果定义 */
export interface OpportunityData {
  id: string;
  type: 'stat_buff' | 'resource_gain' | 'special_ability' | 'rare_drop' | 'favorable_event';
  name: string;
  description: string;
  triggerCondition: TriggerConditionData;
  effect: OpportunityEffectData;
  duration: number;
  opportunityLevel: 1 | 2 | 3 | 4 | 5;
  conflictsWith?: string[];
  worldTypes?: string[];
}

/** 词条定义 */
export interface TraitDefinitionData {
  name: string;
  description: string;
  level: ImpactLevel;
  positiveAttrs: string[];
  negativeAttrs: string[];
}

/** 词条池 */
export interface TraitPoolData {
  origin: Record<ImpactLevel, TraitDefinitionData[]>;
  trait: Record<ImpactLevel, TraitDefinitionData[]>;
  personality: Record<ImpactLevel, TraitDefinitionData[]>;
  talent: Record<ImpactLevel, TraitDefinitionData[]>;
}

/** 势力模板 */
export interface FactionTemplateData {
  id: string;
  name: string;
  type: string;
  description: string;
  worldTypeId: string;
}

/** 姓名池 */
export interface NamePoolData {
  surnames: string[];
  maleNames: string[];
  femaleNames: string[];
}

/** 境界层级 */
export interface RealmTierData {
  name: string;
  subRealms: string[];
  levelRange: [number, number];
}

/** 境界体系 */
export interface RealmSystemData {
  mainRealmName: string;
  subRealmName: string;
  tiers: RealmTierData[];
  subRealmMultiplier?: number;
  tierJumpMultiplier?: number;
}

/** 世界观文案（任意嵌套对象，路径访问） */
export type WorldTextData = Record<string, unknown>;

/** 奖励系数 */
export interface RewardCoefficientData {
  expCoefficient: number;
  spiritStoneCoefficient: number;
  dropCoefficient: number;
  rarityBonus: {
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  specialRewards: {
    ascensionMarkBonus: number;
    titleChance: number;
    specialItemChance: number;
  };
}

/**
 * 世界观完整定义
 *
 * 世界观（Worldview）是生成世界实例的模板/配方，包含该世界类型的所有静态配置：
 * 数值参数、生成池（名称、描述、势力、危险、机遇）、境界系统、世界观文本、
 * 机制配置、视觉配置等。一个世界观通过 Mod JSON 文件加载到注册中心。
 *
 * 与 World（世界实例）的关系：
 * - WorldviewDefinition = 模板/配方（包含池和参数）
 * - World = 从模板生成的具象实例（包含从池中选取的确定值）
 */
export interface WorldviewDefinition {
  /** 世界观唯一标识（English kebab-case，如 "cultivation"、"martial"） */
  id: string;
  /** 世界观显示名称（中文，如 "修仙世界"、"高武世界"） */
  name: string;
  /** 世界观描述 */
  description: string;
  /** 世界观版本号（semver 格式） */
  version: string;
  /** 基础难度系数（0.8-2.0） */
  baseCoefficient: number;
  /** 奖励系数配置 */
  rewardCoefficient: RewardCoefficientData;
  /** 完整数值配置（baseHp、hpPerLevel 等） */
  stats: WorldStatsData;
  /** 境界体系定义 */
  realmSystem: RealmSystemData;
  /** 世界名称前缀池 */
  namePrefixes: string[];
  /** 世界名称后缀池 */
  nameSuffixes: string[];
  /** 世界描述文本池 */
  descriptions: string[];
  /** 力量体系描述池 */
  powerSystems: string[];
  /** 主要势力描述池 */
  majorForces: string[];
  /** 危险事件池 */
  dangers: DangerData[];
  /** 机遇事件池 */
  opportunities: OpportunityData[];
  /** 门派模板列表 */
  factions: FactionTemplateData[];
  /** 特性池（起源、天赋、性格、才能） */
  traits: TraitPoolData;
  /** 角色名称池（姓氏、男名、女名） */
  namePool: NamePoolData;
  /** 世界观文本（术语、UI文案、战斗/修炼文本等） */
  texts: WorldTextDefinition;
  /** 机制配置（修炼参数、战斗参数、探索参数、独特机制） */
  mechanics: Record<string, unknown>;
  /** UI 视觉配置（图标、配色、渐变） */
  visualConfig: WorldVisualConfig;
  /** 主题 CSS 变量配置（亮色 + 暗色），未配置时前端使用默认主题 */
  themeConfig?: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  /** 是否为核心内置世界观（wanji-core 提供则为 true） */
  builtin: boolean;
  /** 作者名（Mod 提供） */
  author?: string;
  /** 标签列表 */
  tags?: string[];
}

// ============================================
// 注册中心实现
// ============================================

/**
 * 世界观注册中心
 *
 * 单例类，管理所有 WorldviewDefinition 的注册和查询。
 * 替代旧的 WorldViewRegistry，仅存储世界观定义，不再管理零散 pools。
 *
 * @example
 * ```typescript
 * const registry = WorldViewRegistry.getInstance();
 * registry.register(cultivationWorldview);
 * const worldview = registry.get('cultivation');
 * ```
 */
export class WorldViewRegistry {
  private static instance: WorldViewRegistry | null = null;

  /** 世界观定义存储（key: worldviewId，English kebab-case） */
  private worldviews: Map<string, WorldviewDefinition> = new Map();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): WorldViewRegistry {
    if (!WorldViewRegistry.instance) {
      WorldViewRegistry.instance = new WorldViewRegistry();
    }
    return WorldViewRegistry.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    WorldViewRegistry.instance = null;
  }

  // ============================================
  // 世界观注册与查询
  // ============================================

  /**
   * 注册世界观定义
   *
   * @param def - 世界观定义
   * @returns 注册后的 WorldviewDefinition
   * @throws 如果世界观 ID 已存在
   */
  register(def: WorldviewDefinition): WorldviewDefinition {
    const key = def.id;
    if (this.worldviews.has(key)) {
      throw new Error(`[WorldViewRegistry] 世界观 ID 冲突: "${key}" 已注册`);
    }
    this.worldviews.set(key, { ...def });
    log.info(`已注册世界观: ${key}`);
    return def;
  }

  /**
   * 根据世界观 ID 获取世界观定义
   *
   * @param id - 世界观 ID（English kebab-case，如 "cultivation"）
   * @returns WorldviewDefinition 或 undefined
   */
  get(id: string): WorldviewDefinition | undefined {
    return this.worldviews.get(id);
  }

  /**
   * 获取所有已注册的世界观定义
   *
   * @returns WorldviewDefinition 数组（按注册顺序）
   */
  getAll(): WorldviewDefinition[] {
    return Array.from(this.worldviews.values());
  }

  /**
   * 获取所有内置世界观（builtin: true）
   *
   * @returns 内置 WorldviewDefinition 数组
   */
  getBuiltins(): WorldviewDefinition[] {
    return Array.from(this.worldviews.values()).filter(w => w.builtin);
  }

  /**
   * 获取所有已注册的世界观 ID
   *
   * @returns 世界观 ID 数组
   */
  getAllIds(): string[] {
    return Array.from(this.worldviews.keys());
  }

  /**
   * 校验世界观 ID 是否已注册
   *
   * @param id - 世界观 ID
   */
  has(id: string): boolean {
    return this.worldviews.has(id);
  }

  /** 已注册世界观数量 */
  get count(): number {
    return this.worldviews.size;
  }
}

// ============================================
// 工具函数
// ============================================

/**
 * 创建 ExtensibleWorldType 品牌字符串值
 *
 * @param id - 世界观 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值，未注册返回 undefined
 */
export function asWorldType(id: string): ExtensibleWorldType | undefined {
  const registry = WorldViewRegistry.getInstance();
  if (registry.has(id)) {
    return id as ExtensibleWorldType;
  }
  log.warn(`未注册的世界观: "${id}"`);
  return undefined;
}

/**
 * 断言创建 ExtensibleWorldType
 *
 * @param id - 世界观 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值
 * @throws 如果 ID 未注册
 */
export function assertWorldType(id: string): ExtensibleWorldType {
  const registry = WorldViewRegistry.getInstance();
  if (!registry.has(id)) {
    throw new Error(`[WorldViewRegistry] 断言失败：未注册的世界观 "${id}"`);
  }
  return id as ExtensibleWorldType;
}

/**
 * 获取所有已注册的 ExtensibleWorldType 值
 */
export function getAllWorldTypeValues(): ExtensibleWorldType[] {
  const registry = WorldViewRegistry.getInstance();
  return registry.getAllIds() as ExtensibleWorldType[];
}

/**
 * 获取世界观的视觉配置
 *
 * @param worldviewId - 世界观 ID
 * @returns 视觉配置（绝不会返回 undefined）
 */
export function getWorldVisualConfig(worldviewId: string): WorldVisualConfig {
  const registry = WorldViewRegistry.getInstance();
  const worldview = registry.get(worldviewId);
  return worldview?.visualConfig ?? DEFAULT_VISUAL_CONFIG;
}

/**
 * 类型守卫：检查一个值是否为有效的 ExtensibleWorldType
 */
export function isExtensibleWorldType(value: unknown): value is ExtensibleWorldType {
  if (typeof value !== 'string') return false;
  const registry = WorldViewRegistry.getInstance();
  return registry.has(value);
}
