/**
 * 任务进度系统
 * 
 * 核心设计：
 * 1. 任务进度 = 当前累计值 - 接取时的基准值
 * 2. 每个任务记录接取时的统计数据快照
 * 3. 统计事件自动触发任务进度更新
 * 
 * 根据 game-design-strict 要求：
 * - 所有变量在使用前已初始化
 * - 所有状态转移有条件约束
 * - 边界条件完整处理
 */

import { StatisticsEventType } from '../statisticsSystem';
import { GameStatistics } from '../types';

// ============================================
// 任务需求类型定义
// ============================================

/**
 * 任务需求类型 - 与统计事件对应
 */
export type TaskRequirementType =
  | 'kill_any'           // 击杀任意敌人
  | 'kill_boss'          // 击杀Boss
  | 'kill_elite'         // 击杀精英
  | 'adventure'          // 完成机缘
  | 'cultivate'          // 修炼次数
  | 'breakthrough'       // 突破次数
  | 'collect_technique'  // 收集功法
  | 'collect_equipment'  // 收集装备
  | 'collect_material'   // 收集材料
  | 'collect_fragment'   // 收集碎片
  | 'craft_equipment'    // 合成装备
  | 'synthesize_technique' // 合成功法
  | 'synthesize_fragment'  // 合成碎片
  | 'donate_spirit_stones' // 捐献灵石
  | 'donate_count'       // 捐献次数
  | 'gain_contribution'  // 获得贡献
  | 'use_item'           // 使用物品
  | 'gain_spirit_stones' // 获得灵石
  | 'spend_spirit_stones'; // 消耗灵石

/**
 * 任务需求定义
 */
export interface TaskRequirement {
  type: TaskRequirementType;
  count: number;
  description: string;
}

/**
 * 任务状态
 */
export type TaskStatus = 'available' | 'in_progress' | 'completed' | 'claimed';

/**
 * 进行中的任务状态
 */
export interface ActiveTask {
  taskId: string;
  acceptedAt: number;
  /** 接取时的统计基准值 */
  baseline: Record<string, number>;
  /** 任务类型 */
  type: 'daily' | 'weekly' | 'special';
}

/**
 * 任务定义
 */
export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  requirements: TaskRequirement[];
  rewards: {
    reputation?: number;
    contribution?: number;
    experience?: number;
    spiritStones?: number;
    items?: Array<{ item: any; quantity: number }>;  // 使用 any 避免循环依赖
    message: string;
  };
  cooldown: number; // 冷却时间（毫秒），0表示一次性任务
  minLevel?: number;
  maxLevel?: number;
}

// ============================================
// 统计字段映射
// ============================================

/**
 * 任务需求类型 -> 统计字段映射
 */
export const TASK_STAT_MAP: Record<TaskRequirementType, keyof GameStatistics> = {
  kill_any: 'totalEnemiesKilled',
  kill_boss: 'totalBossKilled',
  kill_elite: 'totalEliteKilled',
  adventure: 'totalAdventuresCompleted',
  cultivate: 'totalCultivations',
  breakthrough: 'totalBreakthroughs',
  collect_technique: 'totalTechniquesCollected',
  collect_equipment: 'totalEquipmentsCollected',
  collect_material: 'totalMaterialsCollected',
  collect_fragment: 'totalFragmentsCollected',
  craft_equipment: 'totalEquipmentsCrafted',
  synthesize_technique: 'totalTechniquesSynthesized',
  synthesize_fragment: 'totalFragmentsSynthesized',
  donate_spirit_stones: 'totalSpiritStonesDonated',
  donate_count: 'totalDonations',
  gain_contribution: 'totalContribution',
  use_item: 'totalItemsUsed',
  gain_spirit_stones: 'totalSpiritStonesGained',
  spend_spirit_stones: 'totalSpiritStonesSpent',
};

/**
 * 统计事件 -> 任务需求类型映射
 */
export const EVENT_TO_TASK_TYPE_MAP: Partial<Record<StatisticsEventType, TaskRequirementType[]>> = {
  enemy_killed: ['kill_any'],
  boss_killed: ['kill_boss'],
  elite_killed: ['kill_elite'],
  adventure_completed: ['adventure'],
  cultivation_done: ['cultivate'],
  breakthrough_done: ['breakthrough'],
  technique_collected: ['collect_technique'],
  equipment_collected: ['collect_equipment'],
  material_collected: ['collect_material'],
  fragment_collected: ['collect_fragment'],
  equipment_crafted: ['craft_equipment'],
  technique_synthesized: ['synthesize_technique'],
  fragment_synthesized: ['synthesize_fragment'],
  donation_made: ['donate_spirit_stones', 'donate_count'],
  contribution_gained: ['gain_contribution'],
  item_used: ['use_item'],
  spirit_stones_gained: ['gain_spirit_stones'],
  spirit_stones_spent: ['spend_spirit_stones'],
};

// ============================================
// 任务进度计算
// ============================================

/**
 * 计算单个需求的进度
 */
export function calculateRequirementProgress(
  requirement: TaskRequirement,
  currentStats: GameStatistics,
  baseline: Record<string, number>
): { current: number; target: number; progress: number } {
  const statKey = TASK_STAT_MAP[requirement.type];
  
  if (!statKey) {
    console.warn(`[TaskProgress] Unknown requirement type: ${requirement.type}`);
    return { current: 0, target: requirement.count, progress: 0 };
  }
  
  const currentValue = currentStats[statKey] as number;
  const baselineValue = baseline[statKey] ?? 0;
  const progress = Math.max(0, currentValue - baselineValue);
  
  return {
    current: progress,
    target: requirement.count,
    progress: Math.min(1, progress / requirement.count),
  };
}

/**
 * 计算任务整体进度
 */
export function calculateTaskProgress(
  task: TaskDefinition,
  currentStats: GameStatistics,
  baseline: Record<string, number>
): {
  isCompleted: boolean;
  requirements: Array<{
    type: TaskRequirementType;
    current: number;
    target: number;
    progress: number;
    isCompleted: boolean;
  }>;
  overallProgress: number;
} {
  const requirements = task.requirements.map(req => {
    const result = calculateRequirementProgress(req, currentStats, baseline);
    return {
      type: req.type,
      ...result,
      isCompleted: result.current >= result.target,
    };
  });
  
  const isCompleted = requirements.every(r => r.isCompleted);
  const overallProgress = requirements.reduce((sum, r) => sum + r.progress, 0) / requirements.length;
  
  return {
    isCompleted,
    requirements,
    overallProgress,
  };
}

// ============================================
// 基准值快照
// ============================================

/**
 * 创建统计基准值快照
 * 只保存任务需要的统计字段
 */
export function createBaselineSnapshot(
  requirements: TaskRequirement[],
  currentStats: GameStatistics
): Record<string, number> {
  const baseline: Record<string, number> = {};
  
  for (const req of requirements) {
    const statKey = TASK_STAT_MAP[req.type];
    if (statKey) {
      baseline[statKey] = currentStats[statKey] as number;
    }
  }
  
  return baseline;
}

/**
 * 批量创建基准值快照（多个任务共用一个快照）
 */
export function createBatchBaselineSnapshot(
  allRequirements: TaskRequirement[][],
  currentStats: GameStatistics
): Record<string, number> {
  const baseline: Record<string, number> = {};
  
  // 收集所有需要的统计字段
  const allStatKeys = new Set<keyof GameStatistics>();
  for (const requirements of allRequirements) {
    for (const req of requirements) {
      const statKey = TASK_STAT_MAP[req.type];
      if (statKey) {
        allStatKeys.add(statKey);
      }
    }
  }
  
  // 创建快照
  for (const statKey of allStatKeys) {
    baseline[statKey] = currentStats[statKey] as number;
  }
  
  return baseline;
}

// ============================================
// 任务管理器
// ============================================

/**
 * 任务进度管理器
 */
export class TaskProgressManager {
  private activeTasks: Map<string, ActiveTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private claimedTasks: Set<string> = new Set();
  
  /**
   * 接取任务
   */
  acceptTask(task: TaskDefinition, currentStats: GameStatistics): ActiveTask | null {
    // 检查是否已接取
    if (this.activeTasks.has(task.id)) {
      console.warn(`[TaskProgress] Task already accepted: ${task.id}`);
      return null;
    }
    
    // 检查是否已完成（一次性任务）
    if (task.type === 'special' && this.completedTasks.has(task.id)) {
      console.warn(`[TaskProgress] Special task already completed: ${task.id}`);
      return null;
    }
    
    // 创建基准值快照
    const baseline = createBaselineSnapshot(task.requirements, currentStats);
    
    const activeTask: ActiveTask = {
      taskId: task.id,
      acceptedAt: Date.now(),
      baseline,
      type: task.type,
    };
    
    this.activeTasks.set(task.id, activeTask);
    return activeTask;
  }
  
  /**
   * 检查任务进度
   */
  checkProgress(task: TaskDefinition, currentStats: GameStatistics): ReturnType<typeof calculateTaskProgress> | null {
    const activeTask = this.activeTasks.get(task.id);
    if (!activeTask) {
      return null;
    }
    
    return calculateTaskProgress(task, currentStats, activeTask.baseline);
  }
  
  /**
   * 检查所有进行中任务的完成状态
   */
  checkAllProgress(
    tasks: TaskDefinition[],
    currentStats: GameStatistics
  ): Array<{
    task: TaskDefinition;
    progress: ReturnType<typeof calculateTaskProgress>;
    activeTask: ActiveTask;
  }> {
    const results: Array<{
      task: TaskDefinition;
      progress: ReturnType<typeof calculateTaskProgress>;
      activeTask: ActiveTask;
    }> = [];
    
    for (const task of tasks) {
      const activeTask = this.activeTasks.get(task.id);
      if (!activeTask) continue;
      
      const progress = calculateTaskProgress(task, currentStats, activeTask.baseline);
      results.push({ task, progress, activeTask });
    }
    
    return results;
  }
  
  /**
   * 完成任务
   */
  completeTask(taskId: string): boolean {
    const activeTask = this.activeTasks.get(taskId);
    if (!activeTask) {
      return false;
    }
    
    this.activeTasks.delete(taskId);
    this.completedTasks.add(taskId);
    return true;
  }
  
  /**
   * 领取任务奖励
   */
  claimTaskReward(taskId: string): boolean {
    if (!this.completedTasks.has(taskId)) {
      return false;
    }
    
    this.claimedTasks.add(taskId);
    return true;
  }
  
  /**
   * 获取所有进行中的任务
   */
  getActiveTasks(): ActiveTask[] {
    return Array.from(this.activeTasks.values());
  }
  
  /**
   * 获取已完成的任务ID列表
   */
  getCompletedTaskIds(): string[] {
    return Array.from(this.completedTasks);
  }
  
  /**
   * 获取已领取的任务ID列表
   */
  getClaimedTaskIds(): string[] {
    return Array.from(this.claimedTasks);
  }
  
  /**
   * 从存档恢复状态
   */
  restoreState(state: {
    activeTasks: ActiveTask[];
    completedTaskIds: string[];
    claimedTaskIds: string[];
  }): void {
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.claimedTasks.clear();
    
    for (const task of state.activeTasks) {
      this.activeTasks.set(task.taskId, task);
    }
    for (const id of state.completedTaskIds) {
      this.completedTasks.add(id);
    }
    for (const id of state.claimedTaskIds) {
      this.claimedTasks.add(id);
    }
  }
  
  /**
   * 导出状态用于存档
   */
  exportState(): {
    activeTasks: ActiveTask[];
    completedTaskIds: string[];
    claimedTaskIds: string[];
  } {
    return {
      activeTasks: this.getActiveTasks(),
      completedTaskIds: this.getCompletedTaskIds(),
      claimedTaskIds: this.getClaimedTaskIds(),
    };
  }
  
  /**
   * 重置日常任务
   */
  resetDailyTasks(): void {
    for (const [id, task] of this.activeTasks) {
      if (task.type === 'daily') {
        this.activeTasks.delete(id);
      }
    }
    // 移除日常任务的完成记录（允许重新完成）
    // 注意：这里不移除 claimedTasks，因为日常奖励只能领一次
  }
  
  /**
   * 重置周常任务
   */
  resetWeeklyTasks(): void {
    for (const [id, task] of this.activeTasks) {
      if (task.type === 'weekly') {
        this.activeTasks.delete(id);
      }
    }
  }
}

// 单例导出
export const taskProgressManager = new TaskProgressManager();
