import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fineTuneJobsTable = pgTable("fine_tune_jobs", {
  id: serial("id").primaryKey(),
  creatorWallet: text("creator_wallet").notNull(),
  jobIdOn0g: text("job_id_on_0g"),
  datasetRootHash: text("dataset_root_hash"),
  datasetOgTxHash: text("dataset_og_tx_hash"),
  datasetOgExplorerUrl: text("dataset_og_explorer_url"),
  baseModel: text("base_model").notNull(),
  modelName: text("model_name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("pending"),
  progressPct: integer("progress_pct"),
  modelRootHash: text("model_root_hash"),
  modelOgExplorerUrl: text("model_og_explorer_url"),
  nftTokenId: text("nft_token_id"),
  nftOgChainTxHash: text("nft_og_chain_tx_hash"),
  nftOgExplorerUrl: text("nft_og_explorer_url"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertFineTuneJobSchema = createInsertSchema(fineTuneJobsTable).omit({
  id: true,
  startedAt: true,
});
export type InsertFineTuneJob = z.infer<typeof insertFineTuneJobSchema>;
export type FineTuneJob = typeof fineTuneJobsTable.$inferSelect;
