/**
 * 通用任务进度追踪器
 *
 * 替换旧的教程专用进度追踪（依赖 tutorialGuide.ts/TutorialState），
 * 改为通过 QuestState + StoryLine 通用引擎计算进度。
 *
 * 不再导出教程专用类型（TutorialState、TutorialProgressResult 等），
 * 所有查询通过 storyEngine 和 QuestTemplateRegistry 完成。
 *
 * @module modules/quest/logic
 */

import type { QuestState, Protagonist } from '@/core/types';
import { StoryLineRegistry } from '@/core/registry/StoryLineRegistry';
import { QuestTemplateRegistry } from '@/core/registry/QuestTemplateRegistry';
import { getStoryProgress } from './storyEngine';
import type { StoryProgress } from './storyEngine';

// ============================================
// 通用进度查询
// ============================================

/**
 * 获取故事线的通用进度信息
 *
 * 替代旧的 getTutorialProgressInfo()。
 * 通过故事线 ID 查询进度，不区分教程/主线/支线。
 *
 * @param storylineId - 故事线 ID（如 'storyline_tutorial'）
 * @param questState - 任务状态
 * @returns 故事线进度，如果故事线不存在则返回 null
 */
export function getQuestProgress(
  storylineId: string,
  questState: QuestState,
): StoryProgress | null {
  const storyline = StoryLineRegistry.getInstance().getById(storylineId);
  if (!storyline) return null;
  return getStoryProgress(storyline, questState);
}

/**
 * 检查指定故事线是否全部完成
 *
 * 替代旧的 isNewbie() 检查（教程未完成 = 新手）。
 *
 * @param storylineId - 故事线 ID
 * @param questState - 任务状态
 * @returns 是否全部完成
 */
export function isStorylineCompleted(
  storylineId: string,
  questState: QuestState,
): boolean {
  const progress = getQuestProgress(storylineId, questState);
  return progress?.allCompleted ?? false;
}

// ============================================
// 旧角色兼容
// ============================================

/**
 * 检测旧存档角色是否已有初始物品（用于跳过教程阶段 0）
 *
 * @param protagonist - 主角数据
 * @returns 是否应跳过初始阶段
 */
export function shouldSkipInitialTutorialPhase(protagonist: Protagonist): boolean {
  const items = protagonist.items ?? [];
  const starterItemIds = [
    'wanjie:common:spirit_stone',
    'wanjie-core:cultivation:qi_gathering_pill',
    'wanjie-core:cultivation:foundation_pill',
    'wanjie:common:rejuvenation_pill',
  ];
  const foundCount = starterItemIds.filter(id =>
    items.some(i => i.templateId === id),
  ).length;
  return foundCount >= 2;
}

// ============================================
// 教程欢迎消息（数据驱动）
// ============================================

/**
 * 获取教程欢迎消息
 *
 * 从 QuestTemplateRegistry 获取 'tutorial_welcome' 模板的 acceptDialog 文本。
 * 替代旧的 getTutorialWelcomeMessage() 硬编码函数。
 *
 * @returns 欢迎消息文本，如果模板不存在则返回默认消息
 */
export function getTutorialWelcomeMessage(): string {
  const template = QuestTemplateRegistry.getInstance().get('tutorial_welcome');
  if (template?.acceptDialog?.[0]?.content) {
    return template.acceptDialog[0].content;
  }
  return '欢迎来到修行世界！';
}
