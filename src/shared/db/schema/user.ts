import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable('user', {
  id: int("id").primaryKey().default(0),
  account: text("account").notNull().default(""),
  nickname: text("nickname").notNull().default(""),
  age: int("age").notNull().default(0),

})