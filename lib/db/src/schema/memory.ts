import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const agentMemoryTable = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  winningAudience: text("winning_audience"),
  winningCopy: text("winning_copy"),
  winningHeadline: text("winning_headline"),
  winningCta: text("winning_cta"),
  winningOffer: text("winning_offer"),
  failedPattern: text("failed_pattern"),
  policyIssue: text("policy_issue"),
  optimizationHistory: text("optimization_history"), // JSON string
  learningSummary: text("learning_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAgentMemorySchema = createInsertSchema(agentMemoryTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemoryTable.$inferSelect;
