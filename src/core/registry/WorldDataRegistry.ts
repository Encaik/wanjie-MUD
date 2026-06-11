/**
 * 世界数据注册中心（WorldDataRegistry）
 *
 * 运行时单例注册中心，替代硬编码数据数组，支持 Mod 数据的注册、查询、合并。
 *
 * 设计原则：
 * - 单例模式：全局唯一实例，避免多实例间数据不一致
 * - 类型安全：所有 API 使用精确的 TypeScript 类型
 * - 后加载优先：标量字段覆盖，数组字段追加合并
 * - 优雅降级：查询不存在的 key 返回 undefined，不抛异常
 *
 * @module shared/lib/registry
 */

import { createLogger } from '@/core/logger';
import type {
  ImpactLevel,
  StatName,
  ExtensibleWorldType,
} from '@/core/types';
import type { WorldTemplate } from '@/core/world/types';

/** WorldDataRegistry 日志记录器 */
const log = createLogger('WorldDataRegistry');

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
  /** 卡片完整背景（Tailwind CSS class，含 dark 模式，如 "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30"） */
  bgGradient: string;
  /** 覆盖层渐变色（用于 WorldReveal 揭示动画，如 "from-purple-500 to-blue-500"） */
  colorGradient: string;
}

/** 默认视觉配置（用于未知世界类型的 fallback） */
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
  /** 基础生命值 */
  baseHp: number;
  /** 每级生命成长 */
  hpPerLevel: number;
  /** 每点体质增加的HP */
  hpPerConstitution: number;
  /** 基础攻击力 */
  baseAttack: number;
  /** 每级攻击成长 */
  attackPerLevel: number;
  /** 每点体质增加的攻击 */
  attackPerConstitution: number;
  /** 每点灵根增加的攻击 */
  attackPerSpiritRoot: number;
  /** 基础防御力 */
  baseDefense: number;
  /** 每级防御成长 */
  defensePerLevel: number;
  /** 每点意志增加的防御 */
  defensePerWillpower: number;
  /** 敌人额外攻击力系数 */
  enemyAttackBonus: number;
  /** 敌人额外防御力系数 */
  enemyDefenseBonus: number;
  /** 属性显示名映射（按世界类型差异化，如科技世界体质→体能） */
  statDisplayNames: Record<string, string>;
}

// ============================================
// 世界观文本类型定义（原在 modules/narrative/data/worlds/types.ts，迁移到 core 层以便 registry 使用）
// ============================================

/** 术语文案 — 核心概念词，随世界观变化 */
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

/** 属性名称 — 五大属性在不同世界的叫法 */
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

/**
 * 世界观文案定义
 *
 * 包含该世界观下所有文案的完整定义。
 * 原位置：modules/narrative/data/worlds/types.ts，迁移到 core 层作为世界观的强类型文本字段。
 */
export interface WorldTextDefinition {
  /** 世界观名称 */
  name: string;
  /** 世界观描述 */
  description: string;
  /** 术语 */
  terminology: WorldTerminology;
  /** 属性名 */
  stats: WorldStatNames;
  /** 战斗文案 */
  combat: WorldCombatTexts;
  /** 修炼文案 */
  cultivation: WorldCultivationTexts;
  /** 资源文案 */
  resource: WorldResourceTexts;
  /** 物品文案 */
  item: WorldItemTexts;
  /** 秘境文案 */
  dungeon: WorldDungeonTexts;
  /** UI文案 */
  ui: WorldUITexts;
  /** 突破文案 */
  breakthrough: WorldBreakthroughTexts;
  /** 消息文案 */
  message: WorldMessageTexts;
  /** 流派文案 */
  paths: WorldPathTexts;
}

// ============================================
// 世界观定义（WorldviewDefinition）
// ============================================

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
 *
 * @example
 * ```typescript
 * const worldview = registry.getWorldview('cultivation');
 * const world = generateWorld(worldview, 'abc12345', 0);
 * // world.worldviewId === 'cultivation'
 * // world.name 从 worldview.namePrefixes + worldview.nameSuffixes 中选取
 * ```
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
  /** 是否为核心内置世界观（wanji-core 提供则为 true） */
  builtin: boolean;
  /** 作者名（Mod 提供） */
  author?: string;
  /** 标签列表 */
  tags?: string[];
}

/**
 * @deprecated 使用 WorldviewDefinition 替代。
 * WorldTypeData 仅保留作为过渡期的类型别名，新代码请使用 WorldviewDefinition。
 */
export interface WorldTypeData {
  /** 世界数字编号（如 1、2，用于存储/序列化） */
  id: number;
  /** 世界类型英文标识（kebab-case，如 "cultivation"、"martial"，用于代码索引和文件命名） */
  type: string;
  /** 世界类型显示名称（中文，如 "修仙世界"、"高武世界"） */
  name: string;
  /** 世界类型描述 */
  description: string;
  /** 基础难度系数（0.8-2.0） */
  baseCoefficient: number;
  /** 世界名称前缀池 */
  namePrefixes: string[];
  /** 世界名称后缀池 */
  nameSuffixes: string[];
  /** 世界描述文本池 */
  descriptions: string[];
  /** 力量体系描述池 */
  powerSystems?: string[];
  /** 主要势力描述池（旧版兼容） */
  majorForces?: string[];
  /** 危险描述池 */
  dangers?: WorldImpactData[];
  /** 机缘描述池 */
  opportunities?: WorldImpactData[];
  /** 完整数值配置（baseHp、hpPerLevel 等，必须由 Mod 数据提供） */
  stats?: WorldStatsData;
  /** 是否为核心内置世界（wanji-core 提供则为 true） */
  builtin?: boolean;
  /** 世界机制配置（修炼/战斗/探索参数，由 Mod JSON 提供） */
  mechanics?: Record<string, unknown>;
  /** 视觉配置（图标、强调色、渐变、主题等，由 Mod JSON 提供） */
  visualConfig?: WorldVisualConfig;
}

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

// ============================================
// 注册中心实现
// ============================================

/**
 * 世界数据注册中心
 *
 * 单例类，提供所有游戏世界数据的运行时注册和查询。
 *
 * @example
 * ```typescript
 * const registry = WorldDataRegistry.getInstance();
 * registry.registerWorldType({ id: '修仙', name: '修仙', ... });
 * const worlds = registry.getAllWorldTypes(); // ['修仙', '高武', ...]
 * ```
 */
export class WorldDataRegistry {
  private static instance: WorldDataRegistry | null = null;

  // ===== 内部存储 =====

  /** 世界观定义（key: worldviewId，English kebab-case） */
  private worldviews: Map<string, WorldviewDefinition> = new Map();

  /**
   * @deprecated 使用 worldviews 替代。旧世界类型数据存储，过渡期保留。
   */
  private worldTypes: Map<string, WorldTypeData> = new Map();

  /** 境界体系（key: worldTypeId） */
  private realmSystems: Map<string, RealmSystemData> = new Map();

  /** 词条池（key: worldTypeId） */
  private traitPools: Map<string, TraitPoolData> = new Map();

  /** 危险效果全局池（key: dangerId） */
  private dangers: Map<string, DangerData> = new Map();

  /** 机缘效果全局池（key: opportunityId） */
  private opportunities: Map<string, OpportunityData> = new Map();

  /** 势力模板（key: factionId） */
  private factionTemplates: Map<string, FactionTemplateData> = new Map();

  /** 姓名池（key: worldTypeId） */
  private namePools: Map<string, NamePoolData> = new Map();

  /** 世界观文案（key: worldTypeId） */
  private worldTexts: Map<string, WorldTextData> = new Map();

  /** 奖励系数（key: worldTypeId） */
  private rewardCoefficients: Map<string, RewardCoefficientData> = new Map();

  /** 世界系数（key: worldTypeId） */
  private coefficients: Map<string, number> = new Map();

  /** 固化世界模板（key: templateId） */
  private worldTemplates: Map<string, WorldTemplate> = new Map();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): WorldDataRegistry {
    if (!WorldDataRegistry.instance) {
      WorldDataRegistry.instance = new WorldDataRegistry();
    }
    return WorldDataRegistry.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    WorldDataRegistry.instance = null;
  }

  // ============================================
  // 世界观（WorldviewDefinition）
  // ============================================

  /** 注册世界观定义 */
  registerWorldview(data: WorldviewDefinition): void {
    const key = data.id;
    const existing = this.worldviews.get(key);
    if (existing) {
      log.warn(`覆盖已注册的世界观: ${key}`);
    }
    this.worldviews.set(key, { ...data });
  }

  /**
   * 根据 worldviewId 获取世界观完整定义
   *
   * @param id - 世界观 ID（English kebab-case，如 "cultivation"）
   */
  getWorldview(id: string): WorldviewDefinition | undefined {
    return this.worldviews.get(id);
  }

  /** 获取所有已注册的世界观定义 */
  getAllWorldviews(): WorldviewDefinition[] {
    return Array.from(this.worldviews.values());
  }

  /** 获取所有已注册的世界观 ID */
  getAllWorldviewIds(): string[] {
    return Array.from(this.worldviews.keys());
  }

  /** 校验世界观 ID 是否有效 */
  hasWorldview(id: string): boolean {
    return this.worldviews.has(id);
  }

  /** 获取世界观文本（强类型 WorldTextDefinition） */
  getWorldviewTexts(id: string): WorldTextDefinition | undefined {
    return this.worldviews.get(id)?.texts;
  }

  /** 批量注册世界观定义 */
  registerWorldviews(worldviews: WorldviewDefinition[]): void {
    for (const wv of worldviews) {
      this.registerWorldview(wv);
    }
  }

  // ============================================
  // 世界类型（旧 API，过渡期保留）
  // ============================================

  /** 注册世界类型 */
  registerWorldType(data: WorldTypeData): void {
    const key = data.type;
    const existing = this.worldTypes.get(key);
    if (existing) {
      log.warn(`覆盖已注册的世界类型: ${key}`);
    }
    this.worldTypes.set(key, { ...data });
  }

  /**
   * 根据英文 type 获取世界类型数据
   *
   * @param type - 世界英文标识（如 "cultivation"）
   */
  getWorldType(type: string): WorldTypeData | undefined {
    return this.worldTypes.get(type);
  }

  /** 获取所有已注册的世界类型 ID */
  getAllWorldTypes(): string[] {
    return Array.from(this.worldTypes.keys());
  }

  /** 校验世界类型 ID 是否有效 */
  isValidWorldType(id: string): boolean {
    return this.worldTypes.has(id);
  }

  /** 获取所有已注册的世界类型数据 */
  getAllWorldTypeData(): WorldTypeData[] {
    return Array.from(this.worldTypes.values());
  }

  // ============================================
  // 境界体系
  // ============================================

  /** 注册境界体系 */
  registerRealmSystem(worldTypeId: string, realm: RealmSystemData): void {
    if (this.realmSystems.has(worldTypeId)) {
      log.warn(`覆盖已注册的境界体系: ${worldTypeId}`);
    }
    this.realmSystems.set(worldTypeId, { ...realm });
  }

  /** 获取境界体系 */
  getRealmSystem(worldTypeId: string): RealmSystemData | undefined {
    return this.realmSystems.get(worldTypeId);
  }

  // ============================================
  // 词条池
  // ============================================

  /** 注册词条池（数组字段追加合并） */
  registerTraitPool(worldTypeId: string, pool: TraitPoolData): void {
    const existing = this.traitPools.get(worldTypeId);
    if (existing) {
      this.traitPools.set(worldTypeId, this.mergeTraitPools(existing, pool));
    } else {
      this.traitPools.set(worldTypeId, pool);
    }
  }

  /** 获取词条池 */
  getTraitPool(worldTypeId: string): TraitPoolData | undefined {
    return this.traitPools.get(worldTypeId);
  }

  // ============================================
  // 危险/机缘（全局池）
  // ============================================

  /** 注册危险效果 */
  registerDanger(danger: DangerData): void {
    this.dangers.set(danger.id, danger);
  }

  /** 注册机缘效果 */
  registerOpportunity(opportunity: OpportunityData): void {
    this.opportunities.set(opportunity.id, opportunity);
  }

  /** 获取适用于指定世界类型的危险列表 */
  getDangersForWorld(worldTypeId: string): DangerData[] {
    return Array.from(this.dangers.values()).filter(d => {
      if (!d.worldTypes || d.worldTypes.length === 0) return true;
      return d.worldTypes.includes(worldTypeId);
    });
  }

  /** 获取适用于指定世界类型的机缘列表 */
  getOpportunitiesForWorld(worldTypeId: string): OpportunityData[] {
    return Array.from(this.opportunities.values()).filter(o => {
      if (!o.worldTypes || o.worldTypes.length === 0) return true;
      return o.worldTypes.includes(worldTypeId);
    });
  }

  /** 获取所有已注册的危险效果 */
  getAllDangers(): DangerData[] {
    return Array.from(this.dangers.values());
  }

  /** 获取所有已注册的机缘效果 */
  getAllOpportunities(): OpportunityData[] {
    return Array.from(this.opportunities.values());
  }

  // ============================================
  // 势力模板
  // ============================================

  /** 注册势力模板 */
  registerFactionTemplate(faction: FactionTemplateData): void {
    this.factionTemplates.set(faction.id, faction);
  }

  /** 获取适用于指定世界类型的势力模板 */
  getFactionTemplates(worldTypeId: string): FactionTemplateData[] {
    return Array.from(this.factionTemplates.values()).filter(
      f => f.worldTypeId === worldTypeId
    );
  }

  // ============================================
  // 姓名池
  // ============================================

  /** 注册姓名池（追加合并） */
  registerNamePool(worldTypeId: string, pool: NamePoolData): void {
    if (this.namePools.has(worldTypeId)) {
      const existing = this.namePools.get(worldTypeId)!;
      this.namePools.set(worldTypeId, {
        surnames: [...existing.surnames, ...pool.surnames],
        maleNames: [...existing.maleNames, ...pool.maleNames],
        femaleNames: [...existing.femaleNames, ...pool.femaleNames],
      });
    } else {
      this.namePools.set(worldTypeId, pool);
    }
  }

  /** 获取姓名池 */
  getNamePool(worldTypeId: string): NamePoolData | undefined {
    return this.namePools.get(worldTypeId);
  }

  // ============================================
  // 世界观文案
  // ============================================

  /** 注册世界观文案（浅合并） */
  registerWorldText(worldTypeId: string, text: WorldTextData): void {
    const existing = this.worldTexts.get(worldTypeId);
    if (existing) {
      this.worldTexts.set(worldTypeId, { ...existing, ...text });
    } else {
      this.worldTexts.set(worldTypeId, text);
    }
  }

  /** 获取世界观文案 */
  getWorldText(worldTypeId: string): WorldTextData | undefined {
    return this.worldTexts.get(worldTypeId);
  }

  // ============================================
  // 世界系数
  // ============================================

  /** 注册世界系数 */
  registerCoefficient(worldTypeId: string, coefficient: number): void {
    this.coefficients.set(worldTypeId, coefficient);
  }

  /** 获取世界基础系数（未注册返回 1.0） */
  getCoefficient(worldTypeId: string): number {
    return this.coefficients.get(worldTypeId) ?? 1.0;
  }

  // ============================================
  // 固化世界模板
  // ============================================

  /** 注册固化世界模板 */
  registerWorldTemplate(template: WorldTemplate): void {
    if (this.worldTemplates.has(template.id)) {
      log.warn(`覆盖已注册的世界模板: ${template.id}`);
    }
    this.worldTemplates.set(template.id, template);
  }

  /** 获取固化世界模板 */
  getWorldTemplate(id: string): WorldTemplate | undefined {
    return this.worldTemplates.get(id);
  }

  /** 获取所有固化世界模板 */
  getAllWorldTemplates(): WorldTemplate[] {
    return Array.from(this.worldTemplates.values());
  }

  // ============================================
  // 奖励系数
  // ============================================

  /** 注册奖励系数 */
  registerRewardCoefficient(worldTypeId: string, reward: RewardCoefficientData): void {
    this.rewardCoefficients.set(worldTypeId, reward);
  }

  /** 获取奖励系数 */
  getRewardCoefficient(worldTypeId: string): RewardCoefficientData | undefined {
    return this.rewardCoefficients.get(worldTypeId);
  }

  // ============================================
  // 批量注册辅助方法
  // ============================================

  /** 批量注册世界类型 */
  registerWorldTypes(worlds: WorldTypeData[]): void {
    for (const world of worlds) {
      this.registerWorldType(world);
    }
  }

  /** 批量注册危险效果 */
  registerDangers(dangers: DangerData[]): void {
    for (const d of dangers) {
      this.registerDanger(d);
    }
  }

  /** 批量注册机缘效果 */
  registerOpportunities(opportunities: OpportunityData[]): void {
    for (const o of opportunities) {
      this.registerOpportunity(o);
    }
  }

  /** 批量注册势力模板 */
  registerFactionTemplates(factions: FactionTemplateData[]): void {
    for (const f of factions) {
      this.registerFactionTemplate(f);
    }
  }

  // ============================================
  // 私有辅助
  // ============================================

  /** 合并两个词条池（追加策略，基于 name 去重） */
  private mergeTraitPools(existing: TraitPoolData, incoming: TraitPoolData): TraitPoolData {
    const categories: (keyof TraitPoolData)[] = ['origin', 'trait', 'personality', 'talent'];

    const result: TraitPoolData = {
      origin: { ...existing.origin },
      trait: { ...existing.trait },
      personality: { ...existing.personality },
      talent: { ...existing.talent },
    };

    for (const category of categories) {
      const levels = Object.keys(incoming[category]) as ImpactLevel[];
      for (const level of levels) {
        const existingTraits = result[category][level] || [];
        const incomingTraits = incoming[category][level] || [];
        const existingNames = new Set(existingTraits.map(t => t.name));
        const newTraits = incomingTraits.filter(t => !existingNames.has(t.name));
        result[category][level] = [...existingTraits, ...newTraits];
      }
    }

    return result;
  }
}

// ============================================
// ExtensibleWorldType 工厂函数
// ============================================

/**
 * 创建 ExtensibleWorldType 品牌字符串值
 *
 * 在运行时校验 ID 是否已在注册中心注册。
 *
 * @param id - 世界类型 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值，未注册返回 undefined
 *
 * @example
 * ```typescript
 * const wt = asWorldType('修仙');
 * if (wt) { const world = generateWorld(1, wt); }
 * ```
 */
export function asWorldType(id: string): ExtensibleWorldType | undefined {
  const registry = WorldDataRegistry.getInstance();
  if (registry.isValidWorldType(id)) {
    return id as ExtensibleWorldType;
  }
  log.warn(`未注册的世界类型: "${id}"`);
  return undefined;
}

/**
 * 断言创建 ExtensibleWorldType（开发模式专用）
 *
 * @param id - 世界类型 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值
 * @throws 如果 ID 未在注册中心注册
 */
export function assertWorldType(id: string): ExtensibleWorldType {
  const registry = WorldDataRegistry.getInstance();
  if (!registry.isValidWorldType(id)) {
    throw new Error(`[WorldDataRegistry] 断言失败：未注册的世界类型 "${id}"`);
  }
  return id as ExtensibleWorldType;
}

/**
 * 获取所有已注册的 ExtensibleWorldType 值
 *
 * @returns ExtensibleWorldType 数组
 */
export function getAllWorldTypeValues(): ExtensibleWorldType[] {
  const registry = WorldDataRegistry.getInstance();
  return registry.getAllWorldTypes() as ExtensibleWorldType[];
}

/**
 * 类型守卫：检查一个值是否为有效的 ExtensibleWorldType
 *
 * 运行时校验 ID 是否在注册中心注册。
 *
 * @param value - 待检查的值
 * @returns 如果是已注册的世界类型则返回 true
 *
 * @example
 * ```typescript
 * if (isExtensibleWorldType(someValue)) {
 *   // someValue 被收窄为 ExtensibleWorldType
 *   const world = generateWorld(1, someValue);
 * }
 * ```
 */
/**
 * 获取世界类型的视觉配置
 *
 * 从注册中心读取，如果世界类型未注册或无 visualConfig 则返回默认配置。
 *
 * @param worldType - 世界类型 ID 字符串
 * @returns 视觉配置（绝不会返回 undefined）
 */
export function getWorldVisualConfig(worldType: string): WorldVisualConfig {
  const registry = WorldDataRegistry.getInstance();
  const data = registry.getWorldType(worldType);
  return data?.visualConfig ?? DEFAULT_VISUAL_CONFIG;
}

export function isExtensibleWorldType(value: unknown): value is ExtensibleWorldType {
  if (typeof value !== 'string') return false;
  const registry = WorldDataRegistry.getInstance();
  return registry.isValidWorldType(value);
}
