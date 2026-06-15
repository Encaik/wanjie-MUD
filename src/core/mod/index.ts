/**
 * Mod 系统 — 桶导出
 *
 * @module core/mod
 */

export { ModLoader } from './ModLoader';

export {
  validateManifest,
  parseManifest,
} from './ModManifest';

export type {
  ModManifest,
  ManifestValidationError,
} from './ModManifest';

export {
  ALL_MOD_CONTENT_TYPES,
  ModLoadError,
} from './types';

export type {
  ModContentType,
  ServerModContentType,
  ClientModContentType,
  ModLoadPhase,
  ModLoadStatus,
  ModLoadProgress,
  ModLoadResult,
  ModEntry,
  IModLoader,
  ModProgressCallback,
  ModCompleteCallback,
  LoadedMod,
} from './types';

export {
  validateModData,
  validateMod,
} from './ModValidator';

export { BaseModLoader, ServerModLoader, ClientModLoader } from './loader';
