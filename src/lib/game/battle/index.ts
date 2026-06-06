/**
 * 战斗系统模块入口
 * 
 * 提供统一的战斗系统接口
 */

// 核心控制器
export {
  createBattleState,
  createBattleStateFromGroup,
  createBattleStatistics,
  startBattle,
  getCurrentDecisions,
  executePlayerTurn,
  executeAutoPlayerTurn,
  quickBattle,
  settleBattle,
  getBattleStatusSummary,
  getSkillStatus,
  isEmergencyHealNeeded,
  getRecommendedAction,
  serializeBattleState,
  deserializeBattleState,
} from './battleController';

// 类型定义
export type {
  BattleAction,
  BattleActionType,
  BattleActionResult,
  BattleSkill,
  BattleSkillType,
  StatBuff,
  SpecialEffectType,
  ExtendedBattleState,
  BattlePhase,
  BattleConfig,
  DecisionOption,
  DecisionContext,
  TurnResult,
  BattleStatistics,
  BattleActionRecord,
  TriggeredEvent,
  BattleEventType,
  BattleEventOptions,
  PlayerData,
} from './types';

// 从 enemy/types.ts 重新导出 Enemy 类型
export type { Enemy } from '../enemy/types';

export type { 
  BATTLE_CONSTANTS as BATTLE_CONSTANTS_TYPE,
} from './types';
export { BATTLE_CONSTANTS } from './types';
