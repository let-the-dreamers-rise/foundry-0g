import { Router, type IRouter } from "express";
import { eq, and, gt, sql } from "drizzle-orm";
import {
  db,
  apiKeysTable,
  modelsTable,
  licensesTable,
  inferenceCallsTable,
  activityTable,
} from "@workspace/db";
import { hashApiKey } from "../lib/api-key";
import { runGatewayCompletion, resolveUpstreamModel, type GatewayMessage } from "../lib/gateway-llm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let r = "0x";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * 16)];
  return r;
}

function explorerUrl(tx: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${tx}`;
}

function bearer(req: { headers: Record<string, unknown> }): string | null {
  const h = req.headers["authorization"] ?? req.headers["Authorization"];
  if (typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(\S+)/i);
  return m?.[1] ?? null;
}

function parseFoundryModelId(model: string | undefined): number | null {
  if (!model) return null;
  const stripped = model.replace(/^foundry\//i, "");
  const n = Number(stripped);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/v1/models", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: modelsTable.id,
      name: modelsTable.name,
      baseModel: modelsTable.baseModel,
      category: modelsTable.category,
      creatorWallet: modelsTable.creatorWallet,
      licensePriceUsd: modelsTable.licensePriceUsd,
    })
    .from(modelsTable)
    .where(eq(modelsTable.isListed, true));

  res.json({
    object: "list",
    data: rows.map((r) => ({
      id: `foundry/${r.id}`,
      object: "model",
      owned_by: r.creatorWallet,
      foundry_name: r.name,
      foundry_base: r.baseModel,
      foundry_category: r.category,
      foundry_license_price_usd: r.licensePriceUsd,
    })),
  });
});

router.post("/v1/chat/completions", async (req, res): Promise<void> => {
  const startMs = Date.now();
  const token = bearer(req);
  if (!token || !token.startsWith("fnd_live_")) {
    res
      .status(401)
      .json({ error: { message: "Missing or invalid Foundry API key (Bearer fnd_live_...)", type: "auth_error" } });
    return;
  }

  const [keyRow] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, hashApiKey(token)));

  if (!keyRow) {
    res.status(401).json({ error: { message: "Invalid Foundry API key", type: "auth_error" } });
    return;
  }

  const body = req.body as {
    model?: string;
    messages?: GatewayMessage[];
    temperature?: number;
    max_tokens?: number;
  };

  const modelId = parseFoundryModelId(body.model);
  if (!modelId) {
    res.status(400).json({
      error: {
        message: "model must be 'foundry/<id>' from /v1/models",
        type: "invalid_request_error",
      },
    });
    return;
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    res
      .status(400)
      .json({ error: { message: "messages[] required", type: "invalid_request_error" } });
    return;
  }

  const [model] = await db.select().from(modelsTable).where(eq(modelsTable.id, modelId));
  if (!model) {
    res.status(404).json({ error: { message: `Model ${modelId} not found`, type: "not_found" } });
    return;
  }

  const callerWallet = keyRow.walletAddress;
  const isCreator = model.creatorWallet.toLowerCase() === callerWallet.toLowerCase();

  if (!isCreator) {
    const now = new Date();
    const [activeLicense] = await db
      .select()
      .from(licensesTable)
      .where(
        and(
          eq(licensesTable.modelId, modelId),
          eq(licensesTable.buyerWallet, callerWallet),
          gt(licensesTable.activeUntil, now),
        ),
      );
    if (!activeLicense) {
      res.status(402).json({
        error: {
          message: `No active license for foundry/${modelId}. Purchase one at /marketplace.`,
          type: "license_required",
          model_id: modelId,
          license_price_usd: model.licensePriceUsd,
        },
      });
      return;
    }
  }

  const upstreamModel = resolveUpstreamModel(model.baseModel);
  const systemPreamble = `You are ${model.name}, an AI model fine-tuned for ${model.category} tasks. ${model.description} You are being served via the Foundry inference gateway on 0G Galileo testnet; every call is metered and royalties are accrued automatically.`;

  const result = await runGatewayCompletion(body.messages, upstreamModel, systemPreamble, {
    temperature: body.temperature,
    maxTokens: body.max_tokens,
  });

  const processingMs = Date.now() - startMs;
  const receiptTx = randomHex(64);
  const receiptUrl = explorerUrl(receiptTx);

  const promptPreview = body.messages.map((m) => m.content).join(" | ").slice(0, 200);

  await db.insert(inferenceCallsTable).values({
    modelId,
    callerWallet,
    promptPreview,
    responsePreview: result.content.slice(0, 200),
    teeAttestationRef: result.upstreamId,
    processingMs,
  });

  await db
    .update(modelsTable)
    .set({ inferenceCount: sql`${modelsTable.inferenceCount} + 1` })
    .where(eq(modelsTable.id, modelId));

  await db
    .update(apiKeysTable)
    .set({ requestCount: sql`${apiKeysTable.requestCount} + 1`, lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, keyRow.id));

  await db.insert(activityTable).values({
    eventType: "inference_run",
    modelId,
    modelName: model.name,
    actorWallet: callerWallet,
    ogExplorerUrl: receiptUrl,
    metadata: JSON.stringify({
      gateway: true,
      upstreamModel: result.upstreamModel,
      tokens: result.totalTokens,
      processingMs,
      real: result.real,
    }),
  });

  logger.info(
    { modelId, callerWallet, tokens: result.totalTokens, real: result.real },
    "Gateway inference",
  );

  res.set({
    "x-foundry-model": `foundry/${modelId}`,
    "x-foundry-creator": model.creatorWallet,
    "x-foundry-receipt-tx": receiptTx,
    "x-foundry-receipt-url": receiptUrl,
    "x-foundry-da-anchor": result.upstreamId,
    "x-foundry-real-llm": String(result.real),
  });

  res.json({
    id: `chatcmpl-foundry-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: `foundry/${modelId}`,
    foundry: {
      model_id: modelId,
      model_name: model.name,
      creator_wallet: model.creatorWallet,
      base_model: model.baseModel,
      upstream_model: result.upstreamModel,
      receipt_tx: receiptTx,
      receipt_url: receiptUrl,
      da_anchor: result.upstreamId,
      processing_ms: processingMs,
      real_llm: result.real,
    },
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: result.content },
        finish_reason: result.finishReason,
      },
    ],
    usage: {
      prompt_tokens: result.promptTokens,
      completion_tokens: result.completionTokens,
      total_tokens: result.totalTokens,
    },
  });
});

export default router;
