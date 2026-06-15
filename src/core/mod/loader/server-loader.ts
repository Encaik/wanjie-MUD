/**
 * 服务端 Mod 加载器
 *
 * 通过文件系统（fs）扫描 mods/ 目录，读取 Mod JSON 数据文件，
 * 注册到 WorldViewRegistry / WorldMechanicsRegistry。
 *
 * 职责：
 * - 扫描 mods/ 目录发现 Mod
 * - 读取 mod.json 清单并校验
 * - 按依赖顺序加载数据文件
 * - 全量处理所有内容类型（worldview, attributes, races, talents, npcs, quests 等）
 * - 有对应 Registry 的调用注册，尚无 Registry 的暂存
 *
 * @module core/mod/loader
 */

import fs from 'fs';
import path from 'path';

import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry/WorldViewRegistry';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';
import { CoreWorldProvider } from '@/core/world/CoreWorldProvider';
import { AttributeRegistry } from '@/core/registry/AttributeRegistry';
import { RaceRegistry } from '@/core/registry/RaceRegistry';
import { TalentRegistry } from '@/core/registry/TalentRegistry';
import { NPCDataRegistry } from '@/core/registry/NPCDataRegistry';
import { QuestRegistry } from '@/core/registry/QuestRegistry';
import type { WorldviewDefinition } from '@/core/registry/WorldViewRegistry';
import type { NPCDefinition, QuestDefinition } from '@/core/types';
import type { MechanicsConfig } from '@/modules/identity/logic/worlds/types';
import { buildWorldMechanics } from '@/modules/identity/logic/worlds/builder';

import { BaseModLoader } from './base-loader';
import type { ModManifest } from '../ModManifest';
import { parseManifest } from '../ModManifest';
import type { ModContentType, ModEntry } from '../types';

const log = createLogger('ServerModLoader');

/**
 * 服务端 Mod 加载器
 *
 * 只在 Node.js 服务端使用。通过 fs 直接读取 mods/ 源目录。
 */
export class ServerModLoader extends BaseModLoader {
  /** Mod 数据暂存区（尚无对应 Registry 的内容类型） */
  private stagedData: Map<string, Map<string, unknown>> = new Map();

  constructor(basePath?: string) {
    super(basePath ?? path.resolve(process.cwd(), 'mods'));
  }

  /**
   * 从文件系统发现 Mod
   */
  async discover(): Promise<ModEntry[]> {
    try {
      if (!fs.existsSync(this.basePath)) {
        log.warn('mods/ 目录不存在');
        return [];
      }

      const entries: ModEntry[] = [];
      const items = fs.readdirSync(this.basePath, { withFileTypes: true });

      for (const item of items) {
        if (!item.isDirectory()) continue;
        const modJsonPath = path.join(this.basePath, item.name, 'mod.json');
        if (fs.existsSync(modJsonPath)) {
          entries.push({ id: item.name, path: item.name });
        }
      }

      return entries;
    } catch (err) {
      log.warn('扫描 mods/ 目录失败:', err);
      return [];
    }
  }

  /**
   * 从文件系统读取 Mod 清单文件
   */
  async loadModManifest(modPath: string): Promise<ModManifest> {
    const manifestPath = path.join(this.basePath, modPath, 'mod.json');
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const { manifest, errors } = parseManifest(raw);
      if (!manifest) {
        throw new Error(`mod.json 校验失败: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
      }
      return manifest;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`读取 mod.json 失败: ${String(err)}`);
    }
  }

  /**
   * 加载 Mod 数据文件并注册
   */
  async loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void> {
    const baseDir = path.join(this.basePath, modId);

    // 优先加载 data.json（构建产物），失败则回退到独立文件
    if (!this.loadMergedData(modId, baseDir)) {
      this.loadIndividualFiles(modId, baseDir, manifest);
    }

    // 注册 Mechanics（基于已注册的 worldview）
    this.registerBuiltinMechanics();
  }

  /**
   * 注册 WorldProvider
   */
  registerWorldProviders(): void {
    const worldviewRegistry = WorldViewRegistry.getInstance();
    const providerRegistry = WorldProviderRegistry.getInstance();

    if (worldviewRegistry.getAllIds().length > 0) {
      const randomProviderId = 'wanjie-core';
      if (!providerRegistry.has(randomProviderId)) {
        providerRegistry.register(new CoreWorldProvider(randomProviderId, '万界随机生成'));
      }
    }
  }

  /** 从 data.json（构建产物）加载合并数据 */
  private loadMergedData(modId: string, baseDir: string): boolean {
    const mergedPath = path.join(baseDir, 'data.json');
    try {
      if (!fs.existsSync(mergedPath)) return false;

      const raw = fs.readFileSync(mergedPath, 'utf-8');
      const merged = JSON.parse(raw);
      if (!merged || typeof merged !== 'object' || Array.isArray(merged)) return false;

      const worldviews = merged.worldview;
      if (worldviews && typeof worldviews === 'object' && !Array.isArray(worldviews)) {
        const registry = WorldViewRegistry.getInstance();
        for (const worldview of Object.values(worldviews as Record<string, unknown>)) {
          this.registerWorldview(worldview, registry, modId);
        }
        log.info(`Mod "${modId}": 通过 data.json 加载 ${Object.keys(worldviews).length} 个世界观`);
        return true;
      }

      return false;
    } catch (err) {
      log.warn(`Mod "${modId}": data.json 加载失败:`, err);
      return false;
    }
  }

  /** 按 dataFiles 逐文件加载 */
  private loadIndividualFiles(modId: string, baseDir: string, manifest: ModManifest): void {
    const registry = WorldViewRegistry.getInstance();

    for (const contentType of manifest.contentTypes) {
      const dataPathValue = manifest.dataFiles[contentType];
      if (!dataPathValue) continue;

      const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];

      for (const dataPath of dataPaths) {
        try {
          const filePath = path.join(baseDir, dataPath);
          if (!fs.existsSync(filePath)) {
            log.warn(`数据文件不存在: ${filePath}`);
            continue;
          }

          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(raw);

          this.registerData(modId, contentType, data, registry);
        } catch (err) {
          log.warn(`加载 ${dataPath} 失败 (${modId}):`, err);
        }
      }
    }
  }

  /** 注册单个世界观 */
  private registerWorldview(data: unknown, registry: WorldViewRegistry, modId: string): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;

    try {
      const worldview = data as WorldviewDefinition;
      registry.register(worldview);
      log.info(`注册世界观: ${worldview.id}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      log.warn(`注册世界观失败 (${modId}): ${errorMsg}`);
    }
  }

  /**
   * 将已加载的数据分发到对应注册中心
   */
  private registerData(
    modId: string,
    contentType: string,
    data: unknown,
    registry: WorldViewRegistry,
  ): void {
    switch (contentType as ModContentType) {
      case 'worldview':
        this.registerWorldview(data, registry, modId);
        break;
      case 'attributes':
        this.registerAttributes(modId, data);
        break;
      case 'races':
        this.registerRaces(modId, data);
        break;
      case 'talents':
        this.registerTalents(modId, data);
        break;
      case 'npcs':
        this.registerNPCs(modId, data);
        break;
      case 'quests':
        this.registerQuests(modId, data);
        break;
      // 尚无对应 Registry 的类型：暂存
      case 'traits':
      case 'dangers':
      case 'opportunities':
      case 'realms':
      case 'factions':
      case 'names':
      case 'text':
      case 'items':
        this.stageData(modId, contentType, data);
        break;
      default:
        log.warn(`Mod "${modId}": 未知的内容类型 "${contentType}"，跳过`);
    }
  }

  // ============================================
  // 各内容类型的注册方法
  // ============================================

  private registerAttributes(modId: string, data: unknown): void {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      log.warn(`Mod "${modId}": attributes 数据格式无效，跳过`);
      return;
    }
    try {
      const attrRegistry = AttributeRegistry.getInstance();
      const count = attrRegistry.count;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attrRegistry.registerAll(data as any);
      log.info(`Mod "${modId}": 注册了 ${attrRegistry.count - count} 个属性模板`);
    } catch (err) {
      log.warn(`Mod "${modId}": 注册 attributes 失败:`, err);
    }
  }

  private registerRaces(modId: string, data: unknown): void {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const race = data as Record<string, unknown>;
      if (race.id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          RaceRegistry.getInstance().register(race as any);
          log.info(`Mod "${modId}": 注册了种族 "${race.id}"`);
        } catch (err) {
          log.warn(`Mod "${modId}": 注册种族失败:`, err);
        }
      }
    }
  }

  private registerTalents(modId: string, data: unknown): void {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TalentRegistry.getInstance().registerAll(data as any);
        log.info(`Mod "${modId}": 注册了天赋数据`);
      } catch (err) {
        log.warn(`Mod "${modId}": 注册天赋失败:`, err);
      }
    }
  }

  private registerNPCs(modId: string, data: unknown): void {
    if (Array.isArray(data)) {
      try {
        NPCDataRegistry.getInstance().registerAll(data as NPCDefinition[]);
        log.info(`Mod "${modId}": 注册了 ${data.length} 个 NPC`);
      } catch (err) {
        log.warn(`Mod "${modId}": 注册 NPC 失败:`, err);
      }
    }
  }

  private registerQuests(modId: string, data: unknown): void {
    if (Array.isArray(data)) {
      try {
        QuestRegistry.getInstance().registerAll(data as QuestDefinition[]);
        log.info(`Mod "${modId}": 注册了 ${data.length} 个任务`);
      } catch (err) {
        log.warn(`Mod "${modId}": 注册任务失败:`, err);
      }
    }
  }

  /** 暂存尚无对应 Registry 的数据 */
  private stageData(modId: string, contentType: string, data: unknown): void {
    if (!this.stagedData.has(contentType)) {
      this.stagedData.set(contentType, new Map());
    }
    this.stagedData.get(contentType)!.set(modId, data);
    log.info(`Mod "${modId}": 暂存了 "${contentType}" 数据（尚无对应注册中心）`);
  }

  /** 获取暂存数据 */
  getStagedData(contentType: string, modId?: string): unknown {
    const typeMap = this.stagedData.get(contentType);
    if (!typeMap) return undefined;
    if (modId) return typeMap.get(modId);
    return Object.fromEntries(typeMap);
  }

  /** 注册内置 Mechanics */
  private registerBuiltinMechanics(): void {
    const worldviewRegistry = WorldViewRegistry.getInstance();
    const mechanicsRegistry = WorldMechanicsRegistry.getInstance();

    for (const worldview of worldviewRegistry.getAll()) {
      const worldTypeId = worldview.id;
      if (mechanicsRegistry.has(worldTypeId)) continue;

      const rawMechanics = worldview.mechanics as unknown as MechanicsConfig | undefined;
      if (rawMechanics?.cultivation && rawMechanics?.combat) {
        mechanicsRegistry.register(worldTypeId, buildWorldMechanics({
          worldType: worldTypeId,
          cultivation: rawMechanics.cultivation,
          combat: rawMechanics.combat,
          exploration: rawMechanics.exploration,
          uniqueMechanic: rawMechanics.uniqueMechanic,
        }));
      }
    }
  }
}
