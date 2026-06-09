/**
 * 飞升系统模块统一导出
 * 
 * 包含：飞升境界、排行榜、每周Boss、飞升商店
 * 根据 comprehensive-optimization-design.md 设计文档实现
 */

// 类型导出
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
  AscensionMilestone
} from './types';

// 飞升境界系统
export {
  ASCENSION_REALMS,
  MARK_GAIN_CONFIGS,
  ASCENSION_MILESTONES,
  ASCENSION_CORE_CONFIG,
  RealmService,
  RealmSystem
} from './realmSystem';

// 排行榜系统
export {
  LEADERBOARD_NAMES,
  LEADERBOARD_ICONS,
  LEADERBOARD_DESCRIPTIONS,
  DEFAULT_LEADERBOARD_REWARDS,
  LEADERBOARD_RESET_INTERVALS,
  LeaderboardService,
  LeaderboardSystem
} from './leaderboardSystem';

// 每周Boss系统
export {
  WeeklyBossGenerator,
  WeeklyBossService,
  WeeklyBossSystem
} from './weeklyBossSystem';

// 飞升商店系统
export {
  ASCENSION_SHOP_ITEMS,
  SHOP_TYPE_NAMES,
  SHOP_TYPE_ICONS,
  SHOP_SECTIONS,
  AscensionShopService,
  AscensionShopSystem
} from './ascensionShop';

// 创建初始状态的工具函数
import { RealmService } from './realmSystem';

/**
 * 创建玩家初始飞升状态
 */
export function createInitialAscensionState() {
  return RealmService.createInitialState();
}

/**
 * 快速检查是否解锁功能
 */
export function isFeatureUnlocked(
  state: ReturnType<typeof RealmService.createInitialState>,
  featureId: string
): boolean {
  return RealmService.isFeatureUnlocked(state, featureId);
}

/**
 * 获取玩家当前境界信息
 */
export function getCurrentRealm(state: ReturnType<typeof RealmService.createInitialState>) {
  return RealmService.getCurrentRealm(state);
}

// 飞升核心逻辑
export * from '../hooks';
