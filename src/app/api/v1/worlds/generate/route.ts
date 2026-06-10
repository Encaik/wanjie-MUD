/**
 * POST /api/v1/worlds/generate
 *
 * 统一世界生成接口。全部以 seed 驱动，world.id === seed。
 * 相同 seed 永远生成相同的世界（确定性）。
 *
 * @example
 * POST /api/v1/worlds/generate  { seed: "abc123", worldType: "修仙" }
 * POST /api/v1/worlds/generate  { count: 4 }
 * POST /api/v1/worlds/generate  {}
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { generateWorldSeed } from '@/modules/identity/logic/generators';
import { generateAndSave } from './generator';
import type { World } from '@/core/types';

interface GenerateRequest {
  seed?: string;
  worldType?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    ensureWorldSystemInitialized();
  } catch (err) {
    console.error('[Generate] 初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return apiError(400, '请求体格式错误');
  }

  try {
    if (body.seed) {
      const count = Math.min(Math.max(body.count ?? 1, 1), 10);
      const worlds: World[] = [];
      for (let i = 0; i < count; i++) {
        const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
        worlds.push(generateAndSave(uniqueSeed, body.worldType));
      }
      return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `返回 ${worlds.length} 个世界`);
    }

    const count = Math.min(Math.max(body.count ?? 1, 1), 10);
    const worlds: World[] = [];
    for (let i = 0; i < count; i++) {
      worlds.push(generateAndSave(generateWorldSeed(), body.worldType));
    }
    return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `生成 ${worlds.length} 个世界`);
  } catch (err) {
    console.error('[Generate] 失败:', err);
    return apiError(500, `世界生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
