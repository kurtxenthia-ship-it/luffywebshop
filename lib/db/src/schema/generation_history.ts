import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { txtFilesTable } from "./txt_files";
import { relations } from "drizzle-orm";

export const generationHistoryTable = pgTable("generation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  fileId: integer("file_id").notNull().references(() => txtFilesTable.id),
  lineCount: integer("line_count").notNull(),
  coinsSpent: integer("coins_spent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const generationHistoryRelations = relations(generationHistoryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [generationHistoryTable.userId],
    references: [usersTable.id],
  }),
  file: one(txtFilesTable, {
    fields: [generationHistoryTable.fileId],
    references: [txtFilesTable.id],
  }),
}));

export const insertGenerationHistorySchema = createInsertSchema(generationHistoryTable).omit({ id: true, createdAt: true });
export type InsertGenerationHistory = z.infer<typeof insertGenerationHistorySchema>;
export type GenerationHistory = typeof generationHistoryTable.$inferSelect;
