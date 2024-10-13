import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const post = sqliteTable('post', {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull().default(""),
})