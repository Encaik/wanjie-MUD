/** Barrel export for shared/config — environment and version configuration */
export { isDebugMode, isProductionMode, getMode } from './env';
export { GAME_VERSION, parseSemver, checkWorldTemplateCompatibility } from './version';
export type { SemverParts, VersionCompatibility } from './version';
