/**
 * 默认任务板块
 *
 * 内置 4 个板块：新手引导、主线、日常、周常。
 * 势力板块由 faction 模块动态注册。
 *
 * @module modules/quest/data
 */

import type { QuestBoard } from '@/core/types';

/** 新手引导板块 */
export const BOARD_TUTORIAL: QuestBoard = {
  id: 'board_tutorial',
  name: '新手引导',
  category: 'tutorial',
  description: '初入修行世界，跟随引导逐步掌握核心玩法',
  refreshRule: { type: 'never' },
  slotCount: 1,
  questPool: [
    'tutorial_welcome',
    'tutorial_use_pill',
    'tutorial_first_cultivation',
    'tutorial_enter_adventure',
    'tutorial_first_kill',
    'tutorial_reach_level_3',
    'tutorial_join_faction',
    'tutorial_complete_adventure',
    'tutorial_claim_achievement',
  ],
  randomPick: false,
};

/** 主线任务板块 */
export const BOARD_MAIN_STORY: QuestBoard = {
  id: 'board_main_story',
  name: '主线剧情',
  category: 'main_story',
  description: '跟随主线剧情，探索万界的秘密',
  refreshRule: { type: 'never' },
  slotCount: 5,
  questPool: [],
  randomPick: false,
  unlockConditions: [
    { type: 'quest_completed', target: 'tutorial_claim_achievement' },
  ],
};

/** 每日任务板块 */
export const BOARD_DAILY: QuestBoard = {
  id: 'board_daily',
  name: '日常任务',
  category: 'daily',
  description: '每日刷新，完成可获得丰厚奖励',
  refreshRule: { type: 'daily', resetHour: 0 },
  slotCount: 3,
  questPool: [],
  randomPick: true,
  unlockConditions: [
    { type: 'quest_completed', target: 'tutorial_first_cultivation' },
  ],
};

/** 周常任务板块 */
export const BOARD_WEEKLY: QuestBoard = {
  id: 'board_weekly',
  name: '周常任务',
  category: 'weekly',
  description: '每周刷新，高难度挑战等你来战',
  refreshRule: { type: 'weekly', resetDay: 1 },
  slotCount: 5,
  questPool: [],
  randomPick: true,
  unlockConditions: [
    { type: 'quest_completed', target: 'tutorial_claim_achievement' },
  ],
};

/** 所有内置板块 */
export const DEFAULT_BOARDS: QuestBoard[] = [
  BOARD_TUTORIAL,
  BOARD_MAIN_STORY,
  BOARD_DAILY,
  BOARD_WEEKLY,
];
