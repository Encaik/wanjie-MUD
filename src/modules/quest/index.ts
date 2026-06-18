/**
 * 模块：Quest（任务系统）
 *
 * 职责：统一任务系统，管理所有任务类型（引导/主线/支线/日常/周常/势力/NPC）。
 * 包含故事线引擎、板块引擎、事件驱动追踪器、奖励桥接。
 *
 * @module modules/quest
 */

// ============================================
// 通用任务类型
// ============================================

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

// ============================================
// 任务引擎（阶段驱动）
// ============================================

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

// ============================================
// 故事线引擎（新增）
// ============================================

export {
  findNodeById,
  getAllLeafQuestIds,
  flattenNodes,
  isNodeUnlockable,
  getNextQuestIds,
  getStoryProgress,
  markNodeCompleted,
} from './logic/storyEngine';

export type { StoryProgress } from './logic/storyEngine';

// ============================================
// 板块引擎（新增）
// ============================================

export {
  needsRefresh,
  getAvailableQuestsForBoard,
  refreshBoard,
  advanceBoardSlot,
  getBoardUIState,
} from './logic/boardEngine';

export type { BoardUIState } from './logic/boardEngine';

// ============================================
// 事件追踪器（新增）
// ============================================

export {
  matchEventToObjectives,
  applyEventToQuests,
  createQuestTracker,
  buildQuestCompletedPayload,
  buildQuestClaimedPayload,
} from './logic/eventTracker';

export type { TrackerResult } from './logic/eventTracker';

// ============================================
// 奖励分发
// ============================================

export {
  mergeRewards,
  buildRewardMessage,
  createEmptyRewardResult,
} from './logic/rewardDistributor';

export type { RewardResult } from './logic/rewardDistributor';

// ============================================
// 新手任务系统
// ============================================

export {
  tutorialTaskSystem,
  TUTORIAL_TASKS,
  isNewbie,
  getTaskRewards,
  getTutorialWelcomeMessage,
  claimTutorialReward,
  checkNewlyCompletedTask as checkNewlyCompletedTutorialTask,
} from './logic/tutorialTasks';

export { checkTutorialProgress as checkLegacyTutorialProgress } from './logic/tutorialTasks';

export type { TutorialTask } from './logic/tutorialTasks';

// ============================================
// 分阶段新手引导
// ============================================

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

// ============================================
// 事件驱动任务进度追踪
// ============================================

export {
  createDefaultTutorialState,
  createLegacyCompatibleTutorialState,
  checkTutorialProgress,
  claimStepReward,
  claimPhaseReward,
  isStepRewardClaimable,
  isPhaseRewardClaimable,
  getPendingDialog,
  markDialogViewed,
  getTutorialProgressInfo,
  shouldSkipPhaseZero,
} from './logic/taskProgressTracker';

export type {
  TutorialState,
  TutorialProgressResult,
} from './logic/taskProgressTracker';

// ============================================
// 组件
// ============================================

export { QuestPanel } from './components/QuestPanel';

// ============================================
// Hook
// ============================================

export { useQuest } from './hooks/useQuest';
export type { UseQuestReturn } from './hooks/useQuest';
