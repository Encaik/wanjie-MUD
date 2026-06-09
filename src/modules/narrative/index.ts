/**
 * 模块⑮ 叙事文案 — 对外契约
 *
 * 职责：世界术语、事件文案、多世界风味文本
 * 特点：纯函数模块，零游戏状态依赖
 */

// —— 类型 ——
export type { ValueContext, TextResolveResult, TextResolverConfig, UseTextResult, TextKey } from './types';

// —— 文案解析 ——
export { TextResolver, textResolver, resolveText } from './logic/textResolver';

// —— 世界观文案管理 ——
export { worldTextManager, getWorldText, WORLD_TEXT_MAP } from './logic/WorldTextManager';
export type { WorldTextDefinition } from './data/worlds/types';

// —— 术语 ——
export {
  getTerminology,
  getResourceName,
  getResourceDesc,
  getDungeonName,
  getDungeonInfo,
  getAttributeNames,
  getBreakthroughPillName,
  getCultivationPillName,
} from './logic/terminology';
export type { WorldTerminology } from './logic/terminology';

// —— 世界文案数据 ——
export {
  getWorldTexts,
  getWorldTerminology,
  getWorldStatNames,
  getWorldPaths,
} from './data/worlds';
export type { WorldTextsMap, WorldStatNames, WorldCombatTexts, WorldCultivationTexts, WorldResourceTexts, WorldItemTexts, WorldDungeonTexts, WorldUITexts, WorldBreakthroughTexts, WorldMessageTexts, WorldPathTexts, PathTextDefinition, PathTypeId } from './data/worlds/types';
