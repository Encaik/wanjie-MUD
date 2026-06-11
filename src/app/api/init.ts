/**
 * 服务端世界系统初始化模块
 *
 * 在 API 路由首次调用时，从文件系统读取 Mod JSON 数据，
 * 注册到 WorldViewRegistry，并创建 WorldProvider。
 *
 * @module app/api/init
 */

import fs from 'fs';
import path from 'path';

import { createLogger } from '@/core/logger';
import { WorldViewRegistry } from '@/core/registry/WorldViewRegistry';
import type { WorldviewDefinition } from '@/core/registry/WorldViewRegistry';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';
import { buildWorldMechanics } from '@/modules/identity/logic/worlds/builder';
import { ModRandomWorldProvider } from '@/modules/identity/logic/worlds/ModRandomWorldProvider';

import type { MechanicsConfig } from '@/modules/identity/logic/worlds/types';

import type { ModManifest } from './mod-types';

const log = createLogger('API Init');

/** Mod 源文件根目录（服务端加载，非 public 目录） */
const MODS_DIR = path.resolve(process.cwd(), 'mods');

let initialized = false;

interface ModListEntry {
  id: string;
  path: string;
}

/**
 * 确保世界系统已初始化（幂等）
 */
export function ensureWorldSystemInitialized(): void {
  if (initialized) return;

  log.info('开始服务端世界系统初始化...');

  const entries = discoverMods();
  if (entries.length === 0) {
    log.warn('未发现 Mod 数据，世界生成将不可用');
    initialized = true;
    return;
  }

  for (const entry of entries) {
    loadModFromDisk(entry);
  }

  registerWorldProviders();
  registerBuiltinMechanics();

  initialized = true;
  log.info(`世界系统初始化完成（${WorldViewRegistry.getInstance().count} 个世界观）`);
}

// ============================================
// Mod 发现
// ============================================

/** 扫描 mods/ 目录，发现包含 mod.json 的子目录 */
function discoverMods(): ModListEntry[] {
  try {
    if (!fs.existsSync(MODS_DIR)) {
      log.warn('mods/ 目录不存在');
      return [];
    }

    const entries: ModListEntry[] = [];
    const items = fs.readdirSync(MODS_DIR, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;
      const modJsonPath = path.join(MODS_DIR, item.name, 'mod.json');
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

function readManifest(modPath: string): ModManifest | null {
  const manifestPath = path.join(MODS_DIR, modPath, 'mod.json');
  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw) as ModManifest;
  } catch (err) {
    log.warn(`读取 manifest 失败 (${modPath}):`, err);
    return null;
  }
}

// ============================================
// Mod 数据加载
// ============================================

function loadModFromDisk(entry: ModListEntry): void {
  const { id: modId, path: modPath } = entry;
  const manifest = readManifest(modPath);
  if (!manifest) return;

  const registry = WorldViewRegistry.getInstance();
  const baseDir = path.join(MODS_DIR, modPath);

  // 优先加载 data.json（构建产物），失败则回退到独立文件
  if (!loadMergedData(modId, baseDir, registry)) {
    loadIndividualFiles(modId, baseDir, manifest, registry);
  }

  log.info(`Mod "${modId}" 数据加载完成`);
}

/** 从 data.json 加载 worldview 数据 */
function loadMergedData(modId: string, baseDir: string, registry: WorldViewRegistry): boolean {
  const mergedPath = path.join(baseDir, 'data.json');
  try {
    if (!fs.existsSync(mergedPath)) return false;

    const raw = fs.readFileSync(mergedPath, 'utf-8');
    const merged = JSON.parse(raw);
    if (!merged || typeof merged !== 'object' || Array.isArray(merged)) return false;

    const worldviews = merged.worldview;
    if (worldviews && typeof worldviews === 'object' && !Array.isArray(worldviews)) {
      for (const worldview of Object.values(worldviews as Record<string, unknown>)) {
        registerWorldview(worldview, registry, modId);
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

/** 从 dataFiles 逐文件加载 */
function loadIndividualFiles(
  modId: string,
  baseDir: string,
  manifest: ModManifest,
  registry: WorldViewRegistry,
): void {
  for (const contentType of manifest.contentTypes) {
    if (contentType !== 'worldview') continue;

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
        registerWorldview(data, registry, modId);
      } catch (err) {
        log.warn(`加载 ${dataPath} 失败 (${modId}):`, err);
      }
    }
  }
}

function registerWorldview(data: unknown, registry: WorldViewRegistry, modId: string): void {
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

// ============================================
// Provider 和 Mechanics
// ============================================

function registerWorldProviders(): void {
  const worldviewRegistry = WorldViewRegistry.getInstance();
  const providerRegistry = WorldProviderRegistry.getInstance();

  if (worldviewRegistry.getAllIds().length > 0) {
    const randomProviderId = 'wanjie-core';
    if (!providerRegistry.has(randomProviderId)) {
      providerRegistry.register(new ModRandomWorldProvider(randomProviderId, '万界随机生成'));
    }
  }
}

function registerBuiltinMechanics(): void {
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

export function resetWorldSystem(): void {
  initialized = false;
  WorldViewRegistry.resetInstance();
  WorldMechanicsRegistry.resetInstance();
  WorldProviderRegistry.resetInstance();
}
