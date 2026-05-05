import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const codmAccountsTable = pgTable("codm_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  account: text("account").notNull(),
  status: text("status").notNull().default("unknown"),
  coinsSpent: integer("coins_spent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codmAccountsRelations = relations(codmAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [codmAccountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const codmAccountPoolTable = pgTable("codm_account_pool", {
  id: serial("id").primaryKey(),
  rawText: text("raw_text").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  nickname: text("nickname"),
  uid: text("uid"),
  level: integer("level"),
  region: text("region"),
  accountStatus: text("account_status").notNull().default("unknown"),
  isClaimed: boolean("is_claimed").notNull().default(false),
  claimedByUserId: integer("claimed_by_user_id").references(() => usersTable.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codmAccountPoolRelations = relations(codmAccountPoolTable, ({ one }) => ({
  claimedByUser: one(usersTable, {
    fields: [codmAccountPoolTable.claimedByUserId],
    references: [usersTable.id],
  }),
}));

export const siteConfigTable = pgTable("site_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCodmAccountSchema = createInsertSchema(codmAccountsTable).omit({ id: true, createdAt: true });
export type InsertCodmAccount = z.infer<typeof insertCodmAccountSchema>;
export type CodmAccount = typeof codmAccountsTable.$inferSelect;

export const insertCodmAccountPoolSchema = createInsertSchema(codmAccountPoolTable).omit({ id: true, createdAt: true });
export type InsertCodmAccountPool = z.infer<typeof insertCodmAccountPoolSchema>;
export type CodmAccountPool = typeof codmAccountPoolTable.$inferSelect;
