import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { boolean } from "drizzle-orm/pg-core";

export const licensesTable = pgTable("licenses", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull(),
  buyerWallet: text("buyer_wallet").notNull(),
  ogPaymentTxHash: text("og_payment_tx_hash"),
  ogExplorerUrl: text("og_explorer_url"),
  buyerSignature: text("buyer_signature"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  paymentVerified: boolean("payment_verified").notNull().default(false),
  paymentAmountWei: text("payment_amount_wei"),
  activeUntil: timestamp("active_until", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLicenseSchema = createInsertSchema(licensesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licensesTable.$inferSelect;
