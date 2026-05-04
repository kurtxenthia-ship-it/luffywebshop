import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const txtFilesTable = pgTable("txt_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  totalLines: integer("total_lines").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTxtFileSchema = createInsertSchema(txtFilesTable).omit({ id: true, createdAt: true });
export type InsertTxtFile = z.infer<typeof insertTxtFileSchema>;
export type TxtFile = typeof txtFilesTable.$inferSelect;
