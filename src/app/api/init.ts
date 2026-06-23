/**
 * 服务端世界系统初始化模块
 *
 * 在 API 路由首次调用时，通过 ServerModLoader 从文件系统读取 Mod JSON 数据，
 * 注册到 WorldViewRegistry，并创建 WorldProvider。
 *
 * @module app/api/init
 */

import { createLogger } from '@/core/logger';
import { ServerModLoader } from '@/core/mod';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';
import { WorldViewRegistry } from '@/core/registry/WorldViewRegistry';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';

const log = createLogger('API Init');

let initialized = false;
let initializing = false;

/**
 * 确保世界系统已初始化（幂等）
 *
 * 使用 ServerModLoader 从 mods/ 目录加载所有 Mod 数据并注册。
 * 返回 Promise，初始化完成后 resolve。
 */
export async function ensureWorldSystemInitialized(): Promise<void> {
  if (initialized) return;

  if (initializing) {
    // 另一个初始化正在进行中，等待完成
    await waitForInitialization();
    return;
  }

  initializing = true;
  log.info('开始服务端世界系统初始化...');

  // 重置注册中心（确保 clean state）
  WorldViewRegistry.resetInstance();
  WorldMechanicsRegistry.resetInstance();
  WorldProviderRegistry.resetInstance();

  try {
    const loader = new ServerModLoader();
    const result = await loader.loadAll();

    if (result.loaded > 0 || result.total === 0) {
      // 注册 WorldProvider
      loader.registerWorldProviders();

      initialized = true;
      log.info(`世界系统初始化完成（${WorldViewRegistry.getInstance().count} 个世界观，${result.loaded}/${result.total} Mod 加载成功）`);

      if (result.errors && result.errors.length > 0) {
        for (const err of result.errors) {
          log.warn(`Mod "${err.name}" (${err.id}) 加载失败: ${err.error}`);
        }
      }
    } else {
      log.warn('未发现 Mod 数据，世界生成将不可用');
      initialized = true;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log.error(`世界系统初始化失败: ${errorMsg}`);
    // 即使失败也标记为已初始化，避免重复尝试
    initialized = true;
  } finally {
    initializing = false;
  }
}

/** 等待初始化完成 */
function waitForInitialization(): Promise<void> {
  return new Promise(resolve => {
    const check = () => {
      if (initialized || !initializing) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

export function resetWorldSystem(): void {
  initialized = false;
  initializing = false;
  WorldViewRegistry.resetInstance();
  WorldMechanicsRegistry.resetInstance();
  WorldProviderRegistry.resetInstance();
}
