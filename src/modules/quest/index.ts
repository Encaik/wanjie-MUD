/**
 * 模块：Quest（任务系统）
 *
 * 职责：多阶段分支任务管理、前置条件校验、进度追踪、奖励发放、NPC 对话集成、
 * 新手引导任务、通用任务类型定义。
 *
 * @module modules/quest
 */

// 通用任务类型
export type {
  TaskSystemType,
  TaskStatus,
  TaskItemReward,
  TaskReward,
  BaseTask,
  TaskSystemState,
  TaskProgressResult,
  ITaskSystem,
  AllTaskSystemsState,
} from './types';

export {
  createDefaultTaskSystemState,
  createDefaultAllTaskSystemsState,
  checkTaskCompletion,
  checkTasksProgress,
  checkNewlyCompletedTask,
} from './types';

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

// 新手任务系统
export {
  tutorialTaskSystem,
  TUTORIAL_TASKS,
  isNewbie,
  getTaskRewards,
  getTutorialWelcomeMessage,
  claimTutorialReward,
  checkNewlyCompletedTask as checkNewlyCompletedTutorialTask,
} from './logic/tutorialTasks';

// 旧 checkTutorialProgress 仍可用（兼容旧调用方）
export { checkTutorialProgress as checkLegacyTutorialProgress } from './logic/tutorialTasks';

export type { TutorialTask } from './logic/tutorialTasks';

// 分阶段新手引导
export {
  TUTORIAL_GUIDE,
  getStepById,
  getPhaseById,
  getTotalStepCount,
  getTotalPhaseCount,
} from './logic/tutorialGuide';
export type {
  TutorialDialog,
  TutorialStep,
  TutorialPhase,
  TutorialGuideDefinition,
} from './logic/tutorialGuide';

// 事件驱动任务进度追踪
export {
  createDefaultTutorialState,
  createLegacyCompatibleTutorialState,
  checkTutorialProgress,
  claimStepReward,
  isStepRewardClaimable,
  getPendingDialog,
  markDialogViewed,
  getTutorialProgressInfo,
  shouldSkipPhaseZero,
} from './logic/taskProgressTracker';
export type {
  TutorialState,
  TutorialProgressResult,
} from './logic/taskProgressTracker';

// 组件
export { QuestPanel } from './components/QuestPanel';

// Hook
export { useQuest } from './hooks/useQuest';
export type { UseQuestReturn } from './hooks/useQuest';
