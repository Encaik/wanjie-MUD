/**
 * 服务端世界系统初始化模块
 *
 * 在 API 路由首次调用时，从文件系统读取 Mod JSON 数据，
 * 注册到 WorldDataRegistry，并创建 WorldProvider。
 *
 * 与浏览器端 ModLoader.loadAll() 功能等效，但不依赖 fetch。
 *
 * @module app/api/init
 */

import fs from 'fs';
import path from 'path';
import { WorldDataRegistry } from '@/core/registry/WorldDataRegistry';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';
import { ModRandomWorldProvider } from '@/modules/identity/logic/worlds/ModRandomWorldProvider';
import { TemplateWorldProvider } from '@/core/world/TemplateWorldProvider';
import { validateWorldTemplate } from '@/core/world/validateWorldTemplate';
import type { WorldTemplate } from '@/core/world/types';
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
import type { MechanicsConfig } from '@/modules/identity/logic/worlds/types';
import { buildWorldMechanics } from '@/modules/identity/logic/worlds/builder';
import type { ModManifest, ModList } from './mod-types';

// ============================================
// 路径常量
// ============================================

/** Mod 文件根目录（相对于项目根） */
const MODS_DIR = path.resolve(process.cwd(), 'public', 'mods');

// ============================================
// 初始化状态
// ============================================

let initialized = false;

// ============================================
// Mod 类型（精简版，避免引入 ModManifest 的 fetch 依赖）
// ============================================

/** mod-list.json 条目 */
interface ModListEntry {
  id: string;
  path: string;
}

// ============================================
// 核心初始化函数
// ============================================

/**
 * 确保世界系统已初始化
 *
 * 幂等操作：首次调用时执行全量加载，后续调用直接返回。
 * 应在每个需要世界数据的 API 路由中调用。
 */
export function ensureWorldSystemInitialized(): void {
  if (initialized) return;

  console.log('[API Init] 开始服务端世界系统初始化...');

  // 1. 发现并加载 Mod 数据
  const entries = discoverMods();
  if (entries.length === 0) {
    console.warn('[API Init] 未发现 Mod 数据，世界生成将不可用');
    initialized = true;
    return;
  }

  // 2. 加载所有 Mod
  for (const entry of entries) {
    loadModFromDisk(entry);
  }

  // 3. 注册 WorldProvider
  registerWorldProviders();

  // 4. 注册 WorldMechanics
  registerBuiltinMechanics();

  initialized = true;
  console.log('[API Init] 世界系统初始化完成');
}

// ============================================
// Mod 发现
// ============================================

/** 读取 mod-list.json，返回 Mod 条目列表 */
function discoverMods(): ModListEntry[] {
  const listPath = path.join(MODS_DIR, 'mod-list.json');
  try {
    if (!fs.existsSync(listPath)) {
      console.warn('[API Init] mod-list.json 不存在');
      return [];
    }
    const raw = fs.readFileSync(listPath, 'utf-8');
    const data = JSON.parse(raw) as ModList;
    return data.mods ?? [];
  } catch (err) {
    console.warn('[API Init] 读取 mod-list.json 失败:', err);
    return [];
  }
}

/** 读取单个 mod.json 清单 */
function readManifest(modPath: string): ModManifest | null {
  const manifestPath = path.join(MODS_DIR, modPath, 'mod.json');
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw) as ModManifest;
  } catch (err) {
    console.warn(`[API Init] 读取 manifest 失败 (${modPath}):`, err);
    return null;
  }
}

/** 加载单个 Mod 的数据并注册到 WorldDataRegistry */
function loadModFromDisk(entry: ModListEntry): void {
  const { id: modId, path: modPath } = entry;
  const manifest = readManifest(modPath);
  if (!manifest) return;

  const registry = WorldDataRegistry.getInstance();
  // dataFiles 中的路径已包含 "data/" 前缀，baseDir 直接用 mod 目录
  const baseDir = path.join(MODS_DIR, modPath);

  for (const contentType of manifest.contentTypes) {
    try {
      switch (contentType) {
        case 'world': {
          const worldList = loadJsonArray<WorldTypeData>(
            baseDir, manifest.dataFiles.world, 'worlds'
          );
          if (worldList) { registry.registerWorldTypes(worldList); }
          break;
        }
        case 'traits': {
          const traitMap = loadJsonObject<TraitPoolData>(
            baseDir, manifest.dataFiles.traits, 'traits'
          );
          if (traitMap) {
            for (const [wtId, pool] of Object.entries(traitMap)) {
              registry.registerTraitPool(wtId, pool);
            }
          }
          break;
        }
        case 'dangers': {
          const dangerList = loadJsonArray<DangerData>(
            baseDir, manifest.dataFiles.dangers, 'dangers'
          );
          if (dangerList) { registry.registerDangers(dangerList); }
          break;
        }
        case 'opportunities': {
          const oppList = loadJsonArray<OpportunityData>(
            baseDir, manifest.dataFiles.opportunities, 'opportunities'
          );
          if (oppList) { registry.registerOpportunities(oppList); }
          break;
        }
        case 'realms': {
          const realmMap = loadJsonObject<RealmSystemData>(
            baseDir, manifest.dataFiles.realms, 'realms'
          );
          if (realmMap) {
            for (const [wtId, realm] of Object.entries(realmMap)) {
              registry.registerRealmSystem(wtId, realm);
            }
          }
          break;
        }
        case 'factions': {
          const factionList = loadJsonArray<FactionTemplateData>(
            baseDir, manifest.dataFiles.factions, 'factions'
          );
          if (factionList) { registry.registerFactionTemplates(factionList); }
          break;
        }
        case 'names': {
          const nameMap = loadJsonObject<NamePoolData>(
            baseDir, manifest.dataFiles.names, 'names'
          );
          if (nameMap) {
            for (const [wtId, pool] of Object.entries(nameMap)) {
              registry.registerNamePool(wtId, pool);
            }
          }
          break;
        }
        case 'text': {
          const textMap = loadJsonObject<WorldTextData>(
            baseDir, manifest.dataFiles.text, 'text'
          );
          if (textMap) {
            for (const [wtId, entry] of Object.entries(textMap)) {
              registry.registerWorldText(wtId, entry);
            }
          }
          break;
        }
        default:
          console.warn(`[API Init] 未知内容类型: "${contentType}"`);
      }
    } catch (err) {
      console.warn(`[API Init] 加载 ${contentType} 失败:`, err);
    }
  }

  // 加载固化世界模板
  if (manifest.worldTemplates && manifest.worldTemplates.length > 0) {
    loadTemplateWorlds(modId, baseDir, manifest);
  }

  console.log(`[API Init] Mod "${modId}" 数据加载完成 (${manifest.contentTypes.length} 个数据文件)`);
}

/** 加载固化世界模板 */
function loadTemplateWorlds(
  modId: string,
  dataDir: string,
  manifest: ModManifest,
): void {
  const registry = WorldDataRegistry.getInstance();
  for (const templateId of manifest.worldTemplates ?? []) {
    const tplPath = path.join(MODS_DIR, modId, 'templates', 'worlds', `${templateId}.json`);
    try {
      if (!fs.existsSync(tplPath)) {
        console.warn(`[API Init] 模板文件不存在: ${tplPath}`);
        continue;
      }
      const raw = fs.readFileSync(tplPath, 'utf-8');
      const data = JSON.parse(raw);
      const result = validateWorldTemplate(data);
      if (!result.valid) {
        console.warn(`[API Init] 模板校验失败: ${templateId} — ${result.errors.join('; ')}`);
        continue;
      }
      registry.registerWorldTemplate(data as WorldTemplate);
      console.log(`[API Init] 注册固化模板: ${templateId}`);
    } catch (err) {
      console.warn(`[API Init] 加载模板 ${templateId} 失败:`, err);
    }
  }
}

/** 注册 WorldProvider */
function registerWorldProviders(): void {
  const registry = WorldDataRegistry.getInstance();
  const providerRegistry = WorldProviderRegistry.getInstance();

  const worldTypes = registry.getAllWorldTypes();
  if (worldTypes.length > 0) {
    const randomProviderId = 'wanjie-core';
    if (!providerRegistry.has(randomProviderId)) {
      providerRegistry.register(new ModRandomWorldProvider(randomProviderId, '万界随机生成'));
    }
  }

  const templates = registry.getAllWorldTemplates();
  for (const template of templates) {
    const providerId = `template-${template.id}`;
    if (!providerRegistry.has(providerId)) {
      providerRegistry.register(
        new TemplateWorldProvider(providerId, `固化世界: ${template.world.name}`, [template])
      );
    }
  }
}

/** 注册 WorldMechanics */
function registerBuiltinMechanics(): void {
  const dataRegistry = WorldDataRegistry.getInstance();
  const mechanicsRegistry = WorldMechanicsRegistry.getInstance();

  for (const worldTypeId of dataRegistry.getAllWorldTypes()) {
    if (mechanicsRegistry.has(worldTypeId)) continue;
    const worldData = dataRegistry.getWorldType(worldTypeId);
    if (!worldData) continue;
    const rawMechanics = worldData.mechanics as MechanicsConfig | undefined;
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

// ============================================
// JSON 文件读取工具
// ============================================

/** 读取 JSON 文件并提取数组字段 */
function loadJsonArray<T>(
  dir: string,
  filename: string | undefined,
  key: string,
): T[] | null {
  if (!filename) return null;
  const filePath = path.join(dir, filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    return (data[key] || data.data || []) as T[];
  } catch (err) {
    console.error(`[API Init] 读取 ${filePath} 失败:`, err);
    return null;
  }
}

/** 读取 JSON 文件并提取对象映射 */
function loadJsonObject<T>(
  dir: string,
  filename: string | undefined,
  key: string,
): Record<string, T> | null {
  if (!filename) return null;
  const filePath = path.join(dir, filename);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[API Init] 文件不存在: ${filePath}`);
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    return (data[key] || data) as Record<string, T>;
  } catch (err) {
    console.error(`[API Init] 读取 ${filePath} 失败:`, err);
    return null;
  }
}

/**
 * 重置初始化状态（仅用于测试）
 */
export function resetWorldSystem(): void {
  initialized = false;
  WorldDataRegistry.resetInstance();
  WorldMechanicsRegistry.resetInstance();
  WorldProviderRegistry.resetInstance();
}
