/**
 * modules/fortune/index.ts — 机缘模块桶导出
 */

// 类型
export type {
  FortuneTypeId,
  TerrainType,
  NodeType,
  NodeCategory,
  SenseLevel,
  FortuneNode,
  FortuneMap,
  FortuneSession,
  FortuneSlice,
  FortunePhase,
  FortuneLoot,
  FortuneEventTemplate,
  FortuneEventChoice,
  NodeResult,
  BattleEncounter,
  FloorPreview,
  RetreatResult,
  DeathPenalty,
  CompletionBonus,
  SettlementResult,
  VisibleCell,
  SenseHint,
  CalculatedReward,
  GridPosition,
  EnemyContent,
  EventContent,
  NodeContent,
  FragmentGain,
  RewardCategory,
  TerrainEffect,
} from './types';

// 状态
export {
  INITIAL_FORTUNE_SLICE,
  setFortuneSession,
  updatePlayerPosition,
  setNodeResult,
  updateStamina,
  markNodeCleared,
  revealCells,
  accumulateLoot,
  enterFloorTransition,
  continueToNextFloor,
  retreatFortune,
  returnToHub,
} from './state';

// 数据
export {
  TERRAIN_CONFIG,
  TERRAIN_NAMES,
  TERRAIN_ICONS,
  getTerrainConfig,
  NODE_TYPE_CONFIG,
  getNodeTypeConfig,
  getNodeTypesByCategory,
  getNodeIcon,
  FORTUNE_TYPE_CONFIGS,
  getFortuneTypeConfig,
  getPresetFortuneTypeIds,
  getAvailableFortuneTypes,
  DEFAULT_FORTUNE_EVENTS,
  getDefaultEventsByRarity,
  getDefaultEvents,
} from './data';

// 逻辑
export {
  generateFortuneMap,
  manhattanDistance,
  getMoveCost,
  resolveTerrainEffect,
  getVisionModifier,
  getTerrainNodeModifiers,
  canMoveOnTerrain,
  getStaminaStatus,
  calculateSenseLevel,
  getEffectiveVision,
  getVisibleCells,
  senseDirections,
  isInVision,
  resolveNode,
  calculateNodeReward,
  calculateFloorBonus,
  calculateCompletionBonus,
  canEnterNextFloor,
  createFloorTransition,
  getRetreatResult,
  calculateDeathPenalty,
  getCompletionBonus,
  fortuneEventRegistry,
  resolveEventChoice,
  selectRandomEvent,
} from './logic';
export type { NodeResolveContext, EventResult } from './logic';

// Hooks
export { useFortune } from './hooks';

// 组件
export {
  FortuneHub,
  FortuneCell,
  FortuneMapView,
  FloorTransition,
  FortuneResult,
} from './components';
