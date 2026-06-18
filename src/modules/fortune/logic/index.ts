/**
 * modules/fortune/logic/index.ts — 逻辑层桶导出
 */

export {
  generateFortuneMap,
  manhattanDistance,
} from './mapGenerator';

export {
  getMoveCost,
  resolveTerrainEffect,
  getVisionModifier,
  getTerrainNodeModifiers,
  canMoveOnTerrain,
  getStaminaStatus,
} from './terrainSystem';

export {
  calculateSenseLevel,
  getEffectiveVision,
  getVisibleCells,
  senseDirections,
  isInVision,
} from './visionSystem';

export {
  resolveNode,
} from './nodeResolver';
export type { NodeResolveContext } from './nodeResolver';

export {
  calculateNodeReward,
  calculateFloorBonus,
  calculateCompletionBonus,
} from './rewardCalculator';

export {
  canEnterNextFloor,
  createFloorTransition,
  getRetreatResult,
  calculateDeathPenalty,
  getCompletionBonus,
} from './depthManager';

export {
  fortuneEventRegistry,
  resolveEventChoice,
  selectRandomEvent,
} from './eventEngine';
export type { EventResult } from './eventEngine';
