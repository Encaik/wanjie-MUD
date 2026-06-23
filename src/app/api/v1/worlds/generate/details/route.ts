/**
 * POST /api/v1/worlds/generate/details
 *
 * 对已有世界补全详细信息（势力、危险、机缘）。
 * 仅接受单个 seed，若该 world 不存在则报错，存在就生成详情并更新 DB。
 *
 * 支持 worldviewId 参数以使用新的生成管线。
 *
 * @example
 * POST /api/v1/worlds/generate/details  { seed: "a0b1c2d3" }
 * POST /api/v1/worlds/generate/details  { seed: "a0b1c2d3", worldviewId: "cultivation" }
 */

import { NextRequest } from 'next/server';

import { ensureWorldSystemInitialized } from '@/app/api/init';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry';
import { generateWorldDetails } from '@/core/world';

import { getWorldById, saveWorld } from '../../store';

/** 日志实例 */
const log = createLogger('Details Generate');

interface DetailsRequest {
  seed: string;
  /** 世界观 ID（可选，指定后使用新生成管线） */
  worldviewId?: string;
}

export async function POST(request: NextRequest) {
  try {
    await ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  let body: DetailsRequest;
  try {
    body = (await request.json()) as DetailsRequest;
  } catch {
    return apiError(400, '请求体格式错误，需要 JSON');
  }

  if (!body.seed) {
    return apiError(400, '缺少 seed 参数');
  }

  try {
    if (body.worldviewId) {
      // 新管线：在已有基础世界上生成详情
      const registry = WorldViewRegistry.getInstance();
      const worldview = registry.get(body.worldviewId);
      if (!worldview) {
        return apiError(400, `世界观 '${body.worldviewId}' 未注册`);
      }

      // 查 DB 确认基础世界已存在
      const existing = getWorldById(body.seed);
      if (!existing) {
        return apiError(404, `世界 "${body.seed}" 不存在，请先生成基础信息`);
      }

      // 生成详情字段并合并到基础世界
      const details = generateWorldDetails(worldview, body.seed);
      const world: typeof existing = {
        ...existing,
        factions: details.factions,
        majorForces: details.majorForces,
        dangers: details.dangers,
        opportunities: details.opportunities,
      };

      saveWorld(world);
      return apiSuccess({ world, generatedAt: new Date().toISOString() }, '世界详情已生成');
    }

    // 未指定 worldviewId：使用已存储的世界数据直接返回（若已包含详情）
    const existing = getWorldById(body.seed);
    if (!existing) {
      return apiError(404, `世界 "${body.seed}" 不存在，请先生成基础信息`);
    }
    return apiSuccess({ world: existing, generatedAt: new Date().toISOString() }, '世界详情已存在');
  } catch (err) {
    log.error('失败:', err);
    return apiError(500, `详情生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
