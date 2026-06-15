/**
 * GET /api/v1/worldviews/[id]/theme
 *
 * 返回指定世界观的明暗主题 CSS 变量配置。
 * 数据从 WorldviewDefinition.themeConfig 读取。
 *
 * @example
 * GET /api/v1/worldviews/cultivation/theme
 * → { worldviewId, displayName, lightTheme, darkTheme }
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { WorldViewRegistry } from '@/core/registry';
import { createLogger } from '@/core/logger';

const log = createLogger('ThemeAPI');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  const { id } = await params;
  const registry = WorldViewRegistry.getInstance();
  const worldview = registry.get(id);

  if (!worldview) {
    return apiError(404, `世界观 '${id}' 不存在`);
  }

  if (!worldview.themeConfig) {
    return apiError(404, `世界观 '${id}' 未配置主题`);
  }

  return apiSuccess({
    worldviewId: worldview.id,
    displayName: worldview.name,
    lightTheme: worldview.themeConfig.light,
    darkTheme: worldview.themeConfig.dark,
  });
}
