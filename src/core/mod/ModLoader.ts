/**
 * Mod 加载器
 *
 * 负责在运行时发现、加载、校验 Mod 数据，并注册到 WorldViewRegistry。
 *
 * 加载流程：
 * 1. fetch /mods/mod-list.json → 获取 Mod 列表
 * 2. 并行 fetch 各 Mod 的 mod.json → 校验清单
 * 3. 拓扑排序解析依赖
 * 4. 按序加载数据文件 → 校验 → 注册到 WorldViewRegistry
 * 5. 发布加载进度事件
 *
 * @module core/mod
 */

import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry/WorldViewRegistry';
import { AttributeRegistry } from '@/core/registry/AttributeRegistry';
import { RaceRegistry } from '@/core/registry/RaceRegistry';
import { TalentRegistry } from '@/core/registry/TalentRegistry';
import { NPCDataRegistry } from '@/core/registry/NPCDataRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type { WorldviewDefinition } from '@/core/registry/WorldViewRegistry';
import type { NPCDefinition, QuestDefinition } from '@/core/types';

import { parseManifest, ModLoadError } from './ModManifest';

import type {
  ModManifest,
  ModLoadStatus,
  ModLoadProgressEvent,
  ModLoadCompleteEvent,
  LoadedMod,
} from './ModManifest';

/** ModLoader 日志记录器 */
const log = createLogger('ModLoader');

// ============================================
// Mod 索引类型
// ============================================

/** mod-list.json 中的条目 */
interface ModListEntry {
  id: string;
  path: string;
}

/** mod-list.json 的结构 */
interface ModList {
  mods: ModListEntry[];
}

// ============================================
// 事件类型
// ============================================

/** Mod 加载事件的回调类型 */
export type ModProgressCallback = (event: ModLoadProgressEvent) => void;
export type ModCompleteCallback = (event: ModLoadCompleteEvent) => void;

// ============================================
// ModLoader
// ============================================

/**
 * Mod 加载器
 *
 * 浏览器端 Mod 加载管线。通过 fetch 加载 public/mods/ 下的 Mod 数据。
 *
 * @example
 * ```typescript
 * const loader = new ModLoader();
 * const result = await loader.loadAll();
 * log.info(`Loaded ${result.loaded} mods, ${result.failed} failed`);
 * ```
 */
export class ModLoader {
  /** Mod 文件的基础路径 */
  private readonly basePath: string;

  /** 注册中心实例 */
  private registry: WorldViewRegistry;

  /** 已加载的 Mod 列表 */
  private loadedMods: LoadedMod[] = [];

  /** 进度回调 */
  private onProgress: ModProgressCallback | null = null;

  /** 完成回调 */
  private onComplete: ModCompleteCallback | null = null;

  /** 当前是否正在加载 */
  private loading = false;

  constructor(basePath = '/mods') {
    this.basePath = basePath;
    this.registry = WorldViewRegistry.getInstance();
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

  /**
   * 获取已加载的 Mod 列表
   */
  getLoadedMods(): LoadedMod[] {
    return this.loadedMods;
  }

  /**
   * 检查是否正在加载
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * 加载所有 Mod
   *
   * 主入口方法。执行完整的 Mod 发现、校验、加载管线。
   *
   * 强制 Mod（required: true）加载失败会抛出 ModLoadError。
   * 非强制 Mod 失败会记录但不会阻塞。
   *
   * @returns 加载结果摘要
   * @throws {ModLoadError} 当强制 Mod 加载失败时
   */
  async loadAll(): Promise<ModLoadCompleteEvent> {
    if (this.loading) {
      log.warn('已经在加载中，跳过重复调用');
      return { loaded: this.loadedMods.filter(m => m.status === 'loaded').length, failed: this.loadedMods.filter(m => m.status === 'error').length, total: this.loadedMods.length };
    }

    this.loading = true;
    this.loadedMods = [];

    try {
      // 1. 发现 Mod
      const entries = await this.discoverMods();
      if (entries.length === 0) {
        log.warn('未发现任何 Mod，游戏数据可能不完整');
        const event: ModLoadCompleteEvent = { loaded: 0, failed: 0, total: 0 };
        this.onComplete?.(event);
        return event;
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
        this.onComplete?.({ loaded, failed, total });
        throw error;
      }

      // 3. 解析依赖并按拓扑顺序加载数据
      const sortedIds = this.resolveDependencyOrder(
        Array.from(manifests.entries()).map(([id, m]) => ({ id, manifest: m }))
      );

      const validMods = sortedIds
        .map(id => ({ id, manifest: manifests.get(id)! }))
        .filter(({ id }) => manifests.has(id));

      // 4. 并发加载各 Mod 数据文件并注册
      const loadResults = await Promise.all(
        validMods.map(async ({ id, manifest }) => {
          try {
            await this.loadModDataAndRegister(id, manifest);
            return { id, success: true as const };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '未知错误';
            log.error(`注册 Mod "${id}" 数据失败:`, errorMsg);
            const mod = this.loadedMods.find(m => m.manifest.id === id);
            if (mod) {
              mod.status = 'error';
              mod.error = errorMsg;
            }
            return { id, success: false as const, error: errorMsg, required: manifest.required, name: manifest.name };
          }
        })
      );

      for (const result of loadResults) {
        if (!result.success) {
          failed++;
          loaded--;
          if (result.required) {
            failedRequired.push({ id: result.id, name: result.name!, error: result.error! });
          }
        }
      }

      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total });
        throw error;
      }

      const event: ModLoadCompleteEvent = { loaded, failed, total };
      this.onComplete?.(event);
      return event;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 获取加载失败的 Mod 列表（含错误信息）
   */
  getFailedMods(): Array<{ id: string; name: string; error: string }> {
    return this.loadedMods
      .filter(m => m.status === 'error')
      .map(m => ({ id: m.manifest.id, name: m.manifest.name, error: m.error ?? '未知错误' }));
  }

  /**
   * 发现 Mod：从 mod-list.json 获取 Mod 列表
   */
  async discoverMods(): Promise<ModListEntry[]> {
    try {
      const url = `${this.basePath}/mod-list.json`;
      const response = await fetch(url);
      if (!response.ok) {
        log.warn(`无法获取 Mod 列表: ${response.status} ${response.statusText}`);
        return [];
      }
      const data: ModList = await response.json();
      if (!data.mods || !Array.isArray(data.mods)) {
        log.warn('mod-list.json 格式错误：缺少 mods 数组');
        return [];
      }
      return data.mods;
    } catch (err) {
      log.info('未发现 mod-list.json，无外挂 Mod');
      return [];
    }
  }

  /**
   * 加载单个 Mod 的清单文件
   */
  async loadModManifest(modPath: string): Promise<ModManifest> {
    const url = `${this.basePath}/${modPath}/mod.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法获取 mod.json: HTTP ${response.status}`);
    }
    const json = await response.text();
    const { manifest, errors } = parseManifest(json);
    if (!manifest) {
      throw new Error(`mod.json 校验失败: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    }
    return manifest;
  }

  /**
   * 加载 Mod 数据文件并注册到 WorldViewRegistry
   *
   * 优先尝试加载构建时生成的合并数据文件 data.json（单次请求）。
   * 若 data.json 不存在（404），则回退到按 dataFiles 逐文件加载。
   */
  async loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void> {
    const baseUrl = `${this.basePath}/${modId}`;

    // 优先尝试加载构建时合并的数据文件
    const mergedLoaded = await this.loadMergedData(modId);

    // 按 contentTypes 顺序加载（合并数据已加载的跳过）
    for (const contentType of manifest.contentTypes) {
      const dataPathValue = manifest.dataFiles[contentType];
      if (!dataPathValue) {
        log.warn(`Mod "${modId}" 的 contentTypes 包含 "${contentType}" 但 dataFiles 中未配置路径，跳过`);
        continue;
      }

      // worldview 类型如果已通过合并数据加载，跳过独立文件
      if (contentType === 'worldview' && mergedLoaded) continue;

      // 归一化为数组处理
      const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];

      for (const dataPath of dataPaths) {
        try {
          const url = `${baseUrl}/${dataPath}`;

          // styles 内容类型：加载 CSS 文本并通过 StyleLoader 注入
          if (contentType === 'styles') {
            await this.loadModStyles(modId, url);
            continue;
          }

          const response = await fetch(url);
          if (!response.ok) {
            log.warn(`无法加载 "${modId}" 的数据文件: ${dataPath} (HTTP ${response.status})`);
            continue;
          }
          const data = await response.json();
          this.registerData(modId, contentType, data);
        } catch (err) {
          log.warn(`加载 "${modId}" 的数据文件 "${dataPath}" 失败:`, err);
        }
      }
    }
  }

  /**
   * 尝试加载构建时合并的数据文件 data.json
   */
  private async loadMergedData(modId: string): Promise<boolean> {
    const url = `${this.basePath}/${modId}/data.json`;
    try {
      const response = await fetch(url);
      if (response.status === 404) {
        log.info(`Mod "${modId}": 未找到合并数据文件，回退到逐文件加载`);
        return false;
      }
      if (!response.ok) {
        log.warn(`Mod "${modId}": 合并数据文件加载失败 (HTTP ${response.status})，回退到逐文件加载`);
        return false;
      }
      const merged = await response.json();
      if (!merged || typeof merged !== 'object' || Array.isArray(merged)) {
        log.warn(`Mod "${modId}": 合并数据文件格式异常，回退到逐文件加载`);
        return false;
      }

      // 按 content type 分发注册
      for (const [contentType, data] of Object.entries(merged as Record<string, unknown>)) {
        if (contentType === 'worldview' && data && typeof data === 'object' && !Array.isArray(data)) {
          this.registerMergedWorldviewData(modId, data as Record<string, unknown>);
        } else if (contentType === 'styles') {
          // styles 不在合并数据中处理，跳过
        } else {
          log.warn(`Mod "${modId}": 未知的合并数据类型 "${contentType}"，跳过`);
        }
      }
      log.info(`Mod "${modId}": 通过合并数据文件加载成功`);
      return true;
    } catch (err) {
      log.warn(`Mod "${modId}": 合并数据文件加载异常，回退到逐文件加载:`, err);
      return false;
    }
  }

  /**
   * 注册合并数据中的 worldview 条目
   */
  private registerMergedWorldviewData(modId: string, worldviewEntries: Record<string, unknown>): void {
    for (const [, worldviewData] of Object.entries(worldviewEntries)) {
      if (worldviewData && typeof worldviewData === 'object' && !Array.isArray(worldviewData)) {
        this.registerData(modId, 'worldview', worldviewData);
      }
    }
  }

  /**
   * 加载 Mod 提供的 CSS 样式文件并通过 StyleLoader 注入
   */
  private async loadModStyles(modId: string, cssUrl: string): Promise<void> {
    try {
      const response = await fetch(cssUrl);
      if (!response.ok) {
        log.warn(`Mod "${modId}" 样式文件加载失败: HTTP ${response.status}`);
        const { StyleLoader } = await import('@/modules/theme/logic/styleLoader');
        StyleLoader.getInstance().triggerError(modId, new Error(`HTTP ${response.status}`));
        return;
      }
      const cssContent = await response.text();
      const { StyleLoader } = await import('@/modules/theme/logic/styleLoader');
      const styleLoader = StyleLoader.getInstance();
      const priority = 3;
      styleLoader.injectModStyles(modId, cssContent, priority);
      log.info(`Mod "${modId}": 注入样式成功`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.warn(`Mod "${modId}" 样式注入失败:`, error.message);
    }
  }

  /**
   * 将已加载的数据注册到 WorldViewRegistry
   *
   * worldview 类型直接作为 WorldviewDefinition 注册。
   *
   * @param modId - Mod ID
   * @param contentType - 内容类型
   * @param data - 已解析的 JSON 数据
   */
  private registerData(
    modId: string,
    contentType: string,
    data: unknown,
  ): void {
    if (contentType === 'worldview') {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        log.warn(`Mod "${modId}": worldview 类型数据格式无效，跳过`);
        return;
      }
      const worldview = data as WorldviewDefinition;
      const worldviewId = worldview.id || 'unknown';
      try {
        this.registry.register(worldview);
        log.info(`Mod "${modId}": 注册了世界观 "${worldviewId}"`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '未知错误';
        log.warn(`Mod "${modId}": 注册世界观 "${worldviewId}" 失败: ${errorMsg}`);
      }
      return;
    }

    if (contentType === 'attributes') {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        log.warn(`Mod "${modId}": attributes 类型数据格式无效，跳过`);
        return;
      }
      const attrRegistry = AttributeRegistry.getInstance();
      const count = attrRegistry.count;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attrRegistry.registerAll(data as Record<string, any>);
      log.info(`Mod "${modId}": 注册了 ${attrRegistry.count - count} 个属性模板`);
      return;
    }

    if (contentType === 'races') {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const race = data as Record<string, unknown>;
        if (race.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          RaceRegistry.getInstance().register(race as any);
          log.info(`Mod "${modId}": 注册了种族 "${race.id}"`);
        }
      }
      return;
    }

    if (contentType === 'talents') {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TalentRegistry.getInstance().registerAll(data as any);
        log.info(`Mod "${modId}": 注册了天赋数据`);
      }
      return;
    }

    if (contentType === 'npcs') {
      if (Array.isArray(data)) {
        NPCDataRegistry.getInstance().registerAll(data as NPCDefinition[]);
        log.info(`Mod "${modId}": 注册了 ${(data as unknown[]).length} 个 NPC`);
      }
      return;
    }

    if (contentType === 'quests') {
      if (Array.isArray(data)) {
        QuestRegistry.getInstance().registerAll(data as QuestDefinition[]);
        log.info(`Mod "${modId}": 注册了 ${(data as unknown[]).length} 个任务`);
      }
      return;
    }

    log.warn(`Mod "${modId}": 未知的内容类型 "${contentType}"，跳过`);
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
  private emitProgress(current: number, total: number, currentModId: string): void {
    this.onProgress?.({ current, total, currentModId });
  }
}
