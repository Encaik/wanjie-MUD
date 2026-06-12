/** Barrel export for core/world — world provider system + world generation */
export { WorldProviderRegistry } from './WorldProviderRegistry';
export { createWorldId, parseWorldId, extractSeed } from './identity';
export { buildWorldPool } from './WorldPoolEngine';
export {
  generateWorld,
  generateWorldBasicFields,
  generateWorldDetails,
  generateWorlds,
  generateWorldsByCount,
  generateSeed,
  calculateDifficultyCoefficient,
  getDifficultyFromCoefficient,
} from './generateWorld';
export {
  calculateCoreStats,
  calculateAttributeGrowth,
  DEFAULT_CORE_STAT_BASE_VALUES,
  getCoreStatKeys,
  CORE_STAT_DISPLAY_NAMES,
  CORE_STAT_CATEGORIES,
} from './calculateCoreStats';
export type { AttributeValues, CoreStatValues } from './calculateCoreStats';
export { DEFAULT_WORLD_POOL_CONFIG } from './types';
export type {
  WorldProvider,
  WorldProviderMetadata,
  WorldProviderType,
  WorldPoolEntry,
  WorldPoolSource,
  WorldPoolConfig,
  RatingData,
  WorldRatingsMap,
} from './types';
export type { WorldIdParts } from './identity';
