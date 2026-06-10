/**
 * core/engine — 游戏引擎集成层
 *
 * 跨系统的集成逻辑，协调多个子系统：
 * - gameSystems: 成就、图鉴、事件的统一管理
 * - expansionLogic: 修炼流派、功法羁绊、装备词缀、势力进度的整合计算
 * - messageDB: 消息双层存储（IndexedDB + Supabase）
 */

export { gameSystems, initGameSystems } from './gameSystems';

export {
  selectCultivationPath,
  addPathExperience,
  calculatePathBonuses,
  addTechniqueProficiency,
  calculateTechniqueFinalStats,
  checkTechniqueBonds,
  generateEquipmentAffixes,
  calculateEquipmentFinalStats,
  enhanceEquipment,
  refineEquipment,
  addFactionReputation,
  checkRankPromotion,
  updateTaskProgress,
  claimTaskReward,
  calculateDailySalary,
  checkRealmBottleneck,
  attemptBreakthrough,
  startTribulation,
  executeTribulationPhase,
  calculateTribulationReward,
  calculateTribulationPenalty,
  calculateMentalEffect,
  updateMentalStability,
  updateKarma,
  checkDemonTrigger,
  applyMentalChange,
  getDemonEvent,
  processDemonChoice,
  updateMentalBuffs,
  addMentalBuff,
} from './expansionLogic';

export type { MentalChangeReason } from './expansionLogic';

export { MENTAL_CHANGE_CONFIG } from './expansionLogic';

export {
  addMessage,
  getLatestMessages,
  getMessagesPage,
  getMessagesBefore,
  getMessageCount,
  clearAllMessages,
  syncMessagesFromRemote,
} from './messageDB';

export type { MessagePagination } from './messageDB';
