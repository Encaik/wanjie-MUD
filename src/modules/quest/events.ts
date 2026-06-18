/**
 * 任务模块事件订阅 + 消息模板注册
 *
 * 注册 quest:completed、quest:claimed 事件的消息模板，
 * 提供板块初始化和刷新的入口。
 *
 * @module modules/quest
 */

import type { MessageTemplate } from '@/core/message-log';
import { BoardRegistry } from '@/core/registry/BoardRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import { StoryLineRegistry } from '@/core/registry/StoryLineRegistry';

import { TUTORIAL_STORYLINE, DEFAULT_BOARDS, TUTORIAL_QUEST_DEFINITIONS } from './data';

// ============================================
// 初始化
// ============================================

/** 注册内置故事线、板块和任务 */
export function initQuestRegistries(): void {
  // 注册教程任务定义
  const questRegistry = QuestRegistry.getInstance();
  for (const quest of TUTORIAL_QUEST_DEFINITIONS) {
    if (!questRegistry.getById(quest.id)) {
      questRegistry.register(quest);
    }
  }

  // 注册教程故事线
  const storyRegistry = StoryLineRegistry.getInstance();
  if (!storyRegistry.getById(TUTORIAL_STORYLINE.id)) {
    storyRegistry.register(TUTORIAL_STORYLINE);
  }

  // 注册默认板块
  const boardRegistry = BoardRegistry.getInstance();
  for (const board of DEFAULT_BOARDS) {
    if (!boardRegistry.getById(board.id)) {
      boardRegistry.register(board);
    }
  }
}

// ============================================
// 消息模板
// ============================================

/** 任务相关的消息模板 */
export const QUEST_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    eventType: 'quest:completed',
    channel: 'reward',
    level: 'success',
    title: (payload: Record<string, unknown>) =>
      `任务完成: ${payload.questName ?? '未知任务'}`,
    content: () => '请在任务面板领取奖励',
    priority: 10,
  },
  {
    eventType: 'quest:claimed',
    channel: 'reward',
    level: 'success',
    title: (payload: Record<string, unknown>) =>
      `奖励领取: ${payload.questName ?? '未知任务'}`,
    content: (payload: Record<string, unknown>) =>
      (payload.rewardSummary as string) ?? '已领取奖励',
    priority: 10,
  },
  {
    eventType: 'quest:progress',
    channel: 'system',
    level: 'info',
    title: () => '进度更新',
    content: (payload: Record<string, unknown>) =>
      (payload.progressText as string) ?? '任务进度已更新',
    priority: 5,
  },
  {
    eventType: 'quest:stage_completed',
    channel: 'system',
    level: 'info',
    title: (payload: Record<string, unknown>) =>
      `阶段完成: ${payload.stageName ?? ''}`,
    content: () => '任务阶段已推进',
    priority: 5,
  },
];
