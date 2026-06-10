/**
 * /api/v1/worlds
 *
 * GET  — 查询已存储的世界列表（分页）
 * POST — 保存一个世界到持久存储
 *
 * @example
 * // 查询
 * GET /api/v1/worlds?page=1&limit=10
 *
 * // 存储
 * POST /api/v1/worlds  body: World
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import type { World } from '@/core/types';
import {
  saveWorld,
  queryWorlds,
  queryWorldsByType,
  getWorldById,
  deleteWorld,
  saveRating,
  readRatings,
  getWorldCount,
} from './store';

// ============================================
// GET — 查询世界列表
// ============================================

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // 按 ID 查询单个世界
  const worldId = url.searchParams.get('id');
  if (worldId) {
    const world = getWorldById(worldId);
    if (!world) {
      return apiError(404, `世界 "${worldId}" 不存在`);
    }
    return apiSuccess(world);
  }

  // 查询评分数据
  if (action === 'ratings') {
    const ratings = readRatings();
    return apiSuccess(ratings);
  }

  // 查询总数
  if (action === 'count') {
    return apiSuccess({ count: getWorldCount() });
  }

  // 按世界类型筛选
  const worldType = url.searchParams.get('type');

  // 分页查询
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);

  try {
    const result = worldType
      ? queryWorldsByType(worldType, page, limit)
      : queryWorlds(page, limit);
    return apiSuccess(result);
  } catch (err) {
    console.error('[Worlds GET] 查询失败:', err);
    return apiError(500, '世界查询失败');
  }
}

// ============================================
// POST — 保存世界 / 评分
// ============================================

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, '请求体格式错误，需要 JSON');
  }

  // 评分操作
  if (body.action === 'rate') {
    const worldId = body.worldId as string | undefined;
    const score = body.score as number | undefined;
    const comment = body.comment as string | undefined;

    if (!worldId || typeof score !== 'number') {
      return apiError(400, '评分需要 worldId 和 score 字段');
    }
    if (score < 1 || score > 5) {
      return apiError(400, '评分范围为 1-5');
    }

    const rating = saveRating(worldId, score, comment);
    return apiSuccess(rating, '评分已保存');
  }

  // 批量保存
  if (body.action === 'batch') {
    const worlds = body.worlds as World[] | undefined;
    if (!Array.isArray(worlds) || worlds.length === 0) {
      return apiError(400, '批量保存需要 worlds 数组');
    }
    const saved = worlds.map(w => saveWorld(w));
    return apiSuccess({ worlds: saved, count: saved.length }, `已保存 ${saved.length} 个世界`);
  }

  // 单个保存
  if (!body.id || !body.name || !body.type) {
    return apiError(400, '世界数据不完整（需要 id、name、type）');
  }

  try {
    const world = saveWorld(body as unknown as World);
    return apiSuccess(world, '世界已保存');
  } catch (err) {
    console.error('[Worlds POST] 保存失败:', err);
    return apiError(500, '世界保存失败');
  }
}

// ============================================
// DELETE — 删除世界
// ============================================

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const worldId = url.searchParams.get('id');

  if (!worldId) {
    return apiError(400, '删除需要提供 id 参数');
  }

  const deleted = deleteWorld(worldId);
  if (!deleted) {
    return apiError(404, `世界 "${worldId}" 不存在`);
  }

  return apiSuccess(null, `世界 "${worldId}" 已删除`);
}
