/**
 * 势力任务系统 - 重构版
 * 
 * 使用新的任务进度系统：
 * - 任务进度 = 当前累计值 - 接取时的基准值
 * - 支持多种任务类型
 * - 与统计系统紧密集成
 */

import { breakthroughItems, cultivationPillItems } from '../utils/items';
import { Protagonist, GameStatistics, ItemDefinition } from '../types';
import {
  TaskDefinition,
  TaskRequirementType,
  TaskRequirement,
  TaskStatus,
  ActiveTask,
  calculateTaskProgress,
  createBaselineSnapshot,
} from './taskProgressSystem';

// ============================================
// 任务奖励定义
// ============================================

export interface TaskReward {
  reputation?: number;
  contribution?: number;
  experience?: number;
  spiritStones?: number;
  items?: Array<{ item: ItemDefinition; quantity: number }>;
  message: string;
}

// ============================================
// 势力任务列表
// ============================================

/**
 * 势力任务定义
 */
export const FACTION_TASKS: TaskDefinition[] = [
  // ========== 日常任务 ==========
  {
    id: 'faction_daily_kill_monsters',
    name: '清剿妖兽',
    description: '击败任意敌人，维护势力领地安全',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'kill_any' as TaskRequirementType, count: 10, description: '击败10个敌人' }
    ],
    rewards: {
      reputation: 100,
      contribution: 50,
      experience: 50,
      message: '完成清剿任务，获得势力声望和贡献！'
    },
    cooldown: 86400000, // 24小时
  },
  {
    id: 'faction_daily_explore',
    name: '秘境探索',
    description: '完成机缘探索',
    type: 'daily',
    difficulty: 'normal',
    requirements: [
      { type: 'adventure' as TaskRequirementType, count: 1, description: '完成1次机缘探索' }
    ],
    rewards: {
      reputation: 200,
      contribution: 100,
      experience: 100,
      message: '完成探索任务，为势力带来荣耀！'
    },
    cooldown: 86400000,
  },
  {
    id: 'faction_daily_cultivate',
    name: '勤勉修炼',
    description: '进行修炼提升实力',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'cultivate' as TaskRequirementType, count: 5, description: '修炼5次' }
    ],
    rewards: {
      reputation: 80,
      contribution: 40,
      experience: 40,
      message: '勤勉修炼，实力精进！'
    },
    cooldown: 86400000,
  },
  {
    id: 'faction_daily_donate',
    name: '势力捐献',
    description: '向势力捐献灵石',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'donate_spirit_stones' as TaskRequirementType, count: 500, description: '捐献500灵石' }
    ],
    rewards: {
      reputation: 150,
      contribution: 200,
      experience: 60,
      message: '感谢您的捐献！'
    },
    cooldown: 86400000,
  },
  {
    id: 'faction_daily_collect_fragments',
    name: '碎片收集',
    description: '收集功法或装备碎片',
    type: 'daily',
    difficulty: 'normal',
    requirements: [
      { type: 'collect_fragment' as TaskRequirementType, count: 5, description: '收集5个碎片' }
    ],
    rewards: {
      reputation: 120,
      contribution: 80,
      experience: 80,
      message: '碎片收集完成！'
    },
    cooldown: 86400000,
  },
  {
    id: 'faction_daily_use_items',
    name: '资源利用',
    description: '使用丹药或其他物品',
    type: 'daily',
    difficulty: 'easy',
    requirements: [
      { type: 'use_item' as TaskRequirementType, count: 3, description: '使用3个物品' }
    ],
    rewards: {
      reputation: 60,
      contribution: 30,
      experience: 30,
      message: '资源利用得当！'
    },
    cooldown: 86400000,
  },
  
  // ========== 周常任务 ==========
  {
    id: 'faction_weekly_boss_hunter',
    name: 'Boss猎杀者',
    description: '击杀Boss证明实力',
    type: 'weekly',
    difficulty: 'hard',
    requirements: [
      { type: 'kill_boss' as TaskRequirementType, count: 3, description: '击杀3个Boss' }
    ],
    rewards: {
      reputation: 500,
      contribution: 300,
      experience: 300,
      items: [
        { item: cultivationPillItems[1], quantity: 3 },
        { item: breakthroughItems[0], quantity: 2 },
      ],
      message: 'Boss猎杀者！获得丰厚奖励！'
    },
    cooldown: 604800000, // 7天
  },
  {
    id: 'faction_weekly_elite_hunter',
    name: '精英杀手',
    description: '击杀精英怪物',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [
      { type: 'kill_elite' as TaskRequirementType, count: 10, description: '击杀10个精英' }
    ],
    rewards: {
      reputation: 300,
      contribution: 200,
      experience: 200,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
      ],
      message: '精英杀手！势力以你为荣！'
    },
    cooldown: 604800000,
  },
  {
    id: 'faction_weekly_adventurer',
    name: '冒险家',
    description: '完成多次机缘探索',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [
      { type: 'adventure' as TaskRequirementType, count: 5, description: '完成5次机缘探索' }
    ],
    rewards: {
      reputation: 400,
      contribution: 250,
      experience: 250,
      items: [
        { item: breakthroughItems[0], quantity: 3 },
      ],
      message: '冒险家！探索精神可嘉！'
    },
    cooldown: 604800000,
  },
  {
    id: 'faction_weekly_craft_equipment',
    name: '装备锻造师',
    description: '合成装备提升战力',
    type: 'weekly',
    difficulty: 'hard',
    requirements: [
      { type: 'craft_equipment' as TaskRequirementType, count: 2, description: '合成2件装备' }
    ],
    rewards: {
      reputation: 350,
      contribution: 200,
      experience: 200,
      message: '装备锻造师！工艺精湛！'
    },
    cooldown: 604800000,
  },
  {
    id: 'faction_weekly_contribution',
    name: '贡献达人',
    description: '累计获得贡献值',
    type: 'weekly',
    difficulty: 'normal',
    requirements: [
      { type: 'gain_contribution' as TaskRequirementType, count: 1000, description: '获得1000贡献值' }
    ],
    rewards: {
      reputation: 400,
      contribution: 500,
      experience: 300,
      message: '贡献达人！势力因你而强！'
    },
    cooldown: 604800000,
  },
  
  // ========== 特殊任务（一次性）==========
  {
    id: 'faction_special_breakthrough',
    name: '突破瓶颈',
    description: '完成一次境界突破',
    type: 'special',
    difficulty: 'hard',
    requirements: [
      { type: 'breakthrough' as TaskRequirementType, count: 1, description: '完成1次突破' }
    ],
    rewards: {
      reputation: 300,
      contribution: 150,
      experience: 200,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
        { item: breakthroughItems[1], quantity: 1 },
      ],
      message: '突破成功！实力大增！'
    },
    cooldown: 0, // 一次性任务
  },
  {
    id: 'faction_special_technique_collector',
    name: '功法收藏家',
    description: '收集多种功法',
    type: 'special',
    difficulty: 'normal',
    requirements: [
      { type: 'collect_technique' as TaskRequirementType, count: 5, description: '收集5种功法' }
    ],
    rewards: {
      reputation: 250,
      contribution: 150,
      experience: 150,
      message: '功法收藏家！博学多才！'
    },
    cooldown: 0,
  },
  {
    id: 'faction_special_equipment_collector',
    name: '装备收藏家',
    description: '收集多种装备',
    type: 'special',
    difficulty: 'normal',
    requirements: [
      { type: 'collect_equipment' as TaskRequirementType, count: 5, description: '收集5种装备' }
    ],
    rewards: {
      reputation: 250,
      contribution: 150,
      experience: 150,
      message: '装备收藏家！宝库丰富！'
    },
    cooldown: 0,
  },
];

// ============================================
// 便捷函数
// ============================================

/**
 * 获取日常任务
 */
export function getDailyTasks(): TaskDefinition[] {
  return FACTION_TASKS.filter(t => t.type === 'daily');
}

/**
 * 获取周常任务
 */
export function getWeeklyTasks(): TaskDefinition[] {
  return FACTION_TASKS.filter(t => t.type === 'weekly');
}

/**
 * 获取特殊任务
 */
export function getSpecialTasks(): TaskDefinition[] {
  return FACTION_TASKS.filter(t => t.type === 'special');
}

/**
 * 根据ID获取任务
 */
export function getTaskById(taskId: string): TaskDefinition | undefined {
  return FACTION_TASKS.find(t => t.id === taskId);
}

/**
 * 获取任务奖励
 */
export function getTaskRewards(taskId: string): TaskReward | null {
  const task = getTaskById(taskId);
  if (!task) return null;
  
  return task.rewards;
}

/**
 * 检查任务是否可用（等级限制等）
 */
export function isTaskAvailable(
  taskId: string,
  playerLevel: number,
  completedTaskIds: string[],
  activeTaskIds: string[]
): boolean {
  const task = getTaskById(taskId);
  if (!task) return false;
  
  // 检查等级限制
  if (task.minLevel && playerLevel < task.minLevel) return false;
  if (task.maxLevel && playerLevel > task.maxLevel) return false;
  
  // 检查是否已接取
  if (activeTaskIds.includes(taskId)) return false;
  
  // 特殊任务只能完成一次
  if (task.type === 'special' && completedTaskIds.includes(taskId)) return false;
  
  return true;
}

/**
 * 获取可接取的任务列表
 */
export function getAvailableTasks(
  playerLevel: number,
  completedTaskIds: string[],
  activeTaskIds: string[]
): TaskDefinition[] {
  return FACTION_TASKS.filter(task => 
    isTaskAvailable(task.id, playerLevel, completedTaskIds, activeTaskIds)
  );
}

/**
 * 格式化任务进度显示
 */
export function formatTaskProgress(
  requirements: TaskRequirement[],
  progress: Array<{ type: TaskRequirementType; current: number; target: number; isCompleted: boolean }>
): string {
  const lines: string[] = [];
  
  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const prog = progress[i];
    const status = prog.isCompleted ? '✓' : `${prog.current}/${prog.target}`;
    lines.push(`  ${status} ${req.description}`);
  }
  
  return lines.join('\n');
}
