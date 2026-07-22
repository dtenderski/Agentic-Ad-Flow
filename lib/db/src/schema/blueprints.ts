import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blueprintsTable = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  pipelineRunId: integer("pipeline_run_id").notNull(),
  title: text("title").notNull(),
  businessContext: text("business_context"),       // JSON string
  campaignStrategy: text("campaign_strategy"),     // JSON string
  audiencePlan: text("audience_plan"),             // JSON string
  offerStrategy: text("offer_strategy"),           // JSON string
  creativeBlueprint: text("creative_blueprint"),   // JSON string
  budgetPlan: text("budget_plan"),                 // JSON string
  policyReview: text("policy_review"),             // JSON string
  conversionReadinessScore: integer("conversion_readiness_score"),
  policyRiskScore: integer("policy_risk_score"),
  creativeStrengthScore: integer("creative_strength_score"),
  funnelFitScore: integer("funnel_fit_score"),
  approvalStatus: text("approval_status").notNull().default("draft"), // draft | needs_revision | approved | published
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBlueprintSchema = createInsertSchema(blueprintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type Blueprint = typeof blueprintsTable.$inferSelect;
