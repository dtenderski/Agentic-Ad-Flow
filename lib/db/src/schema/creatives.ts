import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { adsetsTable } from "./adsets";

export const creativesTable = pgTable("creatives", {
  id: serial("id").primaryKey(),
  adsetId: integer("adset_id").notNull().references(() => adsetsTable.id, { onDelete: "cascade" }),
  adName: text("ad_name").notNull(),
  format: text("format"), // single_image | video | carousel | collection
  mediaUrl: text("media_url"),
  primaryText: text("primary_text"),
  headline: text("headline"),
  description: text("description"),
  cta: text("cta"),
  destinationUrl: text("destination_url"),
  utmParams: text("utm_params"),
  policyScore: integer("policy_score"), // 0-100
  creativeScore: integer("creative_score"), // 0-100
  angle: text("angle"), // problem_solution | benefit | testimonial | hard_selling | soft_selling | educational
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCreativeSchema = createInsertSchema(creativesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCreative = z.infer<typeof insertCreativeSchema>;
export type Creative = typeof creativesTable.$inferSelect;
