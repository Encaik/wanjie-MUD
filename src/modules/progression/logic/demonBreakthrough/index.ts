/**
 * 心魔突破系统 — 桶导出
 *
 * @module modules/progression/logic/demonBreakthrough
 */

// 类型
export type {
  DemonType,
  DemonAttackBias,
  DemonVisualPreset,
  GeneratedDemon,
  DemonBattleStats,
  DemonSourceFactors,
  SingleAttributeCheck,
  AttributeCheckResult,
  StrategyStatType,
  StrategyChoice,
  StrategyEffect,
  StrategyChoiceResult,
  WeaknessType,
  WeaknessHit,
  RefineBattleParams,
  RefineBattleResult,
  DemonMemory,
  WorldDemonConfig,
  BreakthroughResult,
  DemonForgeParams,
  PlayerCoreStatsSnapshot,
} from './types';

export {
  DEMON_TYPE_NAMES,
  computeCoreStats,
} from './types';

// 心魔锻造
export { forgeDemon } from './demonForge';

// 阶段一：属性检定
export { executeAttributeCheck } from './phase1_check';

// 阶段二：策略选择
export { generateStrategyChoices, executeStrategyChoice } from './phase2_strategy';

// 阶段三：心魔炼化
export { simulateRefineBattle } from './phase3_battle';

// 世界观映射
export {
  WORLD_DEMON_CONFIGS,
  getWorldDemonConfig,
  getWorldDemonBaseStats,
  getWorldVisualPreset,
} from './worldResonance';

// 心魔图鉴
export {
  findDemonMemory,
  calculateDemonResistance,
  recordDemonEncounter,
  isArchNemesis,
  getArchNemesisBonus,
} from './demonMemory';
