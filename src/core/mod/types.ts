/**
 * Mod 系统共享类型
 *
 * 定义 IModLoader 接口、内容类型枚举、加载状态类型。
 * 纯类型模块，无 I/O、无运行时依赖。
 *
 * @module core/mod
 */

// ============================================
// 内容类型
// ============================================

/** 服务端 Mod 内容类型（数据包） */
export type ServerModContentType =
  | 'worldview'
  | 'attributes'
  | 'races'
  | 'talents'
  | 'npcs'
  | 'quests'
  | 'traits'
  | 'dangers'
  | 'opportunities'
  | 'realms'
  | 'factions'
  | 'names'
  | 'text'
  | 'items';

/** 客户端 Mod 内容类型（主题/样式包） */
export type ClientModContentType =
  | 'styles'
  | 'theme';

/** Mod 可提供的全部内容类型 */
export type ModContentType = ServerModContentType | ClientModContentType;

/** 所有支持的 Mod 内容类型列表 */
export const ALL_MOD_CONTENT_TYPES: ModContentType[] = [
  'worldview',
  'attributes',
  'races',
  'talents',
  'npcs',
  'quests',
  'traits',
  'dangers',
  'opportunities',
  'realms',
  'factions',
  'names',
  'text',
  'items',
  'styles',
  'theme',
];

// ============================================
// 加载状态
// ============================================

/** Mod 加载阶段 */
export type ModLoadPhase = 'idle' | 'loading' | 'ready' | 'error';

/** Mod 单个条目加载状态 */
export type ModLoadStatus = 'pending' | 'loading' | 'loaded' | 'error';

/** 加载进度事件 */
export interface ModLoadProgress {
  /** 当前正在加载的 Mod 编号（从 1 开始） */
  current: number;
  /** 待加载 Mod 总数 */
  total: number;
  /** 当前正在加载的 Mod ID */
  currentModId: string;
}

/** 单次加载结果 */
export interface ModLoadResult {
  /** 成功加载的 Mod 数量 */
  loaded: number;
  /** 加载失败的 Mod 数量 */
  failed: number;
  /** 扫描到的 Mod 总数 */
  total: number;
  /** 失败详情列表 */
  errors?: Array<{ id: string; name: string; error: string }>;
}

/** 发现到的 Mod 条目 */
export interface ModEntry {
  id: string;
  path: string;
}

// ============================================
// IModLoader 接口
// ============================================

/**
 * Mod 加载器接口
 *
 * 服务端和客户端加载器都实现此接口。
 * - 服务端：通过 fs 扫描 mods/ 目录，同步加载数据
 * - 客户端：通过 fetch 从 public/mods/ 加载主题/样式
 */
export interface IModLoader {
  /** 发现可用的 Mod 列表 */
  discover(): Promise<ModEntry[]>;

  /** 加载所有 Mod 并注册 */
  loadAll(): Promise<ModLoadResult>;

  /** 获取已加载的 Mod 列表 */
  getLoadedMods(): LoadedMod[];

  /** 获取加载失败的 Mod 列表 */
  getFailedMods(): Array<{ id: string; name: string; error: string }>;
}

// ============================================
// 加载器回调类型
// ============================================

/** Mod 加载进度事件的回调类型 */
export type ModProgressCallback = (event: ModLoadProgress) => void;

/** Mod 加载完成事件的回调类型 */
export type ModCompleteCallback = (event: ModLoadResult) => void;

// ============================================
// Mod 加载错误
// ============================================

/** Mod 加载失败错误 */
export class ModLoadError extends Error {
  /** 失败的 Mod 列表 */
  failedMods: Array<{ id: string; name: string; error: string }>;

  constructor(failedMods: Array<{ id: string; name: string; error: string }>) {
    const names = failedMods.map(m => `"${m.name || m.id}"`).join('、');
    super(`Mod 加载失败: ${names}`);
    this.name = 'ModLoadError';
    this.failedMods = failedMods;
  }
}

// ============================================
// 已加载 Mod 运行时状态
// ============================================

/** 加载完成的 Mod 信息（运行时状态） */
export interface LoadedMod {
  /** Mod 清单 */
  manifest: import('./ModManifest').ModManifest;
  /** 加载状态 */
  status: ModLoadStatus;
  /** 错误信息（仅 status === 'error' 时有值） */
  error?: string;
}
