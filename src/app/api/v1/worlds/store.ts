/**
 * 世界持久化存储（SQLite 版）
 *
 * 基于 drizzle-orm + better-sqlite3，无需独立数据库服务。
 * 数据库文件：{projectRoot}/.data/worlds.db
 */

import { eq, sql, desc } from 'drizzle-orm';

import { getDb, touchDbMtime } from '@/app/api/db';
import { worldsTable, ratingsTable } from '@/app/api/db/schema';
import { createLogger } from '@/core/logger';
import type { World } from '@/core/types';
import type { WorldRatingsMap, RatingData } from '@/core/world/types';

/** 日志实例 */
const log = createLogger('DB:Worlds');

// ============================================
// 内部工具
// ============================================

/** 解析存储的 World 对象 */
function rowToWorld(row: { data: string }): World {
  return JSON.parse(row.data) as World;
}

/** 序列化 World 对象 */
function worldToJson(world: World): string {
  return JSON.stringify(world);
}

/** 从 World 对象提取查询用字段 */
function extractFields(world: World) {
  return {
    name: world.name,
    type: world.type,
    gameVersion: world.gameVersion,
    difficulty: world.difficulty,
    baseCoefficient: world.baseCoefficient,
    actualCoefficient: world.actualCoefficient,
    ratingScore: world.ratingScore,
  };
}

// ============================================
// 世界 CRUD
// ============================================

/**
 * 保存单个世界（UPSERT）
 */
export function saveWorld(world: World): World {
  const db = getDb();
  const now = new Date();

  const existing = db.select({ id: worldsTable.id })
    .from(worldsTable)
    .where(eq(worldsTable.id, world.id))
    .get();

  if (existing) {
    log.debug(`saveWorld: UPDATE ${world.id}`);
    db.update(worldsTable)
      .set({
        data: worldToJson(world),
        updatedAt: now,
        ...extractFields(world),
      })
      .where(eq(worldsTable.id, world.id))
      .run();
  } else {
    log.debug(`saveWorld: INSERT ${world.id}`);
    db.insert(worldsTable).values({
      id: world.id,
      data: worldToJson(world),
      createdAt: now,
      updatedAt: now,
      ...extractFields(world),
    }).run();
  }

  // 同步文件修改时间戳，避免其他模块将本次写入误判为外部变更
  touchDbMtime();

  return world;
}

/**
 * 分页查询世界列表
 */
export function queryWorlds(
  page = 1,
  limit = 20,
): { worlds: World[]; total: number; page: number; limit: number } {
  const db = getDb();

  const totalResult = db.select({ count: sql<number>`count(*)` }).from(worldsTable).get();
  const total = totalResult?.count ?? 0;

  const rows = db.select({ data: worldsTable.data })
    .from(worldsTable)
    .orderBy(desc(worldsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return { worlds: rows.map(rowToWorld), total, page, limit };
}

/**
 * 按世界类型筛选
 */
export function queryWorldsByType(
  worldType: string,
  page = 1,
  limit = 20,
): { worlds: World[]; total: number; page: number; limit: number } {
  const db = getDb();

  const totalResult = db.select({ count: sql<number>`count(*)` })
    .from(worldsTable)
    .where(eq(worldsTable.type, worldType))
    .get();
  const total = totalResult?.count ?? 0;

  const rows = db.select({ data: worldsTable.data })
    .from(worldsTable)
    .where(eq(worldsTable.type, worldType))
    .orderBy(desc(worldsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();

  return { worlds: rows.map(rowToWorld), total, page, limit };
}

/**
 * 根据 ID（即 seed）获取世界
 *
 * 在 Next.js dev 模式下，不同 API 路由编译为独立模块，
 * 各自持有 sql.js 内存实例。getDb() 内部通过文件 mtime
 * 检测外部模块写入并自动重新加载，确保跨模块数据一致。
 */
export function getWorldById(id: string): World | null {
  const db = getDb();
  const row = db.select({ data: worldsTable.data })
    .from(worldsTable)
    .where(eq(worldsTable.id, id))
    .get();
  const found = row ? true : false;
  log.debug(`getWorldById: ${id} → ${found ? '找到' : '未找到'}`);
  return row ? rowToWorld(row) : null;
}

/**
 * 删除世界
 */
export function deleteWorld(id: string): boolean {
  const db = getDb();
  const result = db.delete(worldsTable).where(eq(worldsTable.id, id)).run();
  return result.changes > 0;
}

/**
 * 获取世界总数
 */
export function getWorldCount(): number {
  const db = getDb();
  const result = db.select({ count: sql<number>`count(*)` }).from(worldsTable).get();
  return result?.count ?? 0;
}

// ============================================
// 评分 CRUD
// ============================================

/** 读取所有评分（聚合，兼容 WorldRatingsMap 格式） */
export function readRatings(): WorldRatingsMap {
  const db = getDb();

  const rows = db.select({
    worldId: ratingsTable.worldId,
    avgScore: sql<number>`AVG(${ratingsTable.score})`,
    count: sql<number>`COUNT(*)`,
    lastRated: sql<number>`MAX(${ratingsTable.createdAt})`,
    comments: sql<string>`GROUP_CONCAT(${ratingsTable.comment}, ';')`,
  })
    .from(ratingsTable)
    .groupBy(ratingsTable.worldId)
    .all();

  const result: WorldRatingsMap = {};
  for (const row of rows) {
    result[row.worldId] = {
      totalScore: row.avgScore * row.count,
      ratingCount: row.count,
      lastRated: row.lastRated,
      comments: row.comments ? row.comments.split(';').filter(Boolean) : [],
    };
  }
  return result;
}

/** 保存一条评分，同步更新世界的 ratingScore */
export function saveRating(worldId: string, score: number, comment?: string): RatingData {
  const db = getDb();

  db.insert(ratingsTable).values({
    worldId,
    score,
    comment: comment ?? null,
    createdAt: new Date(),
  }).run();

  const avgResult = db.select({
    avg: sql<number>`AVG(${ratingsTable.score})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(ratingsTable)
    .where(eq(ratingsTable.worldId, worldId))
    .get();

  if (avgResult) {
    db.update(worldsTable)
      .set({ ratingScore: avgResult.avg })
      .where(eq(worldsTable.id, worldId))
      .run();
  }

  return {
    totalScore: score + (avgResult ? (avgResult.avg * (avgResult.count - 1)) : 0),
    ratingCount: avgResult?.count ?? 1,
    lastRated: Date.now(),
    comments: comment ? [comment] : [],
  };
}
