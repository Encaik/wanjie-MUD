import { pgTable, serial, timestamp, varchar, text, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 游戏消息表
export const gameMessages = pgTable(
  "game_messages",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    gameId: varchar("game_id", { length: 64 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    details: text("details"),
    rewards: jsonb("rewards"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("game_messages_game_id_idx").on(table.gameId),
    index("game_messages_created_at_idx").on(table.createdAt),
  ]
);

// TypeScript types
export type GameMessage = typeof gameMessages.$inferSelect;
export type InsertGameMessage = typeof gameMessages.$inferInsert;
