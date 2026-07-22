import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(),
  productCategory: text("product_category"),
  location: text("location"),
  website: text("website"),
  whatsapp: text("whatsapp"),
  targetMarket: text("target_market"),
  valueProposition: text("value_proposition"),
  brandVoice: text("brand_voice"),
  complianceNotes: text("compliance_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;
