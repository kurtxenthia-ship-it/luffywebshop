import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const codmAccountsTable = pgTable("codm_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  account: text("account").notNull(),
  status: text("status").notNull().default("unknown"), // 'working' | 'not_working' | 'unknown'
  coinsSpent: integer("coins_spent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codmAccountsRelations = relations(codmAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [codmAccountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertCodmAccountSchema = createInsertSchema(codmAccountsTable).omit({ id: true, createdAt: true });
export type InsertCodmAccount = z.infer<typeof insertCodmAccountSchema>;
export type CodmAccount = typeof codmAccountsTable.$inferSelect;
