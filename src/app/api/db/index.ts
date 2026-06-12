/**
 * 数据库客户端单例
 *
 * 管理 sql.js (WASM) 连接和 drizzle ORM 实例。
 * 使用 sql.js 替代 better-sqlite3，消除原生依赖，跨平台一致。
 * 首次访问时自动建表，后续复用同一实例。
 *
 * 数据目录优先级：
 * 1. 环境变量 `WANJIE_DATA_DIR`
 * 2. `{cwd}/.data`（默认）
 * 3. `/tmp/wanjie-data`（Serverless 回退）
 * 4. `:memory:`（最终回退，数据不持久）
 *
 * @module app/api/db
 */

import fs from 'fs';
import path from 'path';

import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { createLogger } from '@/core/logger';

import { SqlJsDatabase } from './sqljs-wrapper';
import * as schema from './schema';

// ============================================
// 日志 & 路径
// ============================================

const log = createLogger('DB');

/** 数据目录（可通过环境变量覆盖） */
let DATA_DIR: string;
let DB_PATH: string;

/** 数据库实例单例 */
let dbInstance: ReturnType<typeof drizzle> | null = null;

/** sql.js wrapper 实例 */
let sqliteInstance: SqlJsDatabase | null = null;

/** 上次加载时的数据库文件修改时间（用于检测跨模块写入） */
let lastLoadMtime = 0;

/** 是否为内存数据库模式 */
let isMemoryMode = false;

// ============================================
// sql.js WASM 初始化（顶层 await）
// ============================================

/**
 * 加载 sql.js WASM 二进制文件
 *
 * 在 Next.js standalone 构建中，默认的 WASM 自动定位可能失败。
 * 此处按顺序尝试多个路径，确保在开发和构建环境均可运行。
 */
function loadWasmBinary(): Buffer {
  const candidates = [
    // 1. 从 process.cwd 的标准 node_modules 结构查找
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // 2. pnpm 虚拟商店路径（<version> 通配）
    ...(() => {
      try {
        const pnpmDir = path.join(process.cwd(), 'node_modules', '.pnpm');
        if (!fs.existsSync(pnpmDir)) return [] as string[];
        return fs.readdirSync(pnpmDir)
          .filter(d => d.startsWith('sql.js@'))
          .map(d => path.join(pnpmDir, d, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'));
      } catch { return [] as string[]; }
    })(),
    // 3. 相对于源文件向上 4 层的路径（开发环境项目根 node_modules）
    path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..', '..', '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm',
    ),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate);
      }
    } catch { /* 访问权限等问题，跳过 */ }
  }

  throw new Error(
    '无法找到 sql.js 的 WASM 文件。请确保 sql.js 包已正确安装。\n' +
    `尝试的路径：\n${candidates.map(c => `  - ${c}`).join('\n')}\n` +
    '尝试运行: pnpm install',
  );
}

/** sql.js 模块引用（顶层 await 确保在首次请求前完成初始化） */
const SQL = await initSqlJs({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Buffer 运行时兼容 ArrayBuffer，但 TypeScript 类型不匹配
  wasmBinary: loadWasmBinary() as any,
});

// ============================================
// 数据目录解析
// ============================================

/**
 * 解析数据目录路径
 *
 * 按优先级尝试：环境变量 → cwd/.data → /tmp/wanjie-data → :memory:
 * 在 Serverless 环境（如 Vercel）中，cwd 通常不可写，自动回退到 /tmp/。
 */
function resolveDataDir(): { dir: string; dbPath: string; isMemory: boolean } {
  // 1. 环境变量优先
  if (process.env.WANJIE_DATA_DIR) {
    const dir = process.env.WANJIE_DATA_DIR;
    return { dir, dbPath: path.join(dir, 'worlds.db'), isMemory: false };
  }

  // 2. 默认 cwd/.data
  const defaultDir = path.resolve(process.cwd(), '.data');
  if (isWritableDirectory(defaultDir)) {
    return { dir: defaultDir, dbPath: path.join(defaultDir, 'worlds.db'), isMemory: false };
  }

  // 3. Serverless 回退：/tmp/wanjie-data
  const tmpDir = process.platform === 'win32'
    ? path.resolve(process.cwd(), '.tmp', 'wanjie-data')
    : '/tmp/wanjie-data';
  if (isWritableDirectory(tmpDir)) {
    log.warn(`默认数据目录不可写 (${defaultDir})，回退到 ${tmpDir}`);
    return { dir: tmpDir, dbPath: path.join(tmpDir, 'worlds.db'), isMemory: false };
  }

  // 4. 最终回退：内存数据库
  log.error(`所有磁盘目录不可写，回退到内存数据库（数据不持久）`);
  return { dir: ':memory:', dbPath: ':memory:', isMemory: true };
}

/** 检查目录是否可写入（不存在则尝试创建） */
function isWritableDirectory(dir: string): boolean {
  try {
    if (fs.existsSync(dir)) {
      fs.accessSync(dir, fs.constants.W_OK);
      return true;
    }
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// 遗留数据迁移
// ============================================

/**
 * 从旧默认路径迁移数据库到新路径
 *
 * 仅在当前不指向旧路径且旧路径存在文件时执行。
 * 迁移使用复制（非移动），确保旧路径保留作为备份。
 */
function migrateLegacyData(newDbPath: string): void {
  const legacyDir = path.resolve(process.cwd(), '.data');
  const legacyDbPath = path.join(legacyDir, 'worlds.db');

  if (legacyDbPath === newDbPath) return;
  if (!fs.existsSync(legacyDbPath)) return;
  if (fs.existsSync(newDbPath)) return;

  try {
    const newDir = path.dirname(newDbPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    fs.copyFileSync(legacyDbPath, newDbPath);

    // 同步复制 WAL/SHM 文件（如果存在）
    try { fs.copyFileSync(legacyDbPath + '-wal', newDbPath + '-wal'); } catch { /* 不存在则忽略 */ }
    try { fs.copyFileSync(legacyDbPath + '-shm', newDbPath + '-shm'); } catch { /* 不存在则忽略 */ }

    log.info(`遗留数据已迁移: ${legacyDbPath} → ${newDbPath}`);
  } catch (err) {
    log.warn(`遗留数据迁移失败 (${legacyDbPath} → ${newDbPath}):`, err);
  }
}

// ============================================
// 初始化
// ============================================

/** 确保数据目录和数据库文件存在 */
function ensureDatabase(): void {
  const resolved = resolveDataDir();
  DATA_DIR = resolved.dir;
  DB_PATH = resolved.dbPath;

  if (!resolved.isMemory && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  migrateLegacyData(DB_PATH);
}

/**
 * 获取数据库实例（单例，带文件变更自动重载）
 *
 * 首次调用时创建 sql.js 连接、启用配置、自动建表。
 * 后续调用检查数据库文件是否被其他模块实例修改，
 * 若文件 mtime 变更则自动重新加载，确保跨 API 路由数据一致。
 * sql.js 在模块顶层已完成初始化（顶层 await），此方法是同步的。
 */
export function getDb() {
  // 内存模式：直接使用缓存实例（数据无法跨请求共享）
  if (isMemoryMode && dbInstance) return dbInstance;

  // 检查数据库文件是否被外部修改（其他 API 路由模块写入）
  if (dbInstance && !isMemoryMode && DB_PATH) {
    try {
      const currentMtime = fs.statSync(DB_PATH).mtimeMs;
      if (currentMtime > lastLoadMtime) {
        log.debug('数据库文件已被其他模块修改，重新加载');
        closeDb();
      }
    } catch {
      // 文件可能暂时不可访问，保持当前实例
    }
  }

  if (dbInstance) return dbInstance;

  ensureDatabase();

  // 记录文件修改时间（用于后续变更检测）
  if (DB_PATH !== ':memory:') {
    try {
      lastLoadMtime = fs.statSync(DB_PATH).mtimeMs;
    } catch {
      lastLoadMtime = Date.now();
    }
  } else {
    isMemoryMode = true;
  }

  // 从文件加载（或创建空数据库）
  sqliteInstance = SqlJsDatabase.loadFromFile(SQL, DB_PATH);

  // WAL 模式（sql.js 不完全支持，但设置 pragma 不报错）
  sqliteInstance.pragma('journal_mode = WAL');
  // 外键约束
  sqliteInstance.pragma('foreign_keys = ON');

  // 将 sql.js wrapper 传给 drizzle（走 construct(params[0], params[1]) 路径）
  dbInstance = drizzle(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- sql.js wrapper 模拟 better-sqlite3 API，drizzle 运行时接受任意实现
    sqliteInstance as any,
    { schema },
  );

  // 自动建表（CREATE TABLE IF NOT EXISTS）
  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      game_version TEXT,
      difficulty TEXT,
      base_coefficient REAL,
      actual_coefficient REAL,
      rating_score REAL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id TEXT NOT NULL REFERENCES worlds(id),
      score INTEGER NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_worlds_type ON worlds(type);
    CREATE INDEX IF NOT EXISTS idx_worlds_difficulty ON worlds(difficulty);
    CREATE INDEX IF NOT EXISTS idx_worlds_created_at ON worlds(created_at);
    CREATE INDEX IF NOT EXISTS idx_ratings_world_id ON ratings(world_id);

    CREATE TABLE IF NOT EXISTS characters (
      seed TEXT PRIMARY KEY,
      worldSeed TEXT NOT NULL REFERENCES worlds(id),
      worldviewId TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      raceId TEXT NOT NULL DEFAULT 'human',
      talentIds TEXT NOT NULL DEFAULT '[]',
      attributes TEXT NOT NULL,
      coreStats TEXT NOT NULL,
      npcTemplateVersion INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_characters_worldSeed ON characters(worldSeed);
    CREATE INDEX IF NOT EXISTS idx_characters_worldviewId ON characters(worldviewId);
  `);

  log.info(`数据库已连接: ${DB_PATH}`);
  return dbInstance;
}

/**
 * 更新文件修改时间戳（在写入操作后调用，避免自写入触发不必要重载）
 */
export function touchDbMtime(): void {
  if (isMemoryMode) return;
  try {
    lastLoadMtime = fs.statSync(DB_PATH).mtimeMs;
  } catch {
    // 忽略
  }
}

/**
 * 强制从磁盘文件重新加载数据库（绕过模块级单例缓存）
 *
 * 在 Next.js dev 模式下，不同 API 路由可能拥有独立的模块实例和 dbInstance。
 * 此函数确保在关键读操作（如 getWorldById）前，数据库内容与磁盘文件一致。
 * 内存模式（:memory:）下为 no-op。
 */
export function refreshDbFromDisk(): void {
  if (isMemoryMode || !DB_PATH || DB_PATH === ':memory:') return;

  try {
    const currentMtime = fs.statSync(DB_PATH).mtimeMs;
    // 文件未变更，无需刷新
    if (currentMtime <= lastLoadMtime && dbInstance) return;
  } catch {
    // 文件不存在，保持当前实例
    return;
  }

  // 关闭旧实例，下次 getDb() 将重新从文件加载
  closeDb();
}

/**
 * 关闭数据库连接（主要用于测试或进程退出）
 */
export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    log.info('数据库已关闭');
  }
}

/**
 * 重置数据库实例（仅用于测试）
 */
export function resetDb(): void {
  closeDb();
  lastLoadMtime = 0;
  isMemoryMode = false;
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  // 清理 WAL/SHM 文件
  try { fs.unlinkSync(DB_PATH + '-wal'); } catch { /* ignore */ }
  try { fs.unlinkSync(DB_PATH + '-shm'); } catch { /* ignore */ }
}
