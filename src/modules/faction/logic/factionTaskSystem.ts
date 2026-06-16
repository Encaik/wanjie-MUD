// @ts-nocheck — TODO: 统一物品系统迁移后重构
/**
 * 势力任务系统
 * 
 * 势力专属任务，提供声望和贡献奖励
 * 特点：
 * - 日常/周常任务，定时刷新
 * - 可同时进行多个任务
 * - 奖励声望和贡献点
 */

// TODO: 统一物品系统迁移 — 应从 modules/item/data/ 获取物品模板
const cultivationPillItems = [{ id: 'qi_refining_pill', name: '聚气丹' }, { id: 'spirit_gathering_pill', name: '凝神丹' }];
const breakthroughItems = [{ id: 'foundation_pill', name: '筑基丹' }, { id: 'golden_core_pill', name: '结金丹' }, { id: 'nascent_soul_pill', name: '凝婴丹' }];
import { Protagonist, GameStatistics, ItemRarity } from '@/core/types';
import {
  TaskSystemType,
  TaskSystemState,
  TaskProgressResult,
  TaskReward,
  BaseTask,
  ITaskSystem,
  checkTasksProgress,
  checkNewlyCompletedTask,
  createDefaultTaskSystemState,
} from '@/modules/quest';

// ============================================
// 势力任务类型定义
// ============================================

export type FactionTaskType = 'daily' | 'weekly' | 'special';
export type FactionTaskDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

/**
 * 任务需求
 */
export interface TaskRequirement {
  type: 'kill' | 'collect' | 'cultivate' | 'explore' | 'donate' | 'upgrade';
  target: string;
  count: number;
  description: string;
}

/**
 * 势力任务接口
 */
export interface FactionTask extends BaseTask {
  id: string;
  name: string;
  description: string;
  type: FactionTaskType;
  difficulty: FactionTaskDifficulty;
  requirements: TaskRequirement[];
  reward: TaskReward;
  cooldown: number; // 冷却时间（毫秒）
  // 限制条件
  minRank?: string;
  minLevel?: number;
}

// ============================================
// 势力任务列表
// ============================================

export const FACTION_TASKS: FactionTask[] = [
  // ========== 日常任务 ==========
  {
    id: 'faction_daily_kill_monsters',
    name: '清剿妖兽',
    description: '击败任意敌人，维护势力领地安全',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'kill', target: 'any', count: 10, description: '击败10个敌人' }
    ],
    reward: {
      reputation: 100,
      contribution: 50,
      experience: 50,
      message: '完成清剿任务，获得势力声望和贡献！'
    },
    check: (p, stats) => stats.totalEnemiesKilled >= 10,
    cooldown: 86400000 // 24小时
  },
  {
    id: 'faction_daily_explore',
    name: '秘境探索',
    description: '完成一次秘境探索',
    type: 'daily',
    difficulty: 'normal',
    requirements: [
      { type: 'explore', target: 'dungeon', count: 1, description: '完成1次秘境探索' }
    ],
    reward: {
      reputation: 200,
      contribution: 100,
      experience: 100,
      message: '完成探索任务，为势力带来荣耀！'
    },
    check: (p, stats) => stats.totalAdventuresCompleted >= 1,
    cooldown: 86400000
  },
  {
    id: 'faction_daily_cultivate',
    name: '勤勉修炼',
    description: '进行修炼提升实力',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'cultivate', target: 'any', count: 5, description: '修炼5次' }
    ],
    reward: {
      reputation: 80,
      contribution: 40,
      experience: 40,
      message: '勤勉修炼，实力精进！'
    },
    check: (p, stats) => stats.totalCultivations >= 5,
    cooldown: 86400000
  },
  {
    id: 'faction_daily_donate',
    name: '势力捐献',
    description: '向势力捐献灵石',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'donate', target: 'spirit_stone', count: 500, description: '捐献500灵石' }
    ],
    reward: {
      reputation: 150,
      contribution: 200,
      experience: 60,
      message: '感谢您的捐献！'
    },
    check: () => false, // 需要特殊处理，在捐献时检查
    cooldown: 86400000
  },
  
  // ========== 周常任务 ==========
  {
    id: 'faction_weekly_boss_hunter',
    name: 'Boss猎杀者',
    description: '击杀Boss证明实力',
    type: 'weekly',
    difficulty: 'hard',
    requirements: [
      { type: 'kill', target: 'boss', count: 3, description: '击杀3个Boss' }
    ],
    reward: {
      reputation: 500,
      contribution: 300,
      experience: 300,
      items: [
        { item: cultivationPillItems[1], quantity: 3 },
        { item: breakthroughItems[0], quantity: 2 },
      ],
      message: 'Boss猎杀者！获得丰厚奖励！'
    },
    check: (p, stats) => stats.totalBossKilled >= 3,
    cooldown: 604800000 // 7天
  },
  {
    id: 'faction_weekly_elite_hunter',
    name: '精英杀手',
    description: '击杀精英怪物',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [
      { type: 'kill', target: 'elite', count: 10, description: '击杀10个精英' }
    ],
    reward: {
      reputation: 300,
      contribution: 200,
      experience: 200,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
      ],
      message: '精英杀手！势力以你为荣！'
    },
    check: (p, stats) => stats.totalEliteKilled >= 10,
    cooldown: 604800000
  },
  {
    id: 'faction_weekly_adventurer',
    name: '冒险家',
    description: '完成多次机缘探索',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [
      { type: 'explore', target: 'dungeon', count: 5, description: '完成5次机缘探索' }
    ],
    reward: {
      reputation: 400,
      contribution: 250,
      experience: 250,
      items: [
        { item: breakthroughItems[0], quantity: 3 },
      ],
      message: '冒险家！探索精神可嘉！'
    },
    check: (p, stats) => stats.totalAdventuresCompleted >= 5,
    cooldown: 604800000
  },
  
  // ========== 特殊任务 ==========
  {
    id: 'faction_special_breakthrough',
    name: '突破瓶颈',
    description: '完成一次境界突破',
    type: 'special',
    difficulty: 'hard',
    requirements: [
      { type: 'cultivate', target: 'breakthrough', count: 1, description: '完成1次突破' }
    ],
    reward: {
      reputation: 300,
      contribution: 150,
      experience: 200,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
        { item: breakthroughItems[1], quantity: 1 },
      ],
      message: '突破成功！实力大增！'
    },
    check: (p, stats) => stats.totalBreakthroughs >= 1,
    cooldown: 0 // 一次性任务
  },
];

// ============================================
// 势力任务系统实现
// ============================================

/**
 * 势力任务系统
 */
export const factionTaskSystem: ITaskSystem<FactionTask> = {
  systemType: 'faction' as TaskSystemType,
  tasks: FACTION_TASKS,

  checkProgress(
    protagonist: Protagonist,
    statistics: GameStatistics,
    state: TaskSystemState
  ): TaskProgressResult {
    return checkTasksProgress(
      FACTION_TASKS,
      state.completedTaskIds,
      protagonist,
      statistics
    );
  },

  checkNewlyCompleted(
    state: TaskSystemState,
    protagonist: Protagonist,
    statistics: GameStatistics
  ): { taskId: string; task: FactionTask } | null {
    return checkNewlyCompletedTask(
      FACTION_TASKS,
      state,
      protagonist,
      statistics
    );
  },

  getRewards(taskId: string): TaskReward | null {
    const task = FACTION_TASKS.find(t => t.id === taskId);
    return task ? task.reward : null;
  },
};

// ============================================
// 便捷函数
// ============================================

/**
 * 获取日常任务
 */
export function getDailyTasks(): FactionTask[] {
  return FACTION_TASKS.filter(t => t.type === 'daily');
}

/**
 * 获取周常任务
 */
export function getWeeklyTasks(): FactionTask[] {
  return FACTION_TASKS.filter(t => t.type === 'weekly');
}

/**
 * 获取特殊任务
 */
export function getSpecialTasks(): FactionTask[] {
  return FACTION_TASKS.filter(t => t.type === 'special');
}

/**
 * 获取任务冷却时间
 */
export function getTaskCooldown(taskId: string): number {
  const task = FACTION_TASKS.find(t => t.id === taskId);
  return task?.cooldown || 0;
}

/**
 * 检查任务是否可用（冷却检查）
 */
export function isTaskAvailable(
  taskId: string,
  state: TaskSystemState
): boolean {
  const task = FACTION_TASKS.find(t => t.id === taskId);
  if (!task) return false;
  
  // 一次性任务完成后不可再接
  if (task.type === 'special' && state.completedTaskIds.includes(taskId)) {
    return false;
  }
  
  // TODO: 检查冷却时间
  return true;
}
