/**
 * 战斗引擎 — 桶导出
 *
 * @module core/combat
 */

export {
  executeCombat,
  CombatSession,
  calculateDamage,
  setCombatSeed,
} from './combatEngine';

export type {
  EngagementType,
  CombatSkill,
  CombatUnit,
  CombatMode,
  CombatResult,
  CombatRoundLog,
} from './types';
