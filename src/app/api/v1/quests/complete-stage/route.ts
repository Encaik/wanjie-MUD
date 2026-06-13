/**
 * POST /api/v1/quests/complete-stage — 提交任务阶段完成
 *
 * Body: { questId: string, completionKey: string, questState: QuestState }
 * Response: { questState: QuestState, completed: boolean, rewards?: RewardResult }
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import {
  completeStage,
  completeQuest,
  checkStageCompletion,
} from '@/modules/quest/logic/questEngine';
import { mergeRewards } from '@/modules/quest/logic/rewardDistributor';
import type { QuestState, QuestReward } from '@/core/types';

const log = createLogger('Quests');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questId, completionKey, questState } = body as {
      questId: string;
      completionKey: string;
      questState: QuestState;
    };

    if (!questId || !completionKey || !questState) {
      return apiError(400, '缺少必要参数: questId, completionKey, questState');
    }

    const quest = QuestRegistry.getInstance().getById(questId);
    if (!quest) {
      return apiError(404, `任务 "${questId}" 不存在`);
    }

    const active = questState.activeQuests[questId];
    if (!active) {
      return apiError(400, `任务 "${questId}" 不在活跃列表中`);
    }

    const stage = quest.stages.find(s => s.id === active.currentStageId);
    if (!stage) {
      return apiError(400, `任务 "${questId}" 当前阶段 "${active.currentStageId}" 不存在`);
    }

    // 检查该阶段是否所有目标已完成
    if (!checkStageCompletion(stage, active)) {
      return apiError(400, '当前阶段目标未全部完成');
    }

    const { activeQuest, completed } = completeStage(quest, active, completionKey);

    // 收集阶段奖励
    const completion = stage.completions[completionKey];
    const stageRewards = completion?.stageRewards ?? [];
    let allRewards: QuestReward[] = [...stageRewards];

    let newQuestState: QuestState;
    if (completed) {
      // 任务完成，追加最终奖励
      allRewards = [...allRewards, ...quest.rewards];
      newQuestState = completeQuest(questId, {
        ...questState,
        activeQuests: { ...questState.activeQuests, [questId]: activeQuest },
      });
    } else {
      newQuestState = {
        ...questState,
        activeQuests: { ...questState.activeQuests, [questId]: activeQuest },
      };
    }

    const rewardResult = mergeRewards(allRewards);

    return apiSuccess({
      questState: newQuestState,
      completed,
      rewards: rewardResult,
    });
  } catch (err) {
    log.error('提交任务阶段失败:', err);
    return apiError(500, '提交任务阶段失败');
  }
}
