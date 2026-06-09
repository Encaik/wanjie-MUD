/**
 * 任务系统模块
 * 
 * 提供统一的任务系统架构，支持多个独立的任务系统并行运行
 */

// 类型定义（排除通用函数，使用各系统的专用函数）
export type {
  TaskSystemType,
  TaskStatus,
  TaskItemReward,
  ItemReward,
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
} from './types';

// 新手任务系统
export {
  tutorialTaskSystem,
  TUTORIAL_TASKS,
  checkTutorialProgress,
  isNewbie,
  getTaskRewards,
  getTutorialWelcomeMessage,
  claimTutorialReward,
  checkNewlyCompletedTask,
  type TutorialTask,
} from './tutorialTaskSystem';

// 势力任务系统（旧版，保留兼容）
export {
  factionTaskSystem,
  FACTION_TASKS as FACTION_TASKS_OLD,
  getDailyTasks as getDailyTasksOld,
  getWeeklyTasks as getWeeklyTasksOld,
  getSpecialTasks as getSpecialTasksOld,
  getTaskCooldown,
  isTaskAvailable as isTaskAvailableOld,
  type FactionTask,
  type FactionTaskType,
  type FactionTaskDifficulty,
  type TaskRequirement as TaskRequirementOld,
} from './factionTaskSystem';

// 势力任务系统（新版，使用进度跟踪）
export {
  FACTION_TASKS,
  getDailyTasks,
  getWeeklyTasks,
  getSpecialTasks,
  getTaskById,
  getTaskRewards as getFactionTaskRewards,
  isTaskAvailable,
  getAvailableTasks,
  formatTaskProgress,
  type TaskReward as FactionTaskReward,
} from './factionTaskSystemNew';

// 任务进度系统
export {
  TaskProgressManager,
  taskProgressManager,
  TASK_STAT_MAP,
  EVENT_TO_TASK_TYPE_MAP,
  calculateRequirementProgress,
  calculateTaskProgress,
  createBaselineSnapshot,
  createBatchBaselineSnapshot,
  type TaskRequirementType,
  type TaskRequirement,
  type TaskStatus as TaskStatusNew,
  type ActiveTask,
  type TaskDefinition,
} from './taskProgressSystem';
