/**
 * Mod 加载器基类
 *
 * 封装服务端和客户端加载器的共享逻辑：
 * - 依赖排序（拓扑排序）
 * - 进度回调
 * - 错误汇总
 *
 * @module core/mod/loader
 */

import { createLogger } from '@/core/logger';
import { ModLoadError } from '../types';
import type { ModManifest } from '../ModManifest';
import type {
  ModLoadResult,
  ModLoadProgress,
  ModLoadStatus,
  LoadedMod,
  ModProgressCallback,
  ModCompleteCallback,
} from '../types';

/** 加载器日志记录器 */
const log = createLogger('BaseModLoader');

/**
 * Mod 加载器基类
 *
 * 子类只需实现 loadModManifest() 和 loadModDataAndRegister() 两个抽象方法。
 * 依赖排序、进度回调、错误汇总由基类提供。
 */
export abstract class BaseModLoader {
  /** Mod 文件的基础路径 */
  protected readonly basePath: string;

  /** 已加载的 Mod 列表 */
  protected loadedMods: LoadedMod[] = [];

  /** 进度回调 */
  protected onProgress: ModProgressCallback | null = null;

  /** 完成回调 */
  protected onComplete: ModCompleteCallback | null = null;

  /** 当前是否正在加载 */
  protected loading = false;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  // ============================================
  // 抽象方法（子类实现）
  // ============================================

  /** 获取已加载的 Mod 列表 */
  getLoadedMods(): LoadedMod[] {
    return this.loadedMods;
  }

  /** 获取加载失败的 Mod 列表（含错误信息） */
  getFailedMods(): Array<{ id: string; name: string; error: string }> {
    return this.loadedMods
      .filter(m => m.status === 'error')
      .map(m => ({ id: m.manifest.id, name: m.manifest.name, error: m.error ?? '未知错误' }));
  }

  /** 检查是否正在加载 */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * 设置加载进度回调
   */
  setProgressCallback(callback: ModProgressCallback): this {
    this.onProgress = callback;
    return this;
  }

  /**
   * 设置加载完成回调
   */
  setCompleteCallback(callback: ModCompleteCallback): this {
    this.onComplete = callback;
    return this;
  }

  // ============================================
  // 子类必须实现
  // ============================================

  /** 发现可用的 Mod 列表 */
  abstract discover(): Promise<Array<{ id: string; path: string }>>;

  /**
   * 加载单个 Mod 的清单文件
   */
  abstract loadModManifest(modPath: string): Promise<ModManifest>;

  /**
   * 加载 Mod 数据文件并注册到对应的注册中心
   */
  abstract loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void>;

  // ============================================
  // 共享逻辑
  // ============================================

  /**
   * 加载所有 Mod
   *
   * 主入口方法。执行完整的 Mod 发现、校验、加载管线。
   * 强制 Mod（required: true）加载失败会抛出 ModLoadError。
   * 非强制 Mod 失败会记录但不会阻塞。
   *
   * @returns 加载结果摘要
   * @throws {ModLoadError} 当强制 Mod 加载失败时
   */
  async loadAll(): Promise<ModLoadResult> {
    if (this.loading) {
      log.warn('已经在加载中，跳过重复调用');
      return { loaded: this.loadedMods.filter(m => m.status === 'loaded').length, failed: this.loadedMods.filter(m => m.status === 'error').length, total: this.loadedMods.length };
    }

    this.loading = true;
    this.loadedMods = [];

    try {
      // 1. 发现 Mod
      const entries = await this.discover();
      if (entries.length === 0) {
        log.warn('未发现任何 Mod，游戏数据可能不完整');
        const result: ModLoadResult = { loaded: 0, failed: 0, total: 0 };
        this.onComplete?.(result);
        return result;
      }

      const total = entries.length;
      let loaded = 0;
      let failed = 0;
      const failedRequired: Array<{ id: string; name: string; error: string }> = [];

      // 2. 加载所有清单
      const manifests: Map<string, ModManifest> = new Map();
      for (const entry of entries) {
        this.emitProgress(loaded + failed + 1, total, entry.id);
        try {
          const manifest = await this.loadModManifest(entry.path);
          manifests.set(entry.id, manifest);
          this.loadedMods.push({ manifest, status: 'loaded' });
          loaded++;
        } catch (err) {
          failed++;
          const errorMsg = err instanceof Error ? err.message : '未知错误';
          const placeholderManifest: ModManifest = {
            id: entry.id, name: entry.id, version: '?', description: '', author: '?',
            gameVersion: '?', dependencies: [], required: false, template: false, contentTypes: [], dataFiles: {},
          };
          this.loadedMods.push({ manifest: placeholderManifest, status: 'error', error: errorMsg });

          if (entry.id === 'wanjie-core') {
            failedRequired.push({ id: entry.id, name: entry.id, error: errorMsg });
          }
          log.error(`加载 Mod "${entry.id}" 失败:`, errorMsg);
        }
      }

      // 2.5 检查 manifest 中标记为 required 的 Mod
      for (const [, manifest] of manifests) {
        if (manifest.required) {
          const mod = this.loadedMods.find(m => m.manifest.id === manifest.id);
          if (mod && mod.status === 'error') {
            failedRequired.push({ id: manifest.id, name: manifest.name, error: mod.error ?? '未知错误' });
          }
        }
      }

      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total, errors: failedRequired });
        throw error;
      }

      // 3. 解析依赖并按拓扑顺序加载数据
      const sortedIds = this.resolveDependencyOrder(
        Array.from(manifests.entries()).map(([id, m]) => ({ id, manifest: m }))
      );

      const validMods = sortedIds
        .map(id => ({ id, manifest: manifests.get(id)! }))
        .filter(({ id }) => manifests.has(id));

      // 4. 按序加载各 Mod 数据文件并注册
      for (const { id, manifest } of validMods) {
        try {
          await this.loadModDataAndRegister(id, manifest);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '未知错误';
          log.error(`注册 Mod "${id}" 数据失败:`, errorMsg);
          const mod = this.loadedMods.find(m => m.manifest.id === id);
          if (mod) {
            mod.status = 'error';
            mod.error = errorMsg;
          }
          failed++;
          loaded--;
          if (manifest.required) {
            failedRequired.push({ id: manifest.id, name: manifest.name, error: errorMsg });
          }
        }
      }

      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total, errors: failedRequired });
        throw error;
      }

      const result: ModLoadResult = { loaded, failed, total };
      this.onComplete?.(result);
      return result;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 解析 Mod 依赖顺序（拓扑排序）
   */
  resolveDependencyOrder(
    mods: Array<{ id: string; manifest: ModManifest }>
  ): string[] {
    const modMap = new Map(mods.map(m => [m.id, m.manifest]));
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const result: string[] = [];

    function visit(id: string): boolean {
      if (inStack.has(id)) {
        log.error(`检测到循环依赖: ${id} 在依赖链中已存在`);
        return false;
      }
      if (visited.has(id)) return true;

      const manifest = modMap.get(id);
      if (!manifest) {
        log.error(`缺失依赖: "${id}" 不在已发现的 Mod 列表中`);
        return false;
      }

      inStack.add(id);

      for (const depId of manifest.dependencies) {
        if (!modMap.has(depId)) {
          log.error(`Mod "${id}" 依赖 "${depId}"，但 "${depId}" 不存在`);
          inStack.delete(id);
          return false;
        }
        if (!visit(depId)) {
          inStack.delete(id);
          return false;
        }
      }

      inStack.delete(id);
      visited.add(id);
      result.push(id);
      return true;
    }

    for (const { id } of mods) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    const unvisited = mods.filter(m => !visited.has(m.id));
    if (unvisited.length > 0) {
      log.error(
        `以下 Mod 因依赖问题被跳过: ${unvisited.map(m => m.id).join(', ')}`
      );
    }

    return result;
  }

  /**
   * 发送加载进度事件
   */
  protected emitProgress(current: number, total: number, currentModId: string): void {
    this.onProgress?.({ current, total, currentModId });
  }
}
