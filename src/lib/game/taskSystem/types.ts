/**
 * 任务系统通用架构
 * 
 * 设计原则：
 * - 各任务系统独立运行，互不干扰
 * - 统一的接口定义，便于扩展新系统
 * - 分离的状态管理
 * 
 * 当前系统：
 * - tutorial: 新手任务系统
 * - faction: 势力任务系统
 * - 可扩展其他系统
 */

import { Protagonist, GameStatistics, ItemDefinition } from '../types';

// ============================================
// 任务系统类型定义
// ============================================

/**
 * 任务系统类型枚举
 */
export type TaskSystemType = 'tutorial' | 'faction' | 'event' | 'achievement';

/**
 * 任务状态
 */
export type TaskStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed';

/**
 * 物品奖励定义
 */
export interface TaskItemReward {
  item: ItemDefinition;
  quantity: number;
}

/**
 * 物品奖励别名（兼容旧代码）
 * @deprecated 请使用 TaskItemReward
 */
export type ItemReward = TaskItemReward;

/**
 * 通用任务奖励
 */
export interface TaskReward {
  spiritStones?: number;
  experience?: number;
  reputation?: number;
  contribution?: number;
  items?: TaskItemReward[];
  message: string;
}

/**
 * 任务基础接口
 */
export interface BaseTask {
  id: string;
  name: string;
  description: string;
  hint?: string;
  reward: TaskReward;
  // 检查任务是否完成
  check: (protagonist: Protagonist, statistics: GameStatistics) => boolean;
  // 可选：前置任务ID
  prerequisiteIds?: string[];
}

/**
 * 任务系统状态 - 每个系统独立的状态
 */
export interface TaskSystemState {
  // 任务系统类型
  systemType: TaskSystemType;
  // 已完成的任务ID列表
  completedTaskIds: string[];
  // 已领取奖励的任务ID列表
  claimedTaskIds: string[];
  // 任务进度缓存（可选，用于UI显示）
  progressCache?: Record<string, number>;
  // 上次刷新时间（用于日常/周常任务重置）
  lastRefreshTime?: number;
}

/**
 * 任务进度检查结果
 */
export interface TaskProgressResult {
  completedTaskIds: string[];
  currentTask: BaseTask | null;
  progress: number; // 0-1
  totalTasks: number;
}

/**
 * 任务系统接口 - 所有任务系统必须实现
 */
export interface ITaskSystem<T extends BaseTask> {
  // 系统类型
  readonly systemType: TaskSystemType;
  // 任务列表
  readonly tasks: T[];
  // 检查任务进度
  checkProgress(
    protagonist: Protagonist,
    statistics: GameStatistics,
    state: TaskSystemState
  ): TaskProgressResult;
  // 检查是否有新完成的任务
  checkNewlyCompleted(
    state: TaskSystemState,
    protagonist: Protagonist,
    statistics: GameStatistics
  ): { taskId: string; task: T } | null;
  // 获取任务奖励
  getRewards(taskId: string): TaskReward | null;
  // 判断是否为新玩家（针对新手任务）
  isNewbie?(
    protagonist: Protagonist,
    statistics: GameStatistics,
    state: TaskSystemState
  ): boolean;
}

// ============================================
// 任务系统管理器
// ============================================

/**
 * 所有任务系统的状态集合
 */
export interface AllTaskSystemsState {
  tutorial: TaskSystemState;
  faction: TaskSystemState;
  // 可扩展其他系统
  [key: string]: TaskSystemState;
}

/**
 * 创建默认的任务系统状态
 */
export function createDefaultTaskSystemState(
  systemType: TaskSystemType
): TaskSystemState {
  return {
    systemType,
    completedTaskIds: [],
    claimedTaskIds: [],
    lastRefreshTime: Date.now(),
  };
}

/**
 * 创建所有任务系统的默认状态
 */
export function createDefaultAllTaskSystemsState(): AllTaskSystemsState {
  return {
    tutorial: createDefaultTaskSystemState('tutorial'),
    faction: createDefaultTaskSystemState('faction'),
  };
}

// ============================================
// 通用工具函数
// ============================================

/**
 * 检查任务是否完成（通用实现）
 */
export function checkTaskCompletion<T extends BaseTask>(
  task: T,
  completedTaskIds: string[],
  protagonist: Protagonist,
  statistics: GameStatistics
): boolean {
  // 如果已在完成列表中，直接返回true
  if (completedTaskIds.includes(task.id)) {
    return true;
  }
  // 检查前置任务
  if (task.prerequisiteIds) {
    const allPrereqsMet = task.prerequisiteIds.every(preId =>
      completedTaskIds.includes(preId)
    );
    if (!allPrereqsMet) {
      return false;
    }
  }
  // 执行任务检查函数
  return task.check(protagonist, statistics);
}

/**
 * 检查任务进度（通用实现）
 */
export function checkTasksProgress<T extends BaseTask>(
  tasks: T[],
  completedTaskIds: string[],
  protagonist: Protagonist,
  statistics: GameStatistics
): TaskProgressResult {
  const completedIds: string[] = [];
  
  for (const task of tasks) {
    if (checkTaskCompletion(task, completedTaskIds, protagonist, statistics)) {
      completedIds.push(task.id);
    }
  }
  
  // 找到第一个未完成的任务
  const currentTask = tasks.find(t => !completedIds.includes(t.id)) || null;
  
  return {
    completedTaskIds: completedIds,
    currentTask,
    progress: completedIds.length / tasks.length,
    totalTasks: tasks.length,
  };
}

/**
 * 检查新完成的任务（通用实现）
 */
export function checkNewlyCompletedTask<T extends BaseTask>(
  tasks: T[],
  state: TaskSystemState,
  protagonist: Protagonist,
  statistics: GameStatistics
): { taskId: string; task: T } | null {
  const { completedTaskIds } = state;
  
  for (const task of tasks) {
    // 不在已完成列表中，但条件已满足
    if (!completedTaskIds.includes(task.id)) {
      if (task.check(protagonist, statistics)) {
        // 检查前置任务
        if (task.prerequisiteIds) {
          const allPrereqsMet = task.prerequisiteIds.every(preId =>
            completedTaskIds.includes(preId)
          );
          if (!allPrereqsMet) continue;
        }
        return { taskId: task.id, task };
      }
    }
  }
  
  return null;
}
