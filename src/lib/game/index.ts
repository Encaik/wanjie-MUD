/**
 * 游戏核心模块统一导出
 * 
 * 模块职责划分：
 * - types: 类型定义
 * - generators: 数据生成（角色、世界、背景故事）
 * - events: 历练事件系统
 * - adventure: 机缘秘境系统
 * - cultivation: 修炼系统
 * - items: 物品系统
 * - technique: 功法系统
 * - equipment: 装备系统
 * - realmData/realmSystem: 境界系统
 * - balanceConfig: 数值平衡配置
 * - terminology: 术语系统（多世界适配）
 * - quality: 品质系统
 * - traits: 词条生成
 * - messageDB: 消息存储（IndexedDB + Supabase）
 */

// ========== 类型定义 ==========
export * from './types';

// ========== 数据生成 ==========
export { 
  generateCharacters, 
  generateWorlds, 
  generateBackstory,
  getRealmName,
  getAvailableDifficultiesForRealm,
} from './utils/generators';

// ========== 历练系统 ==========
export { getRandomEvent } from './events/events';

// ========== 机缘系统 ==========
export {
  generateAdventureGrid,
  handleCellEvent,
  getAdjacentCells,
  parseEnemyInfo,
} from './adventure/adventure';

// ========== 战斗系统（新版） ==========
export {
  calculateBattleWithLogs,
} from './adventure/adventureBattleNew';

// ========== 修炼系统 ==========
export {
  executeCultivation,
  getMaxExperience,
  calculateBreakthroughRate,
  calculateBreakthroughBoost,
} from './cultivation/cultivation';

// ========== 物品系统 ==========
export {
  getItemById,
  spiritStoneItems,
  breakthroughItems,
  cultivationPillItems,
  getShopItems,
} from './utils/items';

// ========== 功法系统 ==========
export {
  generateRandomTechnique,
  generateTechniqueByType,
  techniqueRarityColors,
  techniqueTypeNames,
} from './utils/technique';

// ========== 装备系统 ==========
export {
  generateEquipment,
  generateRandomEquipment,
  getEquipmentDescription,
  equipmentRarityColors,
} from './utils/equipment';

// ========== 升级系统 ==========
export type { UpgradeMaterial, UpgradeableItemType } from './types';
export { UPGRADE_CONFIG } from './types';
export {
  getExpToNextLevel,
  getMaterialExpValue,
  techniqueToMaterial,
  equipmentToMaterial,
  calculateUpgradeBonus,
  upgradeTechnique,
  upgradeEquipment,
  getUpgradeProgress,
} from './utils/upgradeSystem';

// ========== 境界系统 ==========
export type { RealmTier, RealmSystem } from '../data/realmData';

export {
  generateRealmSystem,
  getRealmName as getRealmNameFromData,
  getNextRealm,
  getNextMainRealmLevel,
  getMainRealmName,
  getPowerSystemDescription,
  getRealmMultiplier,
  getMaxLevel,
  getExperienceForLevel,
  SUB_REALM_SYSTEMS,
  MAIN_REALM_SYSTEMS,
} from '../data/realmData';

export {
  applyGrowthStatChanges,
  applyBaseStatChanges,
  getGrowthStatCap,
  getFixedStatCap,
  MAX_LEVEL,
} from './utils/realmSystem';

// ========== 数值平衡 ==========
export {
  calculatePlayerAttack,
  calculatePlayerDefense,
  calculatePlayerMaxHp,
  calculatePlayerMaxMp,
  calculateRestHeal,
  EXPERIENCE_CONFIG,
} from './utils/balanceConfig';

// ========== 术语系统 ==========
export {
  getAttributeNames,
  getTerminology,
  getDungeonInfo,
} from './utils/terminology';

// ========== 品质系统 ==========
export {
  impactLevelToQuality,
  getQualityClasses,
} from './utils/quality';

// ========== 词条系统 ==========
export type { TraitDefinition } from './utils/traits';

export {
  QUALITY_CONFIG,
  ORIGIN_TRAITS,
  TRAIT_TRAITS,
  PERSONALITY_TRAITS,
  TALENT_TRAITS,
  selectRandomTrait,
  generateImpactDescription,
  calculateTotalImpact,
} from './utils/traits';

// ========== 消息存储 ==========
export {
  addMessage,
  getLatestMessages,
  getMessagesPage,
  getMessageCount,
  clearAllMessages,
  syncMessagesFromRemote,
} from './utils/messageDB';

// ========== 经济平衡系统 ==========
export type {
  SpiritStoneSink,
  SinkApplyResult,
  EconomyStatistics,
  EconomyHealthReport,
} from './economy';

export {
  // 配置
  SPIRIT_STONE_SINKS,
  REFORGE_CONFIG,
  TECHNIQUE_BREAKTHROUGH_CONFIG,
  REALM_BREAKTHROUGH_CONFIG,
  STAT_RESET_CONFIG,
  
  // 服务
  SpiritStoneSinkService,
  EquipmentReforgeService,
  TechniqueBreakthroughService,
  RealmBreakthroughAssistService,
  StatResetService,
  
  CurrencyRegulator,
  BattleRewardRegulator,
  QuestRewardRegulator,
  DungeonRewardRegulator,
  
  EconomyMonitor,
  getGlobalEconomyMonitor,
  EconomyReportFormatter,
} from './economy';

// ========== 商店系统 ==========
export type {
  CurrencyType,
  CurrencyConfig,
  PlayerCurrencies,
  CurrencyCost,
  PriceConfig,
  DynamicPrice,
  ProductType,
  ProductDefinition,
} from './shop';

export {
  CURRENCY_CONFIGS,
  createDefaultCurrencies,
  CurrencyService,
  migrateCurrencies,
  DailySaleService,
  NORMAL_SHOP_PRODUCTS,
  FACTION_SHOP_PRODUCTS,
  BLACKMARKET_PRODUCT_POOL,
  ARENA_SHOP_PRODUCTS,
  ASCENSION_SHOP_PRODUCTS,
  ALL_PRODUCTS,
  getProductConfig,
  RefreshService,
  SHOP_CONFIGS,
  getShopConfig,
  getAllShopTypes,
  getUnlockedShops,
  isShopUnlocked,
  getShopUnlockDescription,
  ShopLevelService,
  ShopService,
  SHOP_TASKS,
  getDailyShopTasks,
  getWeeklyShopTasks,
  createShopTaskState,
  checkTaskComplete,
} from './shop';

// ========== 地牢随机事件系统 ==========
export type {
  DungeonEventType,
  EventTypeConfig,
  ChoiceRequirements,
  RequirementCheckResult,
  EventEffectType,
  EventEffect,
  DungeonOutcome,
  DungeonChoice,
  EventConditions,
  DungeonEvent,
  EventTriggerConfig,
  EventExecutionContext,
  EventExecutionResult,
  EventStatistics,
  EventPreview,
  EventLogEntry,
} from './dungeon';

export {
  // 类型配置
  EVENT_TYPE_CONFIGS,
  DEFAULT_TRIGGER_CONFIG,
  
  // 事件配置
  DUNGEON_EVENTS,
  EVENTS_BY_TYPE,
  EVENTS_BY_ID,
  EVENT_ANCIENT_ALTAR,
  EVENT_MYSTERIOUS_SPRING,
  EVENT_MYSTERY_CHEST,
  EVENT_GOLDEN_CHEST,
  EVENT_WANDERING_MERCHANT,
  EVENT_BLACK_MARKET_MERCHANT,
  EVENT_CULTIVATION_SHRINE,
  EVENT_DIVINE_BLESSING,
  EVENT_SPIRIT_SPRING,
  EVENT_POISON_TRAP,
  EVENT_ROCK_TRAP,
  EVENT_HIDDEN_VAULT,
  EVENT_SLEEPING_GUARDIAN,
  
  // 事件获取
  getEventById,
  getEventsByType,
  getAvailableEvents,
  
  // 触发服务
  EventTriggerService,
  getEventTriggerService,
  resetEventTriggerService,
  checkRequirements,
  isChoiceAvailable,
  getAvailableChoices,
  calculateExpectedValue,
  getRecommendedChoice,
  
  // 事件执行
  applyEffect,
  executeEvent,
  handleEventCell,
  getEventPreview,
  autoExecuteEvent,
  quickHandleEvent,
  logEvent,
  getEventLogs,
  clearEventLogs,
} from './dungeon';

// ========== 终局玩法系统（飞升境界、排行榜、每周Boss、飞升商店） ==========
export type {
  // 飞升境界系统
  AscensionRealm,
  AscensionMarkSource,
  AscensionMarkGainConfig,
  PlayerAscensionState,
  
  // 排行榜系统
  LeaderboardType,
  LeaderboardEntry,
  LeaderboardReward,
  LeaderboardSettlement,
  
  // 每周Boss系统
  WeeklyBoss,
  WeeklyBossAbility,
  WeeklyBossReward,
  WeeklyBossDamageRecord,
  WeeklyBossBattleState,
  
  // 飞升商店系统
  AscensionShopItem,
  AscensionShopItemType,
  AscensionShopPurchase,
  
  // 赛季系统
  Season,
  PlayerSeasonData,
  
  // 飞升挑战系统
  GuardianAbility,
  GuardianBattleCries,
  GuardianConfig,
  GuardianBattleState,
  AscensionChallengeResult,
  NewWorldInfo,
  InheritanceChoice,
  InheritanceResult,
  
  // 配置
  AscensionConfig,
  AscensionMilestone,
} from './ascension';

export {
  // 飞升境界系统
  ASCENSION_REALMS,
  MARK_GAIN_CONFIGS,
  ASCENSION_MILESTONES,
  ASCENSION_CORE_CONFIG,
  RealmService,
  RealmSystem as AscensionRealmSystem,
  
  // 排行榜系统
  LEADERBOARD_NAMES,
  LEADERBOARD_ICONS,
  LEADERBOARD_DESCRIPTIONS,
  DEFAULT_LEADERBOARD_REWARDS,
  LEADERBOARD_RESET_INTERVALS,
  LeaderboardService,
  LeaderboardSystem,
  
  // 每周Boss系统
  WeeklyBossGenerator,
  WeeklyBossService,
  WeeklyBossSystem,
  
  // 飞升商店系统
  ASCENSION_SHOP_ITEMS,
  SHOP_TYPE_NAMES,
  SHOP_TYPE_ICONS,
  SHOP_SECTIONS,
  AscensionShopService,
  AscensionShopSystem,
  
  // 工具函数
  createInitialAscensionState,
  isFeatureUnlocked,
  getCurrentRealm,
} from './ascension';
