import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  nftTokenId: text("nft_token_id"),
  ogChainTxHash: text("og_chain_tx_hash"),
  ogExplorerUrl: text("og_explorer_url"),
  creatorWallet: text("creator_wallet").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  baseModel: text("base_model").notNull(),
  datasetDescription: text("dataset_description").notNull(),
  samplePrompt: text("sample_prompt").notNull(),
  sampleOutput: text("sample_output").notNull(),
  licensePriceUsd: real("license_price_usd").notNull(),
  isListed: boolean("is_listed").notNull().default(false),
  inferenceCount: integer("inference_count").notNull().default(0),
  licenseCount: integer("license_count").notNull().default(0),
  modelRootHash: text("model_root_hash"),
  datasetRootHash: text("dataset_root_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertModelSchema = createInsertSchema(modelsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof modelsTable.$inferSelect;
