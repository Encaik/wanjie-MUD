/**
 * 新手任务系统
 * 
 * 为新手玩家提供游戏入门指引
 * 特点：
 * - 线性任务链，按顺序完成
 * - 每个任务奖励下一阶段所需材料
 * - 完成所有任务后显示庆祝弹窗
 */

import { 
  spiritStoneItems, 
  cultivationPillItems, 
  breakthroughItems,
  restorePillItems 
} from '../utils/items';
import { Protagonist, GameStatistics, createInventoryItem, ItemDefinition } from '../types';
import {
  TaskSystemType,
  TaskSystemState,
  TaskProgressResult,
  TaskItemReward,
  TaskReward,
  BaseTask,
  ITaskSystem,
  checkTasksProgress,
  checkNewlyCompletedTask as checkNewlyCompletedTaskGeneric,
  createDefaultTaskSystemState,
} from './types';

// ============================================
// 新手任务定义
// ============================================

/**
 * 新手任务接口
 */
export interface TutorialTask extends BaseTask {
  id: string;
  name: string;
  // title 兼容旧代码，等同于 name
  title: string;
  description: string;
  hint: string;
  reward: TaskReward;
  check: (protagonist: Protagonist, statistics: GameStatistics) => boolean;
}

/**
 * 新手任务列表
 * 任务顺序：修炼 -> 使用丹药 -> 战斗 -> 升级 -> 加入势力 -> Boss战 -> 成就
 */
export const TUTORIAL_TASKS: TutorialTask[] = [
  {
    id: 'tutorial_first_cultivation',
    name: '初次修炼',
    title: '初次修炼',
    description: '在修炼界面进行一次修炼',
    hint: '点击"修炼"按钮，消耗灵石提升修为。你已经有了初始的聚气丹，可以先使用再修炼效果更佳！',
    reward: {
      spiritStones: 50,
      experience: 20,
      items: [
        { item: restorePillItems[0], quantity: 3 },
      ],
      message: '完成初次修炼！获得回春丹，可在战斗中恢复生命值。'
    },
    check: (p, stats) => stats.totalCultivations > 0
  },
  {
    id: 'tutorial_use_item',
    name: '炼丹初探',
    title: '炼丹初探',
    description: '使用一次丹药',
    hint: '在背包中使用聚气丹或筑基丹，可以获得修炼或突破加成。建议在修炼前使用聚气丹！',
    reward: {
      spiritStones: 50,
      experience: 10,
      items: [
        { item: breakthroughItems[0], quantity: 1 },
        { item: cultivationPillItems[1], quantity: 1 },
      ],
      message: '学会使用丹药！获得了更好的修炼丹药和突破丹药。'
    },
    check: (p, stats) => stats.totalItemsUsed > 0,
    prerequisiteIds: ['tutorial_first_cultivation']
  },
  {
    id: 'tutorial_first_battle',
    name: '初露锋芒',
    title: '初露锋芒',
    description: '进入机缘并击败一个敌人',
    hint: '前往"机缘"界面，选择一个低难度的秘境探索。你已经有了初始功法和武器，可以战斗了！战斗中注意使用回春丹恢复生命。',
    reward: {
      spiritStones: 100,
      experience: 30,
      items: [
        { item: cultivationPillItems[0], quantity: 3 },
        { item: breakthroughItems[0], quantity: 1 },
        { item: restorePillItems[0], quantity: 2 },
      ],
      message: '完成首次战斗！获得了修炼丹药和突破丹药。'
    },
    check: (p, stats) => stats.totalEnemiesKilled > 0,
    prerequisiteIds: ['tutorial_use_item']
  },
  {
    id: 'tutorial_reach_level_3',
    name: '小有所成',
    title: '小有所成',
    description: '将等级提升到3级',
    hint: '通过修炼和战斗积累经验，当经验满后再次修炼可尝试突破境界。使用筑基丹可以提高突破成功率！',
    reward: {
      spiritStones: 200,
      experience: 50,
      items: [
        { item: cultivationPillItems[1], quantity: 3 },
        { item: breakthroughItems[0], quantity: 2 },
        { item: restorePillItems[0], quantity: 10 },
        { item: restorePillItems[1], quantity: 2 },
      ],
      message: '达到3级！获得了大量修炼资源和恢复丹药，准备好挑战Boss了！'
    },
    check: (p, stats) => p.level >= 3,
    prerequisiteIds: ['tutorial_first_battle']
  },
  {
    id: 'tutorial_join_faction',
    name: '投身势力',
    title: '投身势力',
    description: '加入一个势力',
    hint: '前往"势力"界面，选择一个感兴趣的势力加入。势力可以提供日常任务、贡献奖励和职位晋升！',
    reward: {
      spiritStones: 150,
      experience: 40,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
        { item: restorePillItems[0], quantity: 5 },
      ],
      message: '加入势力！现在可以完成势力任务获取贡献和声望。'
    },
    check: (p, stats) => stats.factionJoined === true,
    prerequisiteIds: ['tutorial_reach_level_3']
  },
  {
    id: 'tutorial_complete_dungeon',
    name: '探险家',
    title: '探险家',
    description: '完成一次机缘探索（击败Boss）',
    hint: '在机缘中探索到最终Boss并击败它，可以获得丰厚的奖励。Boss战前确保状态良好！',
    reward: {
      spiritStones: 300,
      experience: 100,
      items: [
        { item: cultivationPillItems[1], quantity: 3 },
        { item: breakthroughItems[1], quantity: 1 },
        { item: restorePillItems[1], quantity: 2 },
      ],
      message: '完成首次机缘！已掌握基本的探险技巧，获得了高级资源。'
    },
    check: (p, stats) => stats.totalAdventuresCompleted > 0,
    prerequisiteIds: ['tutorial_join_faction']
  },
  {
    id: 'tutorial_claim_achievement',
    name: '成就解锁',
    title: '成就解锁',
    description: '领取一个成就奖励',
    hint: '前往"成就"界面，查看已解锁的成就并领取奖励。成就奖励可以提供大量经验和稀有物品！',
    reward: {
      spiritStones: 200,
      experience: 80,
      items: [
        { item: cultivationPillItems[1], quantity: 2 },
        { item: breakthroughItems[0], quantity: 2 },
      ],
      message: '领取首个成就奖励！继续探索游戏，解锁更多成就获得丰厚奖励。'
    },
    check: (p, stats) => stats.achievementRewardsClaimed > 0,
    prerequisiteIds: ['tutorial_complete_dungeon']
  },
];

// ============================================
// 新手任务系统实现
// ============================================

/**
 * 新手任务系统
 */
export const tutorialTaskSystem: ITaskSystem<TutorialTask> = {
  systemType: 'tutorial' as TaskSystemType,
  tasks: TUTORIAL_TASKS,

  checkProgress(
    protagonist: Protagonist,
    statistics: GameStatistics,
    state: TaskSystemState
  ): TaskProgressResult {
    return checkTasksProgress(
      TUTORIAL_TASKS,
      state.completedTaskIds,
      protagonist,
      statistics
    );
  },

  checkNewlyCompleted(
    state: TaskSystemState,
    protagonist: Protagonist,
    statistics: GameStatistics
  ): { taskId: string; task: TutorialTask } | null {
    return checkNewlyCompletedTaskGeneric(
      TUTORIAL_TASKS,
      state,
      protagonist,
      statistics
    );
  },

  getRewards(taskId: string): TaskReward | null {
    const task = TUTORIAL_TASKS.find(t => t.id === taskId);
    return task ? task.reward : null;
  },

  isNewbie(
    protagonist: Protagonist,
    statistics: GameStatistics,
    state: TaskSystemState
  ): boolean {
    const { progress } = this.checkProgress!(protagonist, statistics, state);
    return progress < 1;
  },
};

// ============================================
// 便捷函数（兼容旧代码）
// ============================================

/**
 * 检查新手任务进度（兼容函数）
 */
export function checkTutorialProgress(
  protagonist: Protagonist,
  statistics: GameStatistics,
  persistedCompletedTasks: string[] = []
): {
  completedTasks: string[];
  currentTask: TutorialTask | null;
  progress: number;
} {
  const state: TaskSystemState = {
    systemType: 'tutorial',
    completedTaskIds: persistedCompletedTasks,
    claimedTaskIds: [],
  };
  
  const result = tutorialTaskSystem.checkProgress(protagonist, statistics, state);
  
  return {
    completedTasks: result.completedTaskIds,
    currentTask: result.currentTask as TutorialTask | null,
    progress: result.progress,
  };
}

/**
 * 检查是否为新手
 */
export function isNewbie(
  protagonist: Protagonist,
  statistics: GameStatistics,
  persistedCompletedTasks: string[] = []
): boolean {
  const state: TaskSystemState = {
    systemType: 'tutorial',
    completedTaskIds: persistedCompletedTasks,
    claimedTaskIds: [],
  };
  
  return tutorialTaskSystem.isNewbie!(protagonist, statistics, state);
}

/**
 * 检查新完成的任务
 */
export function checkNewlyCompletedTask(
  persistedCompletedTasks: string[],
  protagonist: Protagonist,
  statistics: GameStatistics
): { taskId: string; task: TutorialTask } | null {
  const state: TaskSystemState = {
    systemType: 'tutorial',
    completedTaskIds: persistedCompletedTasks,
    claimedTaskIds: [],
  };
  
  return tutorialTaskSystem.checkNewlyCompleted(state, protagonist, statistics);
}

/**
 * 获取任务奖励
 */
export function getTaskRewards(taskId: string): {
  spiritStones: number;
  experience: number;
  items: TaskItemReward[];
} | null {
  const reward = tutorialTaskSystem.getRewards(taskId);
  if (!reward) return null;
  
  return {
    spiritStones: reward.spiritStones || 0,
    experience: reward.experience || 0,
    items: reward.items || [],
  };
}

/**
 * 获取新手欢迎消息
 */
export function getTutorialWelcomeMessage(): string {
  return `欢迎来到修仙世界！

【新手引导】
作为初入修行的凡人，你获得了宗门赠送的新手物资：
- 500 灵石（修炼消耗）
- 5 颗聚气丹（提升修炼效果）
- 2 颗筑基丹（提升突破成功率）
- 初始攻击功法（已自动装备）
- 初始武器（已自动装备）

【新手保护】
等级 1-8 的玩家战斗失败不会损失灵石，请放心探索！

【建议流程】
1. 先使用聚气丹，再进行修炼，效果更好
2. 完成修炼任务后会获得回春丹
3. 进入机缘击败敌人，获得更多资源
4. 达到3级后会获得大量恢复丹药
5. 加入势力，完成势力任务获取贡献
6. 准备好后挑战Boss
7. 别忘了领取成就奖励！

祝你修行顺利！`;
}

/**
 * 领取新手任务奖励（用于手动领取场景）
 */
export function claimTutorialReward(
  taskId: string,
  protagonist: Protagonist,
  statistics: GameStatistics
): {
  success: boolean;
  message: string;
  rewards?: {
    spiritStones: number;
    experience: number;
    items: { id: string; definition: ItemDefinition; quantity: number }[];
  };
} {
  const task = TUTORIAL_TASKS.find(t => t.id === taskId);
  
  if (!task) {
    return { success: false, message: '任务不存在' };
  }
  
  if (!task.check(protagonist, statistics)) {
    return { success: false, message: '任务尚未完成' };
  }
  
  const items = task.reward.items?.map((r, i) => ({
    id: `inv_${Date.now()}_${i}`,
    definition: r.item,
    quantity: r.quantity,
  })) || [];
  
  return {
    success: true,
    message: task.reward.message,
    rewards: {
      spiritStones: task.reward.spiritStones || 0,
      experience: task.reward.experience || 0,
      items,
    },
  };
}
