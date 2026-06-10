/** Barrel export for core/world — world provider system + world generation */
export { WorldProviderRegistry } from './WorldProviderRegistry';
export { createWorldId, parseWorldId, isTemplateWorldId, extractSeed } from './identity';
export { buildWorldPool } from './WorldPoolEngine';
export { TemplateWorldProvider } from './TemplateWorldProvider';
export { validateWorldTemplate } from './validateWorldTemplate';
export {
  generateWorld,
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
  WorldTemplate,
  WorldPoolEntry,
  WorldPoolSource,
  WorldPoolConfig,
  RatingData,
  WorldRatingsMap,
} from './types';
export type { WorldIdParts } from './identity';
export type { TemplateValidationResult } from './validateWorldTemplate';
