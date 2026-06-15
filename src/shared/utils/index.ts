/** Barrel export for utils — general utilities */
export { cn } from './cn';
export { SAVE_VERSION, migrateProtagonist, migrateStatistics, DEFAULT_STATISTICS } from './saveMigrator';
export { request, get, post, put, del } from './api-client';
export { computeScaleFactor, useResolutionScale } from './resolution-scale';
export { useDebounce, useThrottle } from './use-debounce';
export type { ApiResult } from '@/app/api/result';
