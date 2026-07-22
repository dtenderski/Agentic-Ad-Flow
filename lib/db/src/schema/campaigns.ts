import { pgTable, text, serial, timestamp, integer, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  metaCampaignId: text("meta_campaign_id"),
  blueprintId: integer("blueprint_id"),
  campaignName: text("campaign_name").notNull(),
  objective: text("objective").notNull(), // AWARENESS | TRAFFIC | ENGAGEMENT | LEADS | APP_PROMOTION | SALES
  status: text("status").notNull().default("draft"), // draft | review | approved | active | learning | optimizing | scaling | paused | completed
  budgetType: text("budget_type"), // daily | lifetime
  dailyBudget: numeric("daily_budget", { precision: 12, scale: 2 }),
  lifetimeBudget: numeric("lifetime_budget", { precision: 12, scale: 2 }),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending | approved | rejected
  specialAdCategory: boolean("special_ad_category").default(false),
  campaignBudgetOptimization: boolean("campaign_budget_optimization").default(false),
  createdByAgent: boolean("created_by_agent").default(false),
  approvedByUser: boolean("approved_by_user").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
