import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const copilotReportsTable = pgTable("copilot_reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // trend_brief | performance_report | command_response
  businessId: integer("business_id"),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(), // Claude output, markdown
  metaData: text("meta_data"), // JSON string — insights snapshot used
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCopilotReportSchema = createInsertSchema(copilotReportsTable).omit({ id: true, createdAt: true });
export type InsertCopilotReport = z.infer<typeof insertCopilotReportSchema>;
export type CopilotReport = typeof copilotReportsTable.$inferSelect;
