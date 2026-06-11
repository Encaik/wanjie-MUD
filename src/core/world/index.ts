/** Barrel export for core/world — world provider system + world generation */
export { WorldProviderRegistry } from './WorldProviderRegistry';
export { createWorldId, parseWorldId, extractSeed } from './identity';
export { buildWorldPool } from './WorldPoolEngine';
export {
  generateWorld,
  generateWorldDetails,
  generateWorlds,
  generateWorldsByCount,
  generateSeed,
  calculateDifficultyCoefficient,
  getDifficultyFromCoefficient,
} from './generateWorld';
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
