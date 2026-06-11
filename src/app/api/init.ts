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

import { createLogger } from '@/core/logger';
import { WorldDataRegistry } from '@/core/registry/WorldDataRegistry';
import { WorldMechanicsRegistry } from '@/core/registry/WorldMechanicsRegistry';
import { TemplateWorldProvider } from '@/core/world/TemplateWorldProvider';
import { validateWorldTemplate } from '@/core/world/validateWorldTemplate';
import { WorldProviderRegistry } from '@/core/world/WorldProviderRegistry';
import { buildWorldMechanics } from '@/modules/identity/logic/worlds/builder';
import { ModRandomWorldProvider } from '@/modules/identity/logic/worlds/ModRandomWorldProvider';

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
import type { MechanicsConfig } from '@/modules/identity/logic/worlds/types';

import type { ModManifest, ModList } from './mod-types';

// ============================================
// 日志 & 路径常量
// ============================================

/** 核心日志实例 */
const log = createLogger('API Init');

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
// 世界观组装（WorldTypeData → WorldviewDefinition）
// ============================================

/**
 * 从已注册的各类数据组装 WorldviewDefinition
 *
 * Mod JSON 数据分散在多个文件中（world/*.json 定义基本信息，
 * traits/*.json 定义特性池，names/*.json 定义名称池等）。
 *
 * 此函数在所有 Mod 加载完成后，从注册中心读取各部件数据，
 * 组装成完整的 WorldviewDefinition 并注册。
 */
function assembleWorldviews(): void {
  const registry = WorldDataRegistry.getInstance();
  const worldTypes = registry.getAllWorldTypeData();

  if (worldTypes.length === 0) {
    log.info('没有旧 WorldTypeData，跳过 worldview 组装');
    return;
  }

  let assembledCount = 0;
  for (const wt of worldTypes) {
    const id = wt.type; // English kebab-case ID

    // 收集各部件的注册数据
    const realmSystem = registry.getRealmSystem(id);
    const traitPool = registry.getTraitPool(id);
    const namePool = registry.getNamePool(id);
    const textData = registry.getWorldText(id);
    const rewardCoeff = registry.getRewardCoefficient(id);

    // 构建 WorldviewDefinition
    const worldview: import('@/core/registry/WorldDataRegistry').WorldviewDefinition = {
      id,
      name: wt.name,
      description: wt.description,
      version: '0.1.0', // Mod JSON 中暂未有 version 字段，使用默认值
      baseCoefficient: wt.baseCoefficient,
      rewardCoefficient: rewardCoeff ?? {
        expCoefficient: 1.0,
        spiritStoneCoefficient: 1.0,
        dropCoefficient: 1.0,
        rarityBonus: { rare: 0, epic: 0, legendary: 0, mythic: 0 },
        specialRewards: { ascensionMarkBonus: 0, titleChance: 0, specialItemChance: 0 },
      },
      stats: wt.stats ?? {
        baseHp: 100, hpPerLevel: 10, hpPerConstitution: 5,
        baseAttack: 10, attackPerLevel: 2, attackPerConstitution: 1,
        attackPerSpiritRoot: 2, baseDefense: 5, defensePerLevel: 1,
        defensePerWillpower: 1, enemyAttackBonus: 0, enemyDefenseBonus: 0,
        statDisplayNames: {},
      },
      realmSystem: realmSystem ?? {
        mainRealmName: '境界', subRealmName: '阶', tiers: [],
      },
      namePrefixes: wt.namePrefixes,
      nameSuffixes: wt.nameSuffixes,
      descriptions: wt.descriptions,
      powerSystems: wt.powerSystems ?? [wt.name],
      majorForces: wt.majorForces ?? [],
      dangers: registry.getDangersForWorld(id),
      opportunities: registry.getOpportunitiesForWorld(id),
      factions: registry.getFactionTemplates(id),
      traits: traitPool ?? {
        origin: {} as Record<string, unknown>,
        trait: {} as Record<string, unknown>,
        personality: {} as Record<string, unknown>,
        talent: {} as Record<string, unknown>,
      } as import('@/core/registry/WorldDataRegistry').TraitPoolData,
      namePool: namePool ?? { surnames: [], maleNames: [], femaleNames: [] },
      texts: (textData as unknown as import('@/core/registry/WorldDataRegistry').WorldTextDefinition) ?? {
        name: wt.name,
        description: wt.description,
        terminology: {} as import('@/core/registry/WorldDataRegistry').WorldTerminology,
        stats: {} as import('@/core/registry/WorldDataRegistry').WorldStatNames,
        combat: {} as import('@/core/registry/WorldDataRegistry').WorldCombatTexts,
        cultivation: {} as import('@/core/registry/WorldDataRegistry').WorldCultivationTexts,
        resource: {} as import('@/core/registry/WorldDataRegistry').WorldResourceTexts,
        item: {} as import('@/core/registry/WorldDataRegistry').WorldItemTexts,
        dungeon: {} as import('@/core/registry/WorldDataRegistry').WorldDungeonTexts,
        ui: {} as import('@/core/registry/WorldDataRegistry').WorldUITexts,
        breakthrough: {} as import('@/core/registry/WorldDataRegistry').WorldBreakthroughTexts,
        message: {} as import('@/core/registry/WorldDataRegistry').WorldMessageTexts,
        paths: {} as import('@/core/registry/WorldDataRegistry').WorldPathTexts,
      },
      mechanics: wt.mechanics ?? {},
      visualConfig: wt.visualConfig ?? {
        icon: '🌐',
        accentColor: 'text-slate-400',
        gradientClass: 'from-slate-500/20 to-slate-600/10',
        borderColor: 'border-slate-500/30',
        bgGradient: 'bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30',
        colorGradient: 'from-slate-500 to-gray-500',
      },
      builtin: wt.builtin ?? false,
    };

    registry.registerWorldview(worldview);
    assembledCount++;
  }

  log.info(`已从 ${worldTypes.length} 个 WorldTypeData 组装 ${assembledCount} 个 WorldviewDefinition`);
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

  log.info('开始服务端世界系统初始化...');

  // 1. 发现并加载 Mod 数据
  const entries = discoverMods();
  if (entries.length === 0) {
    log.warn('未发现 Mod 数据，世界生成将不可用');
    initialized = true;
    return;
  }

  // 2. 加载所有 Mod
  for (const entry of entries) {
    loadModFromDisk(entry);
  }

  // 2.5 从已注册数据组装 WorldviewDefinition（世界观→世界 新架构）
  assembleWorldviews();

  // 3. 注册 WorldProvider
  registerWorldProviders();

  // 4. 注册 WorldMechanics
  registerBuiltinMechanics();

  initialized = true;
  log.info('世界系统初始化完成');
}

// ============================================
// Mod 发现
// ============================================

/** 读取 mod-list.json，返回 Mod 条目列表 */
function discoverMods(): ModListEntry[] {
  const listPath = path.join(MODS_DIR, 'mod-list.json');
  try {
    if (!fs.existsSync(listPath)) {
      log.warn('mod-list.json 不存在');
      return [];
    }
    const raw = fs.readFileSync(listPath, 'utf-8');
    const data = JSON.parse(raw) as ModList;
    return data.mods ?? [];
  } catch (err) {
    log.warn('读取 mod-list.json 失败:', err);
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
    log.warn(`读取 manifest 失败 (${modPath}):`, err);
    return null;
  }
}

/**
 * 已知内容类型的注册处理器
 *
 * 使用映射表替代 switch 语句以降低圈复杂度。
 * 每个处理器接收解析后的 JSON 数据和注册中心实例。
 */
const CONTENT_HANDLERS: Record<string, (data: Record<string, unknown>, registry: WorldDataRegistry) => void> = {
  world: (data, registry) => {
    // 格式1: 独立世界文件——数据在 JSON 根级别（data/world/*.json）
    if (typeof data.type === 'string' && typeof data.id === 'number') {
      registry.registerWorldType(data as unknown as WorldTypeData);
      return;
    }
    // 格式2: 数组合集——{worlds: [...]} 或 {data: [...]}
    const worldList = extractArray<WorldTypeData>(data, 'worlds');
    if (worldList.length > 0) { registry.registerWorldTypes(worldList); return; }
    // 格式3: 对象映射——{world: {type1: {...}, type2: {...}}}（旧 data.json 合集格式）
    const worldMap = (data as Record<string, unknown>).world;
    if (worldMap && typeof worldMap === 'object' && !Array.isArray(worldMap)) {
      const objects = Object.values(worldMap as Record<string, unknown>);
      const typed = objects.filter(
        (o): o is WorldTypeData =>
          typeof o === 'object' && o !== null && 'type' in o && 'id' in o
      );
      if (typed.length > 0) registry.registerWorldTypes(typed);
    }
  },
  traits: (data, registry) => {
    const traitMap = extractObject<TraitPoolData>(data, 'traits');
    for (const [wtId, pool] of Object.entries(traitMap)) {
      registry.registerTraitPool(wtId, pool);
    }
  },
  dangers: (data, registry) => {
    const dangerList = extractArray<DangerData>(data, 'dangers');
    if (dangerList.length > 0) { registry.registerDangers(dangerList); }
  },
  opportunities: (data, registry) => {
    const oppList = extractArray<OpportunityData>(data, 'opportunities');
    if (oppList.length > 0) { registry.registerOpportunities(oppList); }
  },
  realms: (data, registry) => {
    const realmMap = extractObject<RealmSystemData>(data, 'realms');
    for (const [wtId, realm] of Object.entries(realmMap)) {
      registry.registerRealmSystem(wtId, realm);
    }
  },
  factions: (data, registry) => {
    const factionList = extractArray<FactionTemplateData>(data, 'factions');
    if (factionList.length > 0) { registry.registerFactionTemplates(factionList); }
  },
  names: (data, registry) => {
    const nameMap = extractObject<NamePoolData>(data, 'names');
    for (const [wtId, pool] of Object.entries(nameMap)) {
      registry.registerNamePool(wtId, pool);
    }
  },
  text: (data, registry) => {
    const textMap = extractObject<WorldTextData>(data, 'text');
    for (const [wtId, entry] of Object.entries(textMap)) {
      registry.registerWorldText(wtId, entry);
    }
  },
};

/**
 * 加载单个数据文件并分发注册到 WorldDataRegistry
 *
 * 根据 content type 查找对应的处理器，提取自 loadModFromDisk 以降低圈复杂度。
 */
function registerDataFile(
  contentType: string,
  data: Record<string, unknown>,
  registry: WorldDataRegistry,
): void {
  const handler = CONTENT_HANDLERS[contentType];
  if (handler) {
    handler(data, registry);
  } else {
    log.warn(`未知内容类型: "${contentType}"`);
  }
}

/** 加载单个 Mod 的数据并注册到 WorldDataRegistry */
function loadModFromDisk(entry: ModListEntry): void {
  const { id: modId, path: modPath } = entry;
  const manifest = readManifest(modPath);
  if (!manifest) return;

  const registry = WorldDataRegistry.getInstance();
  const baseDir = path.join(MODS_DIR, modPath);

  for (const contentType of manifest.contentTypes) {
    const dataPathValue = manifest.dataFiles[contentType];
    if (!dataPathValue) {
      log.warn(`Mod "${modId}" 的 contentTypes 包含 "${contentType}" 但 dataFiles 中未配置路径，跳过`);
      continue;
    }

    // 归一化为数组，与浏览器端 ModLoader 保持一致
    const dataPaths = Array.isArray(dataPathValue) ? dataPathValue : [dataPathValue];

    for (const dataPath of dataPaths) {
      try {
        const filePath = path.join(baseDir, dataPath);
        if (!fs.existsSync(filePath)) {
          log.warn(`数据文件不存在: ${filePath}`);
          continue;
        }

        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        registerDataFile(contentType, data, registry);
      } catch (err) {
        log.warn(`加载 ${contentType} 失败 (${modId}):`, err);
      }
    }
  }

  // 加载固化世界模板
  if (manifest.worldTemplates && manifest.worldTemplates.length > 0) {
    loadTemplateWorlds(baseDir, manifest);
  }

  log.info(`Mod "${modId}" 数据加载完成 (${manifest.contentTypes.length} 个内容类型)`);
}

/** 加载固化世界模板 */
function loadTemplateWorlds(
  dataDir: string,
  manifest: ModManifest,
): void {
  const registry = WorldDataRegistry.getInstance();
  for (const templateId of manifest.worldTemplates ?? []) {
    const tplPath = path.join(dataDir, 'templates', 'worlds', `${templateId}.json`);
    try {
      if (!fs.existsSync(tplPath)) {
        log.warn(`模板文件不存在: ${tplPath}`);
        continue;
      }
      const raw = fs.readFileSync(tplPath, 'utf-8');
      const data = JSON.parse(raw);
      const result = validateWorldTemplate(data);
      if (!result.valid) {
        log.warn(`模板校验失败: ${templateId} — ${result.errors.join('; ')}`);
        continue;
      }
      registry.registerWorldTemplate(data as WorldTemplate);
      log.info(`注册固化模板: ${templateId}`);
    } catch (err) {
      log.warn(`加载模板 ${templateId} 失败:`, err);
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
// JSON 数据提取工具
// ============================================

/**
 * 从 JSON 对象中提取数组字段
 *
 * @param data - 已解析的 JSON 对象
 * @param key - 目标字段名，优先取此字段；不存在时回退到 `data` 字段
 * @returns 提取的数组（未找到时返回空数组）
 */
function extractArray<T>(data: Record<string, unknown>, key: string): T[] {
  const value = data[key] ?? data.data;
  if (Array.isArray(value)) return value as T[];
  return [];
}

/**
 * 从 JSON 对象中提取对象映射
 *
 * @param data - 已解析的 JSON 对象
 * @param key - 目标字段名，优先取此字段；不存在时回退到整个对象
 * @returns 提取的对象映射
 */
function extractObject<T>(data: Record<string, unknown>, key: string): Record<string, T> {
  const value = data[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, T>;
  }
  // 回退：整个 data 本身就是映射
  if (Object.keys(data).length > 0) {
    // 过滤掉可能的元数据字段
    const filtered: Record<string, T> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        filtered[k] = v as T;
      }
    }
    if (Object.keys(filtered).length > 0) return filtered;
  }
  return {};
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
