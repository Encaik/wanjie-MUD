/**
 * 统一数值计算系统
 * 
 * 提供完整的数值计算能力，支持多种效果来源、优先级处理、边界保护
 * 
 * @example
 * ```typescript
 * import { UnifiedCalculator, ContextBuilder } from '@/core/calculation';
 * 
 * // 构建计算上下文
 * const builder = new ContextBuilder();
 * builder.setCharacter(character)
 *         .setEquipment(equipment)
 *         .setTechniques(techniques);
 * const context = builder.build();
 * 
 * // 计算
 * const calculator = new UnifiedCalculator();
 * const result = calculator.calculateCombatStats(context);
 * ```
 */

// ============================================
// 核心类型
// ============================================
export type {
  // 属性类型
  CalculableStat,
  StatName,
  StatCategory,
  
  // 效果类型
  UnifiedEffect,
  EffectSourceType,
  EffectPriority,
  EffectCalcType,
  CalculationType,
  EffectCondition,
  EffectState,
  EffectContribution,
  
  // 计算结果
  StatCalculationResult,
  CalculationResult,
  AggregatedEffects,
  
  // 额外类型
  EffectMetadata,
  EffectConstraint,
  EffectTrace,
  CalculationWarning,
  BoundaryConfig,
  StatBound,
  SystemConfig,
  StatBounds,
} from './types';

// 常量导出
export { 
  CalculableStatList,
  STAT_CATEGORIES,
  PRIORITY_ORDER,
} from './types';

// ============================================
// 常量
// ============================================
export {
  // 边界常量
  DEFAULT_STAT_BOUNDS,
  
  // 效果常量
  MAX_ACTIVE_EFFECTS,
  EFFECT_PRIORITY_VALUES,
  DEFAULT_EFFECT_LAYER,
  PERMANENT_DURATION,
  INSTANT_DURATION,
  
  // 计算常量
  CALCULATION_CACHE_TTL,
  MAX_CALCULATION_DEPTH,
  MAX_BATCH_CALCULATION_SIZE,
  
  // 日志常量
  ENABLE_CALCULATION_LOG,
  ENABLE_EFFECT_TRACING,
  LOG_PREFIX,
  
  // 额外常量
  DEFAULT_BOUNDARY_CONFIG,
  DEFAULT_SYSTEM_CONFIG,
  EFFECT_PRIORITIES,
  CALCULATION_TYPES,
  EFFECT_SOURCE_TYPES,
  PRIORITY_ORDER as EFFECT_PRIORITY_ORDER,
  
  // 辅助函数
  getStatBounds,
  getStatDefaultValue,
  isProbabilityStat,
  isPercentageStat,
  isMultiplierStat,
} from './constants';

// ============================================
// 边界保护
// ============================================
export { 
  BoundaryChecker, 
  SafeMath, 
  FloatComparator, 
  RangeUtils 
} from './boundary';

export type { ClampResult, ClampWarning } from './boundary';

export {
  createBoundaryChecker,
  safeAdd,
  safeMultiply,
  safeClamp,
  floatEquals,
  isFinite as isFiniteNumber,
} from './boundary';

// ============================================
// 计算上下文
// ============================================
export type {
  CalculationContext,
  ContextBuilderOptions,
  BaseStatsInput,
  EquipmentInput,
  TechniqueInput,
  WorldEffectInput,
  ActiveEffectInput,
  TitleInput,
  BuffInput,
  RealmInput,
  TitleEffectInput,
  CharacterContext,
  FactionInput,
  SchoolInput,
  FactionTraitInput,
  FactionTraitEffectInput,
} from './context';

export { ContextBuilder, createContextBuilder, buildContext } from './context';

// ============================================
// 效果系统
// ============================================
export { 
  EffectRegistry, 
  EffectProcessor,
  EffectRegistrationService,
  createEffectRegistrationService,
} from './effect';

export type {
  RegistrationResult,
  BatchRegistrationResult,
  UnregistrationResult,
} from './effect';

// ============================================
// 适配器
// ============================================
export type { EffectAdapter } from './adapters';
export { 
  mapStatName, 
  generateEffectId, 
  createBaseEffect 
} from './adapters';

export { 
  EquipmentAdapter, 
  TechniqueAdapter, 
  WorldDangerAdapter, 
  WorldOpportunityAdapter,
  PillAdapter, 
  TitleAdapter, 
  BuffAdapter, 
  RealmAdapter,
  FactionAdapter,
  SchoolAdapter,
  AllAdapters,
  getAdapter,
} from './adapters';

// ============================================
// 计算器
// ============================================
export { 
  UnifiedCalculator, 
  getCalculator, 
  quickCalculate, 
  quickCalculateCombat 
} from './calculator';

// ============================================
// 计算服务（注入式）
// ============================================
export type { ICalculationService, CombatPowerResult, RealmResult } from './service';

export {
  // 服务管理
  getCalculationService,
  setCalculationService,
  resetCalculationService,
  
  // 便捷函数
  calculatePlayerPower,
  calculateEnemyPower,
  getCombatPowerRank,
  formatCombatPower,
  getCombatPowerRatio,
} from './service';

// ============================================
// 计算助手
// ============================================
export {
  buildContextFromProtagonist,
  buildContextFromEnemy,
  quickCalculatePlayerPower,
  quickCalculateEnemyPower,
} from './helpers';

// ============================================
// 计算服务（高级）
// ============================================
export type { 
  AppliedEffectResult, 
  EnemyCalculationContext,
  StatDetailBreakdown,
  AllStatBreakdowns,
  StatBonusSource,
  EffectCategory,
} from './services';

export {
  WorldEffectCalculationService,
  getWorldEffectCalculationService,
  resetWorldEffectCalculationService,
  StatDetailService,
  getStatDetailService,
} from './services';

// ============================================
// 版本信息
// ============================================
export const CALCULATION_SYSTEM_VERSION = '1.0.0';

export const CALCULATION_SYSTEM_NAME = 'Unified Calculation System';
