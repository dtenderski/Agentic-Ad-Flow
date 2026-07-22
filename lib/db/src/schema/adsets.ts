import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { campaignsTable } from "./campaigns";

export const adsetsTable = pgTable("adsets", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaignsTable.id, { onDelete: "cascade" }),
  metaAdsetId: text("meta_adset_id"),
  adsetName: text("adset_name").notNull(),
  audienceName: text("audience_name"),
  location: text("location"),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  gender: text("gender"),
  language: text("language"),
  interests: text("interests"), // JSON string array
  customAudience: text("custom_audience"),
  lookalikAudience: text("lookalik_audience"),
  placement: text("placement"), // advantage_plus | manual
  optimizationEvent: text("optimization_event"), // LEAD | PURCHASE | ADD_TO_CART | CONTACT
  attributionSetting: text("attribution_setting"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  conversionLocation: text("conversion_location"), // WEBSITE | APP | MESSAGING | CALLS | LEADS
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdsetSchema = createInsertSchema(adsetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdset = z.infer<typeof insertAdsetSchema>;
export type Adset = typeof adsetsTable.$inferSelect;
