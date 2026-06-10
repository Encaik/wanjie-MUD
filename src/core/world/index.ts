/** Barrel export for shared/lib/world — world provider system */
export { WorldProviderRegistry } from './WorldProviderRegistry';
export { createWorldId, parseWorldId, isTemplateWorldId, extractSeed } from './identity';
export { buildWorldPool } from './WorldPoolEngine';
export { TemplateWorldProvider } from './TemplateWorldProvider';
export { validateWorldTemplate } from './validateWorldTemplate';
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
