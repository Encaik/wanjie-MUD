/**
 * 新手引导故事线
 *
 * 将原有的 TUTORIAL_GUIDE 中的 phase/step 结构映射为 StoryLine + StoryNode。
 * 5 阶段 9 步骤，事件驱动，手动领奖。
 *
 * @module modules/quest/data
 */

import type { StoryLine, StoryNode } from '@/core/types';

/** 新手引导的 quest_ref 节点（每个原 step 映射为一个任务节点） */
const tutorialQuestNodes: StoryNode[] = [
  // 阶段 0: 初入仙途
  {
    id: 'tnode_welcome',
    name: '欢迎来到万界',
    type: 'quest_ref',
    order: 1,
    description: '踏入万界修行路，领取初始物资',
    questId: 'tutorial_welcome',
  },
  // 阶段 1: 初识修炼
  {
    id: 'tnode_use_pill',
    name: '使用聚气丹',
    type: 'quest_ref',
    order: 2,
    description: '在背包中使用一颗聚气丹',
    questId: 'tutorial_use_pill',
  },
  {
    id: 'tnode_first_cultivation',
    name: '进行一次修炼',
    type: 'quest_ref',
    order: 3,
    description: '在修炼界面进行一次修炼',
    questId: 'tutorial_first_cultivation',
  },
  // 阶段 2: 初露锋芒
  {
    id: 'tnode_enter_adventure',
    name: '进入机缘探索',
    type: 'quest_ref',
    order: 4,
    description: '前往机缘界面选择探索',
    questId: 'tutorial_enter_adventure',
  },
  {
    id: 'tnode_first_kill',
    name: '击败第一个敌人',
    type: 'quest_ref',
    order: 5,
    description: '在机缘中击败任意敌人',
    questId: 'tutorial_first_kill',
  },
  // 阶段 3: 融入世界
  {
    id: 'tnode_reach_level_3',
    name: '提升至 3 级',
    type: 'quest_ref',
    order: 6,
    description: '通过修炼和战斗将等级提升到 3 级',
    questId: 'tutorial_reach_level_3',
    unlockCondition: { type: 'level', target: '3' },
  },
  {
    id: 'tnode_join_faction',
    name: '加入一个势力',
    type: 'quest_ref',
    order: 7,
    description: '在势力界面选择一个势力加入',
    questId: 'tutorial_join_faction',
  },
  // 阶段 4: 登堂入室
  {
    id: 'tnode_complete_adventure',
    name: '完成一次机缘探索',
    type: 'quest_ref',
    order: 8,
    description: '击败机缘探索的 Boss 完成探索',
    questId: 'tutorial_complete_adventure',
  },
  {
    id: 'tnode_claim_achievement',
    name: '领取成就奖励',
    type: 'quest_ref',
    order: 9,
    description: '在成就界面领取一个已完成的成就奖励',
    questId: 'tutorial_claim_achievement',
  },
];

/** 教程阶段节点 */
const tutorialPhases: StoryNode[] = [
  {
    id: 'phase_0_starter',
    name: '初入仙途',
    type: 'phase',
    order: 0,
    description: '踏入修行世界，领取初始修炼物资',
    children: [tutorialQuestNodes[0]],
  },
  {
    id: 'phase_1_cultivation',
    name: '初识修炼',
    type: 'phase',
    order: 1,
    description: '学习丹药使用和修炼基础',
    children: [tutorialQuestNodes[1], tutorialQuestNodes[2]],
  },
  {
    id: 'phase_2_combat',
    name: '初露锋芒',
    type: 'phase',
    order: 2,
    description: '学习机缘探索和战斗基础',
    children: [tutorialQuestNodes[3], tutorialQuestNodes[4]],
  },
  {
    id: 'phase_3_social',
    name: '融入世界',
    type: 'phase',
    order: 3,
    description: '提升实力并加入势力',
    children: [tutorialQuestNodes[5], tutorialQuestNodes[6]],
  },
  {
    id: 'phase_4_advanced',
    name: '登堂入室',
    type: 'phase',
    order: 4,
    description: '掌握进阶玩法',
    children: [tutorialQuestNodes[7], tutorialQuestNodes[8]],
  },
];

/** 新手引导故事线 */
export const TUTORIAL_STORYLINE: StoryLine = {
  id: 'storyline_tutorial',
  name: '新手引导',
  type: 'tutorial',
  description: '5 阶段 9 步骤的事件驱动引导流程，帮助新玩家熟悉游戏核心系统。',
  rootNodes: tutorialPhases,
};
