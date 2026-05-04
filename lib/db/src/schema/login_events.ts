import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const loginEventsTable = pgTable("login_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginEventsRelations = relations(loginEventsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [loginEventsTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertLoginEventSchema = createInsertSchema(loginEventsTable).omit({ id: true, loginAt: true });
export type InsertLoginEvent = z.infer<typeof insertLoginEventSchema>;
export type LoginEvent = typeof loginEventsTable.$inferSelect;
