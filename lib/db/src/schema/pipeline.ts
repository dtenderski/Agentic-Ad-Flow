import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";
import { productsTable } from "./products";

export const pipelineRunsTable = pgTable("pipeline_runs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  campaignGoal: text("campaign_goal").notNull(),
  budget: numeric("budget", { precision: 12, scale: 2 }).notNull(),
  targetLocation: text("target_location"),
  targetAgeMin: integer("target_age_min"),
  targetAgeMax: integer("target_age_max"),
  additionalContext: text("additional_context"),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  agentLog: text("agent_log"),
  blueprintId: integer("blueprint_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertPipelineRunSchema = createInsertSchema(pipelineRunsTable).omit({ id: true, createdAt: true });
export type InsertPipelineRun = z.infer<typeof insertPipelineRunSchema>;
export type PipelineRun = typeof pipelineRunsTable.$inferSelect;
