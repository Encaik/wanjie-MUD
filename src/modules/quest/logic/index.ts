/**
 * modules/quest/logic — 桶导出
 *
 * @module modules/quest
 */

// 任务引擎（已有）
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
} from './questEngine';

export type { PlayerCheckData } from './questEngine';

// 故事线引擎（新增）
export {
  findNodeById,
  getAllLeafQuestIds,
  flattenNodes,
  isNodeUnlockable,
  getNextQuestIds,
  getStoryProgress,
  markNodeCompleted,
} from './storyEngine';

export type { StoryProgress } from './storyEngine';

// 板块引擎（新增）
export {
  needsRefresh,
  getAvailableQuestsForBoard,
  refreshBoard,
  advanceBoardSlot,
  getBoardUIState,
} from './boardEngine';

export type { BoardUIState } from './boardEngine';

// 事件追踪器（新增）
export {
  matchEventToObjectives,
  applyEventToQuests,
  createQuestTracker,
  buildQuestCompletedPayload,
  buildQuestClaimedPayload,
} from './eventTracker';

export type { TrackerResult } from './eventTracker';

// 模板编译器（新增）
export {
  compileTemplate,
  ensureCompiled,
  deriveEventMapping,
  clearCompilationCache,
} from './templateCompiler';
