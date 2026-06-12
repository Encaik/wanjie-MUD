/**
 * sql.js → better-sqlite3 API 兼容层
 *
 * 将 sql.js (WASM SQLite) 包装为 better-sqlite3 的同步 API，
 * 使 drizzle-orm 的 better-sqlite3 驱动无需修改即可运行。
 *
 * sql.js 通过 WebAssembly 运行完整的 SQLite，零原生依赖，跨平台一致。
 *
 * @module app/api/db/sqljs-wrapper
 */

import fs from 'fs';
import type initSqlJs from 'sql.js';
import type { BindParams } from 'sql.js';

import { createLogger } from '@/core/logger';

/** sql.js 初始化后的静态类型 */
type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;

/** sql.js 数据库实例类型 */
type SqlJsDb = SqlJsStatic['Database']['prototype'];

// ============================================
// RunResult
// ============================================

/** 模拟 better-sqlite3 的 RunResult */
export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

// ============================================
// RawStatement — 返回数组而非对象
// ============================================

/** 模拟 better-sqlite3 的 raw() 模式 Statement */
class SqlJsRawStatement {
  private sqlJsDb: SqlJsDb;
  private sql: string;

  constructor(sqlJsDb: SqlJsDb, sql: string) {
    this.sqlJsDb = sqlJsDb;
    this.sql = sql;
  }

  /** 执行查询，返回第一行（数组格式） */
  get(...params: unknown[]): unknown[] | undefined {
    const stmt = this.sqlJsDb.prepare(this.sql);
    try {
      stmt.bind(params as BindParams);
      let result: unknown[] | undefined;
      if (stmt.step()) {
        result = stmt.get();
      }
      return result;
    } finally {
      stmt.free();
    }
  }

  /** 执行查询，返回所有行（数组格式） */
  all(...params: unknown[]): unknown[][] {
    const stmt = this.sqlJsDb.prepare(this.sql);
    try {
      stmt.bind(params as BindParams);
      const rows: unknown[][] = [];
      while (stmt.step()) {
        rows.push(stmt.get());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  /** 同 all() — drizzle 内部使用 */
  values(...params: unknown[]): unknown[][] {
    return this.all(...params);
  }
}

// ============================================
// Statement — 主语句类
// ============================================

/**
 * 模拟 better-sqlite3 的 Statement
 *
 * drizzle 使用的 API:
 * - run(...params) → RunResult
 * - get(...params) → T | undefined
 * - all(...params) → T[]
 * - values(...params) → unknown[][]
 * - raw() → RawStatement
 */
class SqlJsStatement {
  private wrapper: SqlJsDatabase;
  private sqlJsDb: SqlJsDb;
  private sql: string;

  constructor(wrapper: SqlJsDatabase, sqlJsDb: SqlJsDb, sql: string) {
    this.wrapper = wrapper;
    this.sqlJsDb = sqlJsDb;
    this.sql = sql;
  }

  /** 执行 INSERT/UPDATE/DELETE，返回变更数和最后插入 ID */
  run(...params: unknown[]): RunResult {
    this.sqlJsDb.run(this.sql, params as BindParams);
    const changes = this.sqlJsDb.getRowsModified();
    const lastInsertRowid = this.#readLastInsertRowid();
    this.wrapper.saveToDisk();
    return { changes, lastInsertRowid };
  }

  /** 执行 SELECT，返回第一行（对象格式） */
  get<T = Record<string, unknown>>(...params: unknown[]): T | undefined {
    const stmt = this.sqlJsDb.prepare(this.sql);
    try {
      stmt.bind(params as BindParams);
      let result: T | undefined;
      if (stmt.step()) {
        result = stmt.getAsObject() as unknown as T;
      }
      return result;
    } finally {
      stmt.free();
    }
  }

  /** 执行 SELECT，返回所有行（对象格式） */
  all<T = Record<string, unknown>>(...params: unknown[]): T[] {
    const stmt = this.sqlJsDb.prepare(this.sql);
    try {
      stmt.bind(params as BindParams);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  /** 同 all() — drizzle 内部使用 */
  values(...params: unknown[]): unknown[][] {
    return this.raw().all(...params);
  }

  /** 返回 raw 模式代理，get/all 返回数组而非对象 */
  raw(): SqlJsRawStatement {
    return new SqlJsRawStatement(this.sqlJsDb, this.sql);
  }

  // ============================================
  // 内部工具
  // ============================================

  /** 读取最后插入的 rowid */
  #readLastInsertRowid(): number {
    const stmt = this.sqlJsDb.prepare('SELECT last_insert_rowid()');
    try {
      if (stmt.step()) {
        return Number(stmt.get()[0]);
      }
      return 0;
    } finally {
      stmt.free();
    }
  }
}

// ============================================
// Transaction — 事务包装
// ============================================

/** 模拟 better-sqlite3 的 Transaction 对象 */
class SqlJsTransaction {
  private wrapper: SqlJsDatabase;
  private sqlJsDb: SqlJsDb;
  private fn: (...args: unknown[]) => unknown;

  constructor(wrapper: SqlJsDatabase, sqlJsDb: SqlJsDb, fn: (...args: unknown[]) => unknown) {
    this.wrapper = wrapper;
    this.sqlJsDb = sqlJsDb;
    this.fn = fn;
  }

  deferred(...args: unknown[]): unknown {
    return this.#runInTransaction('BEGIN DEFERRED', args);
  }

  immediate(...args: unknown[]): unknown {
    return this.#runInTransaction('BEGIN IMMEDIATE', args);
  }

  exclusive(...args: unknown[]): unknown {
    return this.#runInTransaction('BEGIN EXCLUSIVE', args);
  }

  #runInTransaction(beginSql: string, args: unknown[]): unknown {
    this.sqlJsDb.run(beginSql);
    try {
      const result = this.fn(...args);
      this.sqlJsDb.run('COMMIT');
      this.wrapper.saveToDisk();
      return result;
    } catch (err) {
      this.sqlJsDb.run('ROLLBACK');
      throw err;
    }
  }
}

// ============================================
// Database — 主数据库类
// ============================================

/**
 * 模拟 better-sqlite3 的 Database 类
 *
 * drizzle 使用的 API:
 * - prepare(sql) → Statement
 * - transaction(fn) → Transaction
 * - exec(sql) → void
 * - pragma(str) → void
 * - close() → void
 */
export class SqlJsDatabase {
  /** 内部的 sql.js 数据库实例 */
  private sqlJsDb: SqlJsDb;

  /** 数据库文件路径（用于持久化） */
  private filePath: string;

  constructor(sqlJsDb: SqlJsDb, filePath: string) {
    this.sqlJsDb = sqlJsDb;
    this.filePath = filePath;
  }

  /** 创建 Statement（drizzle 核心 API） */
  prepare(sql: string): SqlJsStatement {
    return new SqlJsStatement(this, this.sqlJsDb, sql);
  }

  /** 创建事务（drizzle 事务 API） */
  transaction(fn: (...args: unknown[]) => unknown): SqlJsTransaction {
    return new SqlJsTransaction(this, this.sqlJsDb, fn);
  }

  /** 执行 SQL 语句（用于 DDL，如 CREATE TABLE） */
  exec(sql: string): void {
    this.sqlJsDb.run(sql);
    this.#saveToDisk();
  }

  /** 设置 PRAGMA */
  pragma(str: string, opts?: { simple?: boolean }): unknown {
    const sql = `PRAGMA ${str}`;
    if (opts?.simple) {
      const stmt = this.sqlJsDb.prepare(sql);
      try {
        if (stmt.step()) {
          const row = stmt.get();
          return row[0];
        }
        return undefined;
      } finally {
        stmt.free();
      }
    }
    this.sqlJsDb.run(sql);
    return undefined;
  }

  /** 关闭数据库并持久化到磁盘 */
  close(): void {
    this.#saveToDisk();
    this.sqlJsDb.close();
  }

  /** 将内存数据库导出并写入磁盘文件 */
  saveToDisk(): void {
    this.#saveToDisk();
  }

  // ============================================
  // 内部持久化
  // ============================================

  /** 将 sql.js 内存数据库导出到磁盘文件 */
  #saveToDisk(): void {
    if (this.filePath === ':memory:') return;

    try {
      const binaryData = this.sqlJsDb.export();
      const buffer = Buffer.from(binaryData);
      fs.writeFileSync(this.filePath, buffer);
    } catch (err) {
      const log = createLogger('DB');
      log.error(`数据库持久化失败，数据可能丢失: ${this.filePath} — ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }

  // ============================================
  // 静态工厂方法
  // ============================================

  /**
   * 从磁盘文件加载数据库（文件不存在则创建空数据库）
   *
   * @param SQL - 已初始化的 sql.js 模块
   * @param filePath - 数据库文件路径
   */
  static loadFromFile(SQL: SqlJsStatic, filePath: string): SqlJsDatabase {
    if (filePath === ':memory:') {
      return new SqlJsDatabase(new SQL.Database(), ':memory:');
    }

    let sqlJsDb: SqlJsDb;
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      sqlJsDb = new SQL.Database(buffer);
    } else {
      sqlJsDb = new SQL.Database();
    }

    return new SqlJsDatabase(sqlJsDb, filePath);
  }
}
