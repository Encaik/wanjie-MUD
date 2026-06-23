/**
 * GET  /api/v1/quests?worldviewId=X — 查询世界观下所有任务摘要
 * POST /api/v1/quests/start — 接取任务
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { QuestRegistry } from '@/core/registry/QuestRegistry';

const log = createLogger('Quests');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const worldviewId = searchParams.get('worldviewId');

  try {
    const registry = QuestRegistry.getInstance();
    const quests = worldviewId
      ? registry.getByWorldview(worldviewId)
      : registry.getAll();

    const summaries = quests.map(q => ({
      id: q.id,
      name: q.name,
      description: q.description,
      type: q.type,
      stageCount: q.stages.length,
      repeatable: q.repeatable,
    }));

    return apiSuccess({ quests: summaries, total: summaries.length });
  } catch (err) {
    log.error('查询任务列表失败:', err);
    return apiError(500, '查询任务列表失败');
  }
}
