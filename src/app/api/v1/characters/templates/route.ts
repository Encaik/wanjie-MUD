/**
 * POST /api/v1/characters/templates
 *
 * 基于 worldSeed + worldviewId 确定性地生成 8 个角色模板。
 * 相同输入永远产生相同模板列表。
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { generateCharacterTemplates } from '@/modules/identity/logic/characterTemplates';

const log = createLogger('Character Templates');

interface TemplatesRequest {
  worldSeed: string;
  worldviewId: string;
}

export async function POST(request: NextRequest) {
  let body: TemplatesRequest;
  try {
    body = (await request.json()) as TemplatesRequest;
  } catch {
    return apiError(400, '请求体格式错误，需要 JSON');
  }

  if (!body.worldSeed || !body.worldviewId) {
    return apiError(400, '缺少 worldSeed 或 worldviewId 参数');
  }

  try {
    const templates = generateCharacterTemplates(body.worldSeed, body.worldviewId);
    log.info(`生成了 ${templates.length} 个角色模板 (worldSeed: ${body.worldSeed})`);
    return apiSuccess(
      { templates, generatedAt: new Date().toISOString() },
      `生成 ${templates.length} 个角色模板`,
    );
  } catch (err) {
    log.error('模板生成失败:', err);
    return apiError(500, `模板生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
