/**
 * GET /api/v1/characters — 按世界 seed 查询角色
 * POST /api/v1/characters — 保存角色（使用 /save）
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { getCharactersByWorldSeed } from './store';

const log = createLogger('Characters');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const worldSeed = searchParams.get('worldSeed');

  if (!worldSeed) {
    return apiError(400, '缺少 worldSeed 参数');
  }

  try {
    const characters = getCharactersByWorldSeed(worldSeed);
    return apiSuccess({ characters, total: characters.length });
  } catch (err) {
    log.error('查询角色失败:', err);
    return apiError(500, '查询角色失败');
  }
}
