/**
 * 经济平衡系统
 * 
 * 统一导出入口
 * 
 * 该系统包含：
 * 1. 灵石消耗服务 - 多种灵石消耗途径
 * 2. 货币调节服务 - 根据等级调节货币产出
 * 3. 经济监控服务 - 监控经济健康度
 */

// 类型定义
export type {
  SinkEffectType,
  SpiritStoneSink,
  SinkApplyResult,
  EquipmentAffix,
  CurrencyRegulationConfig,
  CurrencyRewardParams,
  EconomyStatistics,
  EconomyHealthReport,
  EconomyHealthStatus,
  DailyEconomyData,
  ReforgeConfig,
  ReforgeRequest,
  ReforgeResult,
  TechniqueBreakthroughConfig,
  TechniqueBreakthroughRequest,
  TechniqueBreakthroughResult,
  RealmBreakthroughConfig,
  RealmBreakthroughRequest,
  RealmBreakthroughResult,
  StatResetConfig,
  StatResetResult,
} from './types';

// 配置常量
export {
  SPIRIT_STONE_SINKS,
  SPIRIT_STONE_REGULATION,
  ASCENSION_MARK_REGULATION,
  CURRENCY_REGULATIONS,
  REFORGE_CONFIG,
  TECHNIQUE_BREAKTHROUGH_CONFIG,
  REALM_BREAKTHROUGH_CONFIG,
  STAT_RESET_CONFIG,
  getSinkConfig,
  getEnabledSinks,
} from './types';

// 服务类
export {
  SpiritStoneSinkService,
  EquipmentReforgeService,
  TechniqueBreakthroughService,
  RealmBreakthroughAssistService,
  StatResetService,
} from './spiritStoneSink';

export {
  CurrencyRegulator,
  BattleRewardRegulator,
  QuestRewardRegulator,
  DungeonRewardRegulator,
} from './currencyRegulator';

export {
  EconomyMonitor,
  getGlobalEconomyMonitor,
  resetGlobalEconomyMonitor,
  EconomyReportFormatter,
} from './economyMonitor';
