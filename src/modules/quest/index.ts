/**
 * 模块：Quest（任务系统）
 *
 * 职责：多阶段分支任务管理、前置条件校验、进度追踪、奖励发放、NPC 对话集成。
 *
 * @module modules/quest
 */

// 任务引擎
export {
  checkSinglePrerequisite,
  checkPrerequisites,
  startQuest,
  updateObjectiveProgress,
  checkStageCompletion,
  completeStage,
  completeQuest,
  getActiveQuestForNPC,
  ensureQuestState,
} from './logic/questEngine';

export type { PlayerCheckData } from './logic/questEngine';

// 奖励分发
export {
  mergeRewards,
  buildRewardMessage,
  createEmptyRewardResult,
} from './logic/rewardDistributor';

export type { RewardResult } from './logic/rewardDistributor';

// Hook
export { useQuest } from './hooks/useQuest';
export type { UseQuestReturn } from './hooks/useQuest';
