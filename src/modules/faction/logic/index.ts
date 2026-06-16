/**
 * 势力模块 logic 导出
 *
 * 注意：通用任务类型（BaseTask、ITaskSystem、TaskSystemState 等）
 * 已迁移至 @/modules/quest。请从该模块导入。
 *
 * @module modules/faction/logic
 */

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
