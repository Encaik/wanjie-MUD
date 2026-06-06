/**
 * 游戏数据配置统一入口
 * 
 * 导出所有游戏配置数据：
 * - 功法配置 (techniqueConfigs.ts)
 * - 武器配置 (weaponConfigs.ts)
 * - 技能配置 (skillConfigs.ts)
 * 
 * 使用方式：
 * import { TECHNIQUE_NAMES, RARITY_CONFIG, ... } from '@/lib/gameData';
 */

export * from './techniqueConfigs';
export * from './weaponConfigs';
export * from './skillConfigs';
