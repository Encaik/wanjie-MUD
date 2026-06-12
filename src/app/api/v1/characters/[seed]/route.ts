/**
 * GET /api/v1/characters/[seed] — 按 seed 获取单个角色
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { getCharacterBySeed } from '../store';

const log = createLogger('Character By Seed');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seed: string }> },
) {
  const { seed } = await params;

  if (!seed) {
    return apiError(400, '缺少 seed 参数');
  }

  try {
    const character = getCharacterBySeed(seed);
    if (!character) {
      return apiError(404, `角色 "${seed}" 未找到`);
    }
    return apiSuccess({ character });
  } catch (err) {
    log.error('查询角色失败:', err);
    return apiError(500, '查询角色失败');
  }
}
