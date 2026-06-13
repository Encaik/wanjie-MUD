/**
 * 模块⑯ NPC（非玩家角色）
 *
 * 职责：NPC 类型定义、数据管理、查询逻辑、态度计算、对话引擎、交易计算
 */

// 旧版类型（过渡期）
export type { NPC } from './types';

// 旧版逻辑
export { findNPCById, findNPCsByTag, findNPCsByAffiliation, findAIDialogueNPCs } from './logic';

// 旧版数据
export { NPC_TEMPLATES, AVAILABLE_NPCS } from './data';

// ── 新版：态度计算 ──
export {
  getAttitudeLevel,
  clampAttitude,
  calculateInitialAttitude,
  calculateAttitudeChange,
  applyAttitudeChanges,
  isHostile,
  shouldNPCFlee,
} from './logic/attitudeCalculator';

export type { AttitudeAction } from './logic/attitudeCalculator';

// ── 新版：对话引擎 ──
export {
  evaluateOptionGates,
  allGatesPassed,
  firstFailedGate,
  evaluateOption,
  getAvailableDialogueLine,
  getOptionCheck,
  injectQuestOptions,
} from './logic/dialogueEngine';

export type {
  OptionEvaluation,
  GateResult,
  DialogueLineResult,
  InjectedQuestOptions,
} from './logic/dialogueEngine';

// ── 新版：交易计算 ──
export {
  canTrade,
  calculateShopPrice,
  getAvailableShopItems,
  purchaseItem,
  restockShopItems,
} from './logic/shopCalculator';

export type {
  AvailableShopItem,
  PurchaseResult,
} from './logic/shopCalculator';
