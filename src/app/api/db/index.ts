/**
 * 数据库客户端单例
 *
 * 管理 better-sqlite3 连接和 drizzle ORM 实例。
 * 首次访问时自动建表，后续复用同一实例。
 *
 * @module app/api/db
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// ============================================
// 路径 & 单例
// ============================================

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'worlds.db');

let dbInstance: ReturnType<typeof drizzle> | null = null;
let sqliteInstance: Database.Database | null = null;

// ============================================
// 初始化
// ============================================

/** 确保数据目录和数据库文件存在 */
function ensureDatabase(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * 获取数据库实例（单例）
 *
 * 首次调用时创建连接、启用 WAL 模式、自动建表。
 * 后续调用返回同一实例。
 */
export function getDb() {
  if (dbInstance) return dbInstance;

  ensureDatabase();

  sqliteInstance = new Database(DB_PATH);

  // WAL 模式：读写并发不互斥
  sqliteInstance.pragma('journal_mode = WAL');
  // 外键约束
  sqliteInstance.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqliteInstance, { schema });

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
  `);

  console.log(`[DB] 数据库已连接: ${DB_PATH}`);
  return dbInstance;
}

/**
 * 关闭数据库连接（主要用于测试或进程退出）
 */
export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    console.log('[DB] 数据库已关闭');
  }
}

/**
 * 重置数据库实例（仅用于测试）
 */
export function resetDb(): void {
  closeDb();
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  // 清理 WAL/SHM 文件
  try { fs.unlinkSync(DB_PATH + '-wal'); } catch { /* ignore */ }
  try { fs.unlinkSync(DB_PATH + '-shm'); } catch { /* ignore */ }
}
