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

import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { createLogger } from '@/core/logger';
import { WorldDataRegistry } from '@/core/registry';
import { generateWorld } from '@/core/world';

import { generateDetailsForSeed } from '../generator';

/** 日志实例 */
const log = createLogger('Details Generate');

interface DetailsRequest {
  seed: string;
  /** 世界观 ID（可选，指定后使用新生成管线） */
  worldviewId?: string;
}

export async function POST(request: NextRequest) {
  try {
    ensureWorldSystemInitialized();
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
    // 如果指定了 worldviewId，使用新的 generateWorld（完整生成）
    if (body.worldviewId) {
      const registry = WorldDataRegistry.getInstance();
      const worldview = registry.getWorldview(body.worldviewId);
      if (!worldview) {
        return apiError(400, `世界观 '${body.worldviewId}' 未注册`);
      }
      const world = generateWorld(worldview, body.seed, 0);
      return apiSuccess({ world, generatedAt: new Date().toISOString() }, '世界详情已生成');
    }

    // 回退到旧管线
    const world = generateDetailsForSeed(body.seed);

    if (!world) {
      return apiError(404, `世界 "${body.seed}" 不存在，请先生成基础信息`);
    }

    return apiSuccess({ world, generatedAt: new Date().toISOString() }, '世界详情已生成');
  } catch (err) {
    log.error('失败:', err);
    return apiError(500, `详情生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
