/**
 * Hooks 模块统一导出
 * 
 * 模块职责划分：
 * - useGameState: 游戏主状态管理（Provider + 全局状态）
 * - 各模块 hooks: 按功能划分的独立模块
 * - utils: 纯函数工具（非 React Hook）
 */

// ========== 主状态管理 ==========
export { useGame, GameProvider } from './useGameState';

// ========== 工具函数（非 Hook）==========
export {
  addToInventory,
  removeFromInventory,
  getSpiritStoneCount,
  hasEnoughItems,
  addItemsToInventory,
  initialGameState,
  addMessageToState,
} from './utils';

// ========== 修炼系统 ==========
export { useGameCultivation } from './cultivation';

// ========== 机缘历练系统 ==========
export { useGameAdventure } from './adventure';

// ========== 势力系统 ==========
export { useGameFaction } from './faction';

// ========== 装备系统 ==========
// 注：装备功能目前在 useGameState.tsx 中实现，待后续迁移

// ========== 炼制系统 ==========
// 注：炼丹/炼器功能目前在 useGameState.tsx 中实现，待后续迁移

// ========== 飞升系统 ==========
export { useGameAscension } from './ascension';

// ========== 消息系统 ==========
export { useGameMessages } from './messages';

// ========== UI 状态（兼容旧版）==========
export { useProtagonist, useProtagonistInfo, useHpMp, useStats, useCombatStats, useInventory, useTechniques, useExperience, useGamePhase, useTerminology } from './useGameHooks';

// ========== 响应式布局 ==========
export { useIsMobile } from './use-mobile';
