/**
 * POST /api/v1/worlds/generate/basic
 *
 * 只生成世界基础信息（名称、描述、境界、难度）并存入 DB。
 * 前端初始化世界选择列表时调用此接口。
 *
 * 支持 worldviewId 参数指定世界观类型。
 */

import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/app/api/result';
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry';
import { generateWorldBasicFields, generateSeed } from '@/core/world';
import type { World } from '@/core/types';

/** 日志实例 */
const log = createLogger('Basic');

interface BasicRequest {
  seed?: string;
  /** 世界观 ID（English kebab-case） */
  worldviewId?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  log.info('← 收到请求');

  // 1. 初始化
  try {
    ensureWorldSystemInitialized();
    log.info('初始化完成');
  } catch (err) {
    log.error('初始化失败:', err);
    return apiError(500, '世界系统初始化失败');
  }

  // 2. 解析
  let body: BasicRequest;
  try {
    body = (await request.json()) as BasicRequest;
    log.info('请求体:', JSON.stringify(body));
  } catch {
    log.info('无请求体，使用默认值');
    body = {};
  }

  // 3. 生成
  try {
    const registry = WorldViewRegistry.getInstance();
    const worldviewId = body.worldviewId;
    const count = Math.min(Math.max(body.count ?? 8, 1), 20);
    log.info('开始生成', count, '个基础世界...');

    const worlds: World[] = [];

    if (worldviewId) {
      // 指定世界观：校验并生成
      let worldview = registry.get(worldviewId);
      if (!worldview) {
        // 回退到旧 API
        const { generateBasic } = await import('../generator');
        if (body.seed) {
          for (let i = 0; i < count; i++) {
            const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
            worlds.push(generateBasic(uniqueSeed, worldviewId));
          }
        } else {
          for (let i = 0; i < count; i++) {
            worlds.push(generateBasic(generateSeed(), worldviewId));
          }
        }
      } else {
        // V3: 只生成基础字段（名称、描述、境界、难度、属性定义），详情由 details API 补全
        if (body.seed) {
          for (let i = 0; i < count; i++) {
            const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
            const basic = generateWorldBasicFields(worldview, uniqueSeed, 0);
            worlds.push({ ...basic, factions: [], majorForces: '', dangers: [], opportunities: [] } as World);
          }
        } else {
          for (let i = 0; i < count; i++) {
            const basic = generateWorldBasicFields(worldview, generateSeed(), 0);
            worlds.push({ ...basic, factions: [], majorForces: '', dangers: [], opportunities: [] } as World);
          }
        }
      }
    } else {
      // 随机选择世界观
      const allWorldviews = registry.getAll();
      if (allWorldviews.length > 0) {
        for (let i = 0; i < count; i++) {
          const wv = allWorldviews[Math.floor(Math.random() * allWorldviews.length)];
          const basic = generateWorldBasicFields(wv, body.seed || generateSeed(), 0);
          worlds.push({ ...basic, factions: [], majorForces: '', dangers: [], opportunities: [] } as World);
        }
      } else {
        // 回退到旧 API
        const { generateBasic } = await import('../generator');
        if (body.seed) {
          for (let i = 0; i < count; i++) {
            const uniqueSeed = count > 1 ? `${body.seed}-${i + 1}` : body.seed;
            worlds.push(generateBasic(uniqueSeed, undefined));
          }
        } else {
          for (let i = 0; i < count; i++) {
            worlds.push(generateBasic(generateSeed(), undefined));
          }
        }
      }
    }

    log.info('✅ 完成，返回', worlds.length, '个世界');
    return apiSuccess({ worlds, generatedAt: new Date().toISOString() }, `生成 ${worlds.length} 个基础世界`);
  } catch (err) {
    log.error('❌ 生成失败:', err);
    return apiError(500, `基础世界生成失败: ${err instanceof Error ? err.message : '未知错误'}`);
  }
}
