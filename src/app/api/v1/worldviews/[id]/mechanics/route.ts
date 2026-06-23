/**
 * GET /api/v1/worldviews/[id]/mechanics
 *
 * 返回指定世界观的机制配置。仅返回 mechanics 数据，
 * 不返回全量 WorldviewDefinition。
 */

import { NextRequest } from 'next/server';

import { ensureWorldSystemInitialized } from '@/app/api/init';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';

const log = createLogger('Mechanics');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  const { id } = await params;
  const registry = WorldMechanicsRegistry.getInstance();

  if (!registry.has(id)) {
    return apiError(404, `世界观 '${id}' 未配置机制`);
  }

  const mechanics = registry.get(id);

  return apiSuccess({
    worldviewId: id,
    mechanics: {
      worldType: mechanics.worldType,
      cultivation: mechanics.getCultivationParams(),
      combat: mechanics.getCombatParams(),
      exploration: mechanics.getExplorationParams(),
      uniqueMechanic: mechanics.getUniqueMechanicDescription(),
    },
  });
}
