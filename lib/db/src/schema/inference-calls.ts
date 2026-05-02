import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inferenceCallsTable = pgTable("inference_calls", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull(),
  callerWallet: text("caller_wallet").notNull(),
  promptPreview: text("prompt_preview"),
  responsePreview: text("response_preview"),
  teeAttestationRef: text("tee_attestation_ref"),
  processingMs: integer("processing_ms"),
  calledAt: timestamp("called_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInferenceCallSchema = createInsertSchema(inferenceCallsTable).omit({
  id: true,
  calledAt: true,
});
export type InsertInferenceCall = z.infer<typeof insertInferenceCallSchema>;
export type InferenceCall = typeof inferenceCallsTable.$inferSelect;
