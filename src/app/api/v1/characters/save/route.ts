/**
 * POST /api/v1/characters/save
 *
 * 用户选择模板并自定义后，确认进入世界时调用。
 * 生成 characterSeed 并持久化到 SQLite characters 表。
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';
import { generateCharacterTemplates, createCharacterSeed } from '@/modules/identity/logic/characterTemplates';
import { saveCharacter } from '../store';

const log = createLogger('Character Save');

interface SaveRequest {
  worldSeed: string;
  worldviewId: string;
  templateIndex: number;
  customizations?: {
    name?: string;
    gender?: '男' | '女';
    /** 属性调整（key → 新值） */
    attributes?: Record<string, number | string>;
  };
}

export async function POST(request: NextRequest) {
  let body: SaveRequest;
  try {
    body = (await request.json()) as SaveRequest;
  } catch {
    return apiError(400, '请求体格式错误，需要 JSON');
  }

  if (!body.worldSeed || !body.worldviewId || body.templateIndex === undefined) {
    return apiError(400, '缺少 worldSeed / worldviewId / templateIndex 参数');
  }

  if (body.templateIndex < 0 || body.templateIndex > 7) {
    return apiError(400, 'templateIndex 必须在 0-7 之间');
  }

  try {
    // 1. 重新生成 8 个模板（确定性，与前端生成的一致）
    const templates = generateCharacterTemplates(body.worldSeed, body.worldviewId);
    const template = templates[body.templateIndex];
    if (!template) {
      return apiError(500, '模板生成失败');
    }

    // 2. 应用用户自定义
    const name = body.customizations?.name ?? template.name;
    const gender = body.customizations?.gender ?? template.gender;
    const attributes = {
      ...template.attributes,
      ...(body.customizations?.attributes ?? {}),
    };

    // 3. 生成角色 seed
    const characterSeed = createCharacterSeed(
      body.worldSeed,
      body.templateIndex,
      { name, gender },
    );

    // 4. 持久化
    const character = saveCharacter({
      seed: characterSeed,
      worldSeed: body.worldSeed,
      worldviewId: body.worldviewId,
      name,
      gender,
      raceId: template.raceId,
      talentIds: template.talentIds,
      attributes,
      coreStats: template.coreStats as Record<string, number>,
    });

    log.info(`角色 "${name}" 已保存 (seed: ${characterSeed})`);
    return apiSuccess(
      { characterSeed, character },
      `角色 "${name}" 已保存`,
    );
  } catch (err) {
    log.error('保存角色失败:', err);
    return apiError(500, `保存失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
