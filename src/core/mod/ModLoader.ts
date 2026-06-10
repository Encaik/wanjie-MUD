/**
 * Mod 加载器
 *
 * 负责在运行时发现、加载、校验 Mod 数据，并注册到 WorldDataRegistry。
 *
 * 加载流程：
 * 1. fetch /mods/mod-list.json → 获取 Mod 列表
 * 2. 并行 fetch 各 Mod 的 mod.json → 校验清单
 * 3. 拓扑排序解析依赖
 * 4. 按序加载数据文件 → 校验 → 注册到 WorldDataRegistry
 * 5. 发布加载进度事件
 *
 * @module shared/lib/mod
 */

import { createLogger } from '@/core/logger';
import {
  WorldDataRegistry,
} from '@/core/registry/WorldDataRegistry';
import type {
  WorldTypeData,
  DangerData,
  OpportunityData,
  TraitPoolData,
  FactionTemplateData,
  NamePoolData,
  RealmSystemData,
  WorldTextData,
} from '@/core/registry/WorldDataRegistry';
import type { WorldTemplate } from '@/core/world/types';
import { validateWorldTemplate } from '@/core/world/validateWorldTemplate';

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
  private registry: WorldDataRegistry;

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
    this.registry = WorldDataRegistry.getInstance();
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

          // 检查是否为强制 Mod
          // 加载失败时无法知道 required 字段，所以需要从 manifest 中预判断
          // 实际上我们只能知道这是否是 wanjie-core（通过 id）
          if (entry.id === 'wanjie-core') {
            failedRequired.push({ id: entry.id, name: entry.id, error: errorMsg });
          }
          log.error(`加载 Mod "${entry.id}" 失败:`, errorMsg);
        }
      }

      // 2.5 检查 manifest 中标记为 required 的 Mod 是否全部加载成功
      for (const [, manifest] of manifests) {
        if (manifest.required) {
          const mod = this.loadedMods.find(m => m.manifest.id === manifest.id);
          if (mod && mod.status === 'error') {
            failedRequired.push({ id: manifest.id, name: manifest.name, error: mod.error ?? '未知错误' });
          }
        }
      }

      // 强制 Mod 失败 → 抛出致命错误
      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total });
        throw error;
      }

      // 3. 解析依赖并按拓扑顺序加载数据
      const sortedIds = this.resolveDependencyOrder(
        Array.from(manifests.entries()).map(([id, m]) => ({ id, manifest: m }))
      );

      // Separate: successfully loaded manifests only
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

      // 处理并发加载结果
      for (const result of loadResults) {
        if (!result.success) {
          failed++;
          loaded--;
          if (result.required) {
            failedRequired.push({ id: result.id, name: result.name!, error: result.error! });
          }
        }
      }

      // 再次检查强制 Mod
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
   *
   * @returns 失败的 Mod 列表
   */
  getFailedMods(): Array<{ id: string; name: string; error: string }> {
    return this.loadedMods
      .filter(m => m.status === 'error')
      .map(m => ({ id: m.manifest.id, name: m.manifest.name, error: m.error ?? '未知错误' }));
  }

  /**
   * 发现 Mod：从 mod-list.json 获取 Mod 列表
   *
   * @returns Mod 条目列表
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
      // 文件不存在或网络错误：优雅降级
      log.info('未发现 mod-list.json，无外挂 Mod');
      return [];
    }
  }

  /**
   * 加载单个 Mod 的清单文件
   *
   * @param modPath - Mod 目录路径（相对于 basePath）
   * @returns 解析后的 Mod 清单
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
   * 加载 Mod 数据文件并注册到 WorldDataRegistry
   *
   * 优先尝试加载构建时生成的合并数据文件 data.json（单次请求）。
   * 若 data.json 不存在（404），则回退到按 dataFiles 逐文件加载。
   *
   * 支持两种 dataFiles 格式：
   * - 字符串：单一数据文件（向后兼容），如 `"data/worlds.json"`
   * - 字符串数组：多个独立数据文件，如 `["data/world/cultivation.json", ...]`
   *
   * @param modId - Mod ID
   * @param manifest - Mod 清单
   */
  async loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void> {
    const baseUrl = `${this.basePath}/${modId}`;

    // 优先尝试加载构建时合并的数据文件
    const mergedLoaded = await this.loadMergedData(modId, manifest);

    // 按 contentTypes 顺序加载（合并数据已加载的跳过）
    for (const contentType of manifest.contentTypes) {
      const dataPathValue = manifest.dataFiles[contentType];
      if (!dataPathValue) {
        log.warn(`Mod "${modId}" 的 contentTypes 包含 "${contentType}" 但 dataFiles 中未配置路径，跳过`);
        continue;
      }

      // world 类型如果已通过合并数据加载，跳过独立文件
      if (contentType === 'world' && mergedLoaded) continue;

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
          this.registerData(modId, contentType, data, manifest, Array.isArray(dataPathValue));
        } catch (err) {
          log.warn(`加载 "${modId}" 的数据文件 "${dataPath}" 失败:`, err);
          // 单个文件失败不阻塞其他文件
        }
      }
    }

    // 加载固化世界模板（如果 mod 声明了 worldTemplates）
    if (manifest.worldTemplates && manifest.worldTemplates.length > 0) {
      await this.loadTemplateWorlds(modId, baseUrl, manifest);
    }
  }

  /**
   * 尝试加载构建时合并的数据文件 data.json
   *
   * 若文件存在且解析成功，按 content type 分发注册，返回 true。
   * 若 404 或加载失败，返回 false，调用方应回退到逐文件加载。
   *
   * @param modId - Mod ID
   * @param _manifest - Mod 清单（预留，当前未使用）
   * @returns 是否成功加载合并数据
   */
  private async loadMergedData(modId: string, _manifest: ModManifest): Promise<boolean> {
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
        if (contentType === 'world' && data && typeof data === 'object' && !Array.isArray(data)) {
          this.registerMergedWorldData(modId, data as Record<string, unknown>);
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
   * 注册合并数据中的 world 条目
   *
   * 合并数据中 world 类型的值为 `{ cultivation: {...}, martial: {...} }` 格式，
   * 遍历每个条目并调用 registerData 进行注册。
   *
   * @param modId - Mod ID
   * @param worldEntries - 以世界类型为 key 的世界数据对象映射
   */
  private registerMergedWorldData(modId: string, worldEntries: Record<string, unknown>): void {
    for (const [, worldData] of Object.entries(worldEntries)) {
      if (worldData && typeof worldData === 'object' && !Array.isArray(worldData)) {
        // 每个世界条目是自包含对象，isArrayMode=true 以通过 registerData 校验
        this.registerData(modId, 'world', worldData, undefined as unknown as ModManifest, true);
      }
    }
  }

  /**
   * 加载固化世界模板文件
   *
   * 为 mod.json 中声明的每个 worldTemplates 条目加载
   * templates/worlds/{id}.json 文件，校验后注册到 WorldDataRegistry。
   */
  private async loadTemplateWorlds(modId: string, baseUrl: string, manifest: ModManifest): Promise<void> {
    for (const templateId of manifest.worldTemplates ?? []) {
      const url = `${baseUrl}/templates/worlds/${templateId}.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          log.warn(`无法加载固化世界模板: "${templateId}" (HTTP ${response.status})`);
          continue;
        }
        const data = await response.json();

        // 校验模板结构
        const result = validateWorldTemplate(data);
        if (!result.valid) {
          log.warn(
            `固化世界模板 "${templateId}" 校验失败:`,
            result.errors.join('; ')
          );
          continue;
        }

        // 注册到 WorldDataRegistry
        const template = data as WorldTemplate;
        this.registry.registerWorldTemplate(template);
        log.info(`Mod "${modId}": 注册固化世界模板 "${templateId}" (${template.world.name})`);
      } catch (err) {
        log.warn(`加载固化世界模板 "${templateId}" 失败:`, err);
      }
    }
  }

  /**
   * 加载 Mod 提供的 CSS 样式文件并通过 StyleLoader 注入
   *
   * @param modId - Mod ID
   * @param cssUrl - CSS 文件 URL
   */
  private async loadModStyles(modId: string, cssUrl: string): Promise<void> {
    try {
      const response = await fetch(cssUrl);
      if (!response.ok) {
        log.warn(`Mod "${modId}" 样式文件加载失败: HTTP ${response.status}`);
        // 触发 StyleLoader 错误回调
        const { StyleLoader } = await import('@/modules/theme/logic/styleLoader');
        StyleLoader.getInstance().triggerError(modId, new Error(`HTTP ${response.status}`));
        return;
      }
      const cssContent = await response.text();
      // 动态导入 StyleLoader 以避免对主题模块的硬依赖
      const { StyleLoader } = await import('@/modules/theme/logic/styleLoader');
      const styleLoader = StyleLoader.getInstance();

      // 计算优先级：基础 Mod 优先级 3，依赖项每增加一层 +1
      const priority = 3;
      styleLoader.injectModStyles(modId, cssContent, priority);
      log.info(`Mod "${modId}": 注入样式成功`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.warn(`Mod "${modId}" 样式注入失败:`, error.message);
      // 不阻塞其他 Mod
    }
  }

  /**
   * 将已加载的数据注册到 WorldDataRegistry
   *
   * world 文件为自包含格式，每个文件包含一个世界的全部数据：
   * 世界信息 + 境界 + 势力 + 姓名 + 文案 + 词条 + 危险 + 机缘
   *
   * @param modId - Mod ID
   * @param contentType - 内容类型
   * @param data - 已解析的 JSON 数据
   * @param _manifest - Mod 清单（未使用）
   * @param isArrayMode - 是否为数组模式（world 必须是数组模式）
   */
  private registerData(
    modId: string,
    contentType: string,
    data: unknown,
    _manifest: ModManifest,
    isArrayMode = false
  ): void {
    if (contentType !== 'world') {
      log.warn(`Mod "${modId}": 未知的内容类型 "${contentType}"，跳过`);
      return;
    }

    if (!isArrayMode || !data || typeof data !== 'object' || Array.isArray(data)) {
      log.warn(`Mod "${modId}": world 类型必须使用数组模式，跳过`);
      return;
    }

    const world = data as Record<string, unknown>;
    const worldType = (world.type as string) || 'unknown';

    // 注册世界类型
    this.registry.registerWorldType(world as unknown as WorldTypeData);

    // 注册境界体系
    if (world.realmSystem && typeof world.realmSystem === 'object') {
      this.registry.registerRealmSystem(worldType, world.realmSystem as RealmSystemData);
    }

    // 注册势力模板
    if (world.factions && typeof world.factions === 'object') {
      const factionData = world.factions as Record<string, unknown>;
      const templates = factionData.templates;
      if (Array.isArray(templates)) {
        for (const tpl of templates) {
          this.registry.registerFactionTemplate(tpl as FactionTemplateData);
        }
      }
    }

    // 注册词条池
    if (world.traits && typeof world.traits === 'object') {
      this.registry.registerTraitPool(worldType, world.traits as TraitPoolData);
    }

    // 注册姓名池
    if (world.names && typeof world.names === 'object') {
      this.registry.registerNamePool(worldType, world.names as NamePoolData);
    }

    // 注册世界观文案
    if (world.text && typeof world.text === 'object') {
      this.registry.registerWorldText(worldType, world.text as WorldTextData);
    }

    // 注册危险效果
    if (Array.isArray(world.dangers)) {
      this.registry.registerDangers(world.dangers as DangerData[]);
    }

    // 注册机缘效果
    if (Array.isArray(world.opportunities)) {
      this.registry.registerOpportunities(world.opportunities as OpportunityData[]);
    }

    log.info(`Mod "${modId}": 注册了世界 "${worldType}"（含境界/势力/姓名/文案/词条/危险/机缘）`);
  }

  /**
   * 解析 Mod 依赖顺序（拓扑排序）
   *
   * 如果存在循环依赖或缺失依赖，会记录错误并跳过受影响的 Mod。
   *
   * @param mods - Mod ID 和清单的列表
   * @returns 按加载顺序排列的 Mod ID 列表
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

    // 未被访问到的 ID（因循环/缺失依赖被跳过）
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
