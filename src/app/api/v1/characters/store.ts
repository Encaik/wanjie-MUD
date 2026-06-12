/**
 * 角色持久化存储（SQLite）
 *
 * 存储玩家创建的角色，支持按 worldSeed 查询（未来实现跨玩家 NPC 遭遇）。
 *
 * @module app/api/v1/characters/store
 */

import { eq, desc } from 'drizzle-orm';
import { getDb } from '@/app/api/db';
import { charactersTable } from '@/app/api/db/schema';

/** 角色存储格式（API 返回用） */
export interface StoredCharacter {
  seed: string;
  worldSeed: string;
  worldviewId: string;
  name: string;
  gender: string;
  raceId: string;
  talentIds: string[];
  attributes: Record<string, number | string>;
  coreStats: Record<string, number>;
  npcTemplateVersion: number;
  createdAt: string;
  updatedAt: string;
}

type DbCharRow = typeof charactersTable.$inferSelect;

function rowToCharacter(row: DbCharRow): StoredCharacter {
  return {
    seed: row.seed,
    worldSeed: row.worldSeed,
    worldviewId: row.worldviewId,
    name: row.name,
    gender: row.gender,
    raceId: row.raceId,
    talentIds: (JSON.parse(row.talentIds as string) || []) as string[],
    attributes: JSON.parse(row.attributes as string) as Record<string, number | string>,
    coreStats: JSON.parse(row.coreStats as string) as Record<string, number>,
    npcTemplateVersion: row.npcTemplateVersion,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

/**
 * 保存角色（UPSERT）
 */
export function saveCharacter(data: {
  seed: string;
  worldSeed: string;
  worldviewId: string;
  name: string;
  gender: string;
  raceId: string;
  talentIds: string[];
  attributes: Record<string, number | string>;
  coreStats: Record<string, number>;
}): StoredCharacter {
  const db = getDb();
  const now = new Date();

  const existing = db.select({ seed: charactersTable.seed })
    .from(charactersTable)
    .where(eq(charactersTable.seed, data.seed))
    .get();

  if (existing) {
    db.update(charactersTable)
      .set({
        name: data.name,
        gender: data.gender,
        raceId: data.raceId,
        talentIds: JSON.stringify(data.talentIds),
        attributes: JSON.stringify(data.attributes),
        coreStats: JSON.stringify(data.coreStats),
        updatedAt: now,
      })
      .where(eq(charactersTable.seed, data.seed))
      .run();
  } else {
    db.insert(charactersTable).values({
      seed: data.seed,
      worldSeed: data.worldSeed,
      worldviewId: data.worldviewId,
      name: data.name,
      gender: data.gender,
      raceId: data.raceId,
      talentIds: JSON.stringify(data.talentIds),
      attributes: JSON.stringify(data.attributes),
      coreStats: JSON.stringify(data.coreStats),
      npcTemplateVersion: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  return {
    ...data,
    npcTemplateVersion: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * 按世界 seed 查询角色列表
 */
export function getCharactersByWorldSeed(
  worldSeed: string,
  limit = 20,
): StoredCharacter[] {
  const db = getDb();
  const rows = db.select()
    .from(charactersTable)
    .where(eq(charactersTable.worldSeed, worldSeed))
    .orderBy(desc(charactersTable.createdAt))
    .limit(limit)
    .all();

  return rows.map(rowToCharacter);
}

/**
 * 按 seed 获取单个角色
 */
export function getCharacterBySeed(seed: string): StoredCharacter | null {
  const db = getDb();
  const row = db.select()
    .from(charactersTable)
    .where(eq(charactersTable.seed, seed))
    .get();

  return row ? rowToCharacter(row) : null;
}
