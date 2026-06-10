/**
 * POST /api/v1/worlds/generate/basic
 *
 * 只生成世界基础信息（名称、描述、境界、难度）并存入 DB。
 * 前端初始化世界选择列表时调用此接口。
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { generateWorldSeed } from '@/modules/identity/logic/generators';
import { generateBasic } from '../generator';
import type { World } from '@/core/types';

interface BasicRequest {
  seed?: string;
  worldType?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  console.log('[Basic] ← 收到请求');

  // 1. 初始化
  try {
    ensureWorldSystemInitialized();
    console.log('[Basic] 初始化完成');
  } catch (err) {
    console.error('[Basic] 初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  // 2. 解析
  let body: BasicRequest;
  try {
    body = (await request.json()) as BasicRequest;
    console.log('[Basic] 请求体:', JSON.stringify(body));
  } catch {
    console.log('[Basic] 无请求体，使用默认值');
    body = {};
  }

  // 3. 生成
  try {
    const count = Math.min(Math.max(body.count ?? 8, 1), 20);
    console.log('[Basic] 开始生成', count, '个基础世界...');

    const worlds: World[] = [];
    if (body.seed) {
      for (let i = 0; i < count; i++) {
        const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
        const w = generateBasic(uniqueSeed, body.worldType);
        console.log(`[Basic]   [${i + 1}/${count}] seed=${uniqueSeed} name=${w.name} type=${w.type}`);
        worlds.push(w);
      }
    } else {
      for (let i = 0; i < count; i++) {
        const w = generateBasic(generateWorldSeed(), body.worldType);
        console.log(`[Basic]   [${i + 1}/${count}] seed=${w.id} name=${w.name} type=${w.type}`);
        worlds.push(w);
      }
    }

    console.log('[Basic] ✅ 完成，返回', worlds.length, '个世界');
    return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `生成 ${worlds.length} 个基础世界`);
  } catch (err) {
    console.error('[Basic] ❌ 生成失败:', err);
    return apiError(500, `基础世界生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
