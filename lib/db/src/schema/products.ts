import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }),
  promo: text("promo"),
  benefit: text("benefit"),
  painPoint: text("pain_point"),
  proof: text("proof"),
  guarantee: text("guarantee"),
  cta: text("cta"),
  landingPageUrl: text("landing_page_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
