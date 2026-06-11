/**
 * POST /api/v1/worlds/generate
 *
 * 统一世界生成接口。全部以 seed 驱动，world.id === seed。
 * 相同 seed 永远生成相同的世界（确定性）。
 *
 * 支持通过 worldviewId 指定世界观类型（必填推荐）。
 *
 * @example
 * POST /api/v1/worlds/generate  { "worldviewId": "cultivation", "seed": "abc123" }
 * POST /api/v1/worlds/generate  { "worldviewId": "martial", "count": 4 }
 * POST /api/v1/worlds/generate  { "seed": "abc123" }  // 随机世界观
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry';
import { generateWorld, generateSeed } from '@/core/world';
import type { World } from '@/core/types';

import { saveWorld } from '../store';

/** 日志实例 */
const log = createLogger('Generate');

interface GenerateRequest {
  seed?: string;
  /** 世界观 ID（English kebab-case，如 "cultivation"、"martial"） */
  worldviewId?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return apiError(400, '请求体格式错误');
  }

  try {
    const registry = WorldViewRegistry.getInstance();
    const worldviewId = body.worldviewId;

    // 如果指定了 worldviewId，校验其存在
    if (worldviewId) {
      const worldview = registry.get(worldviewId);
      if (!worldview) {
        return apiError(400, `世界观 '${worldviewId}' 未注册`);
      }

      const count = Math.min(Math.max(body.count ?? 1, 1), 10);
      const worlds: World[] = [];

      if (body.seed) {
        for (let i = 0; i < count; i++) {
          const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
          const world = generateWorld(worldview, uniqueSeed, 0);
          saveWorld(world);
          worlds.push(world);
        }
      } else {
        for (let i = 0; i < count; i++) {
          const world = generateWorld(worldview, generateSeed(), 0);
          saveWorld(world);
          worlds.push(world);
        }
      }
      return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `生成 ${worlds.length} 个世界`);
    }

    // 未指定 worldviewId：从所有可用世界观中随机
    const allWorldviews = registry.getAll();
    if (allWorldviews.length === 0) {
      return apiError(500, '没有已注册的世界观');
    }

    const count = Math.min(Math.max(body.count ?? 1, 1), 10);
    const worlds: World[] = [];
    for (let i = 0; i < count; i++) {
      const wv = allWorldviews[Math.floor(Math.random() * allWorldviews.length)];
      const world = generateWorld(wv, body.seed || generateSeed(), 0);
      saveWorld(world);
      worlds.push(world);
    }
    return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `生成 ${worlds.length} 个世界`);
  } catch (err) {
    log.error('失败:', err);
    return apiError(500, `世界生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
