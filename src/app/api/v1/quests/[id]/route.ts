/**
 * GET /api/v1/quests/[id] — 获取单个任务完整定义
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { QuestRegistry } from '@/core/registry/QuestRegistry';

const log = createLogger('Quests');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const quest = QuestRegistry.getInstance().getById(id);
    if (!quest) {
      return apiError(404, `任务 "${id}" 不存在`);
    }
    // 返回摘要信息（stage 详情仅返回前几个字段，避免暴露完整设计）
    return apiSuccess({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      type: quest.type,
      prerequisites: quest.prerequisites,
      stageCount: quest.stages.length,
      repeatable: quest.repeatable,
      cooldownSeconds: quest.cooldownSeconds,
      rewards: quest.rewards,
    });
  } catch (err) {
    log.error('查询任务详情失败:', err);
    return apiError(500, '查询任务详情失败');
  }
}
