/**
 * POST /api/v1/characters/generate
 *
 * 服务端生成角色列表。世界观的姓名池和词条池从 WorldViewRegistry 获取，
 * 该注册中心在服务端已通过 ensureWorldSystemInitialized() 填充。
 */
import { NextRequest } from 'next/server';

import { ensureWorldSystemInitialized } from '@/app/api/init';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { generateCharacters } from '@/modules/identity/logic/generators';

const log = createLogger('Characters');

interface GenerateRequest {
  /** 世界观英文 kebab-case ID */
  worldviewId?: string;
  /** 生成角色数量（默认 8） */
  count?: number;
}

export async function POST(request: NextRequest) {
  // 1. 初始化注册中心
  try {
    ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '角色生成系统初始化失败');
  }

  // 2. 解析请求
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    body = {};
  }

  // 3. 生成角色
  try {
    const worldviewId = body.worldviewId || 'cultivation';
    const count = Math.min(Math.max(body.count ?? 8, 1), 20);

    const characters = generateCharacters(worldviewId);
    // 如果请求的数量不等于 8，调整数量
    const result = count === 8 ? characters : characters.slice(0, count);

    log.info(`为 ${worldviewId} 生成 ${result.length} 个角色`);
    return apiSuccess({ characters: result }, `生成 ${result.length} 个角色`);
  } catch (err) {
    log.error('生成失败:', err);
    return apiError(500, `角色生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
