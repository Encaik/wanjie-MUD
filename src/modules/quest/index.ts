/**
 * 模块：Quest（任务系统）
 *
 * 职责：统一任务系统，管理所有任务类型（引导/主线/支线/日常/周常/势力/NPC）。
 * 包含故事线引擎、板块引擎、事件驱动追踪器、模板编译器。
 *
 * 核心理念：任务系统 = 通用引擎，任务内容 = 数据（QuestTemplate）。
 * 两者通过 QuestTemplateRegistry + compileTemplate() 解耦。
 *
 * @module modules/quest
 */

// ============================================
// 通用任务类型（旧系统兼容，保留给 faction 等）
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
// 故事线引擎
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
// 板块引擎
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
// 事件追踪器
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
// 模板编译器（新增 — QuestTemplate → QuestDefinition）
// ============================================

export {
  compileTemplate,
  ensureCompiled,
  deriveEventMapping,
  clearCompilationCache,
} from './logic/templateCompiler';

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
// 通用进度追踪器（替代旧教程专用函数）
// ============================================

export {
  getQuestProgress,
  isStorylineCompleted,
  shouldSkipInitialTutorialPhase,
  getTutorialWelcomeMessage,
} from './logic/taskProgressTracker';

// ============================================
// 数据初始化
// ============================================

export {
  TUTORIAL_STORYLINE,
  DEFAULT_BOARDS,
  BOARD_TUTORIAL,
  BOARD_MAIN_STORY,
  BOARD_DAILY,
  BOARD_WEEKLY,
  TUTORIAL_QUEST_TEMPLATES,
  initModQuestTemplates,
} from './data';

// ============================================
// 组件
// ============================================

export { QuestPanel } from './components/QuestPanel';

// ============================================
// Hook
// ============================================

export { useQuest } from './hooks/useQuest';
export type { UseQuestReturn } from './hooks/useQuest';
