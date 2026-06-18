/**
 * modules/fortune/data/index.ts — 数据层桶导出
 */

export {
  TERRAIN_CONFIG,
  TERRAIN_NAMES,
  TERRAIN_ICONS,
  getTerrainConfig,
} from './terrainConfig';
export type { TerrainConfigEntry } from './terrainConfig';

export {
  NODE_TYPE_CONFIG,
  getNodeTypeConfig,
  getNodeTypesByCategory,
  getNodeIcon,
} from './nodeTypeConfig';
export type { NodeTypeConfigEntry } from './nodeTypeConfig';

export {
  FORTUNE_TYPE_CONFIGS,
  getFortuneTypeConfig,
  getPresetFortuneTypeIds,
  getAvailableFortuneTypes,
} from './fortuneTypeConfig';
export type { FortuneTypeConfigEntry } from './fortuneTypeConfig';

export {
  DEFAULT_FORTUNE_EVENTS,
  getDefaultEventsByRarity,
  getDefaultEvents,
} from './defaultEvents';
