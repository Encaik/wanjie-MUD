/**
 * SQLite 数据库 Schema（世界 & 评分）
 *
 * 使用 drizzle-orm + better-sqlite3，无需独立数据库服务。
 * 数据库文件存储在 {projectRoot}/.data/worlds.db
 *
 * @module app/api/db/schema
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================
// worlds 表
// ============================================

/** 世界存储表 */
export const worldsTable = sqliteTable('worlds', {
  /** 世界唯一标识（主键） */
  id: text('id').primaryKey(),
  /** 世界名称 */
  name: text('name').notNull(),
  /** 世界类型（修仙/高武/科技 等） */
  type: text('type').notNull(),
  /** 世界完整数据（JSON 序列化的 World 对象） */
  data: text('data').notNull(),
  /** 游戏版本号 */
  gameVersion: text('game_version'),
  /** 世界难度（easy/normal/hard/extreme） */
  difficulty: text('difficulty'),
  /** 世界基础系数 */
  baseCoefficient: real('base_coefficient'),
  /** 世界实际系数 */
  actualCoefficient: real('actual_coefficient'),
  /** 综合评价分数（1-100） */
  ratingScore: real('rating_score').default(0),
  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  /** 更新时间 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/** worlds 表插入类型 */
export type WorldRow = typeof worldsTable.$inferSelect;
/** worlds 表查询类型 */
export type InsertWorldRow = typeof worldsTable.$inferInsert;

// ============================================
// ratings 表
// ============================================

/** 世界评分表 */
export const ratingsTable = sqliteTable('ratings', {
  /** 自增主键 */
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** 世界 ID（外键） */
  worldId: text('world_id').notNull().references(() => worldsTable.id),
  /** 评分值（1-5） */
  score: integer('score').notNull(),
  /** 评论文本 */
  comment: text('comment'),
  /** 评分时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/** ratings 表查询类型 */
export type RatingRow = typeof ratingsTable.$inferSelect;
/** ratings 表插入类型 */
export type InsertRatingRow = typeof ratingsTable.$inferInsert;

// ============================================
// characters 表（V3 — 玩家角色持久化）
// ============================================

/** 角色存储表 */
export const charactersTable = sqliteTable('characters', {
  /** 角色 seed（主键） */
  seed: text('seed').primaryKey(),
  /** 关联的世界 seed */
  worldSeed: text('worldSeed').notNull().references(() => worldsTable.id),
  /** 世界观 ID */
  worldviewId: text('worldviewId').notNull(),
  /** 角色名 */
  name: text('name').notNull(),
  /** 性别 */
  gender: text('gender').notNull(),
  /** 种族 ID */
  raceId: text('raceId').notNull().default('human'),
  /** 天赋 ID 列表（JSON 数组） */
  talentIds: text('talentIds').notNull().default('[]'),
  /** 属性值（JSON） */
  attributes: text('attributes').notNull(),
  /** 核心值（JSON） */
  coreStats: text('coreStats').notNull(),
  /** NPC 模板版本号（预留 NPC 化，当前为 0） */
  npcTemplateVersion: integer('npcTemplateVersion').notNull().default(0),
  /** 创建时间 */
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  /** 更新时间 */
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

/** characters 表查询类型 */
export type CharacterRow = typeof charactersTable.$inferSelect;
/** characters 表插入类型 */
export type InsertCharacterRow = typeof charactersTable.$inferInsert;
