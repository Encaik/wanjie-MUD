/**
 * GET /api/v1/worldviews
 *
 * 返回所有可用的世界观列表。用于前端展示世界观选择界面。
 *
 * @example
 * GET /api/v1/worldviews              → 返回所有世界观摘要
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { WorldDataRegistry } from '@/core/registry';
import { createLogger } from '@/core/logger';

const log = createLogger('Worldviews');

/** 世界观摘要（不包含完整的生成池数据，减少传输量） */
interface WorldviewSummary {
  id: string;
  name: string;
  description: string;
  visualConfig: {
    icon: string;
    accentColor: string;
    gradientClass: string;
    colorGradient: string;
  } | null;
  builtin: boolean;
  tags?: string[];
}

export async function GET(_request: NextRequest) {
  try {
    ensureWorldSystemInitialized();
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  const registry = WorldDataRegistry.getInstance();

  // 优先从 worldview 获取
  const worldviews = registry.getAllWorldviews();
  if (worldviews.length > 0) {
    const summaries: WorldviewSummary[] = worldviews.map(wv => ({
      id: wv.id,
      name: wv.name,
      description: wv.description,
      visualConfig: wv.visualConfig
        ? {
            icon: wv.visualConfig.icon,
            accentColor: wv.visualConfig.accentColor,
            gradientClass: wv.visualConfig.gradientClass,
            colorGradient: wv.visualConfig.colorGradient,
          }
        : null,
      builtin: wv.builtin,
      tags: wv.tags,
    }));
    return apiSuccess({ worldviews: summaries, count: summaries.length });
  }

  // 回退：从旧 worldTypes 获取基本信息
  const worldTypes = registry.getAllWorldTypeData();
  if (worldTypes.length > 0) {
    const summaries: WorldviewSummary[] = worldTypes.map(wt => ({
      id: wt.type,
      name: wt.name,
      description: wt.description,
      visualConfig: wt.visualConfig
        ? {
            icon: wt.visualConfig.icon,
            accentColor: wt.visualConfig.accentColor,
            gradientClass: wt.visualConfig.gradientClass,
            colorGradient: wt.visualConfig.colorGradient,
          }
        : null,
      builtin: wt.builtin ?? false,
    }));
    return apiSuccess({ worldviews: summaries, count: summaries.length });
  }

  return apiError(500, '没有已注册的世界观');
}
