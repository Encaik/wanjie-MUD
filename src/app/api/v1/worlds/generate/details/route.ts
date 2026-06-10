/**
 * POST /api/v1/worlds/generate/details
 *
 * 对已有基础世界补全详细信息（势力、危险、机缘）。
 * 仅接受单个 seed，若该 world 不存在则报错，存在就生成详情并更新 DB。
 *
 * @example
 * POST /api/v1/worlds/generate/details  { seed: "a0b1c2d3" }
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { generateDetailsForSeed } from '../generator';

interface DetailsRequest {
  seed: string;
}

export async function POST(request: NextRequest) {
  try {
    ensureWorldSystemInitialized();
  } catch (err) {
    console.error('[Details Generate] 初始化失败:', err);
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
    const world = generateDetailsForSeed(body.seed);

    if (!world) {
      return apiError(404, `世界 "${body.seed}" 不存在，请先生成基础信息`);
    }

    return apiSuccess({ world, generatedAt: new Date().toISOString() }, '世界详情已生成');
  } catch (err) {
    console.error('[Details Generate] 失败:', err);
    return apiError(500, `详情生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
