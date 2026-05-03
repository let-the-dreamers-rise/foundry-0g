import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { ethers } from "ethers";
import { db, modelsTable, licensesTable, inferenceCallsTable, activityTable } from "@workspace/db";
import {
  InferModelParams,
  InferModelBody,
  InferModelResponse,
} from "@workspace/api-zod";
import { callOgCompute } from "../lib/og-compute";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EIP712_DOMAIN = {
  name: "Foundry",
  version: "1",
  chainId: 16601,
} as const;

const EIP712_INFER_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  Inference: [
    { name: "modelId", type: "uint256" },
    { name: "caller", type: "address" },
    { name: "signedAt", type: "uint256" },
  ],
};

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function makeOgExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

const INFERENCE_RESPONSES: Record<string, string[]> = {
  "customer-support": [
    "Thank you for reaching out! I understand your concern and I'm here to help. Could you please provide your order ID so I can look into this further?",
    "I apologize for the inconvenience. Let me escalate this to our specialized team who can resolve this within 24 hours.",
    "I can see your account details. Your refund of $24.99 has been processed and should appear within 3-5 business days.",
  ],
  "creative-writing": [
    "The moonlight cascaded through the fractured window, painting silver patterns across the dusty floor where she had left her last letter.",
    "In the city where dreams were sold by the pound, Marcus discovered that hope was the only currency that never devalued.",
    "The algorithm had learned to paint sunsets, but it could never understand why humans wept when they watched them fade.",
  ],
  "code-assistant": [
    "Here's an optimized solution using dynamic programming with O(n) space complexity: `const fib = (n, memo = {}) => n <= 1 ? n : (memo[n] ??= fib(n-1, memo) + fib(n-2, memo));`",
    "The bug is in your useEffect dependency array. Adding `userId` will prevent the stale closure and ensure fresh data on each user change.",
    "Consider using a WeakMap for this caching pattern — it allows garbage collection of keys and prevents memory leaks in long-running applications.",
  ],
  finance: [
    "Based on current market conditions and your risk tolerance of moderate, a 60/40 equity-bond allocation with quarterly rebalancing aligns with your 10-year horizon.",
    "The DeFi protocol's APY of 18% carries significant smart contract risk. Your maximum position should not exceed 5% of your total portfolio.",
    "Dollar-cost averaging into this position over 12 months would reduce volatility exposure by approximately 34% compared to a lump-sum entry.",
  ],
  medical: [
    "This symptom pattern is consistent with vitamin D deficiency, which affects approximately 40% of adults. A 25-hydroxyvitamin D blood test would confirm this.",
    "The interaction between these two medications may reduce efficacy by up to 30%. Discuss timing adjustments with your prescribing physician.",
    "Based on the described symptoms, this presentation warrants prompt evaluation. Please consult a healthcare provider within 24 hours.",
  ],
  legal: [
    "This clause constitutes a non-compete agreement enforceable under Delaware law for 18 months within a 50-mile radius. Courts in your jurisdiction have upheld similar provisions.",
    "The force majeure clause as written excludes pandemic events. Amendment before signing is advisable given current business climate uncertainties.",
    "Your IP assignment clause appears overly broad. Carve-outs for personal projects created on personal time are standard and legally defensible.",
  ],
  other: [
    "Based on the fine-tuned knowledge embedded in this model, here is a tailored response to your query with domain-specific insights.",
    "This model has been optimized for your specific use case. The response incorporates patterns learned from your custom dataset.",
    "I've analyzed your question using the specialized training data. Here's my best answer based on the learned context.",
  ],
};

router.post("/models/:id/infer", async (req, res): Promise<void> => {
  const params = InferModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = InferModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { callerWallet, prompt, signature, signedAt } = parsed.data;
  const modelId = params.data.id;

  // ─── EIP-712 wallet-ownership verification (mandatory) ───────────────────
  // Without this, anyone could spoof callerWallet and bypass license checks
  // by claiming to be the model creator. The signature proves the caller
  // controls the private key behind callerWallet.
  try {
    const recovered = ethers.verifyTypedData(
      EIP712_DOMAIN,
      EIP712_INFER_TYPES,
      {
        modelId: BigInt(modelId),
        caller: callerWallet,
        signedAt: BigInt(signedAt),
      },
      signature
    );
    if (recovered.toLowerCase() !== callerWallet.toLowerCase()) {
      res.status(401).json({ error: "Signature does not match callerWallet" });
      return;
    }
    if (Math.abs(Date.now() - signedAt) > 10 * 60 * 1000) {
      res.status(401).json({ error: "Signature expired (>10 min old)" });
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Inference: EIP-712 verification failed");
    res.status(401).json({ error: "Invalid EIP-712 signature" });
    return;
  }

  const [model] = await db
    .select()
    .from(modelsTable)
    .where(eq(modelsTable.id, modelId));

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  const now = new Date();
  const [activeLicense] = await db
    .select()
    .from(licensesTable)
    .where(
      and(
        eq(licensesTable.modelId, modelId),
        eq(licensesTable.buyerWallet, callerWallet),
        gt(licensesTable.activeUntil, now)
      )
    );

  const isCreator = model.creatorWallet === callerWallet;
  if (!activeLicense && !isCreator) {
    res.status(403).json({ error: "No active license for this model" });
    return;
  }

  const startMs = Date.now();

  // Try real 0G Compute broker first
  const modelRef = model.modelRootHash ?? model.baseModel ?? "unknown";
  const ogResult = await callOgCompute(modelRef, prompt, model.category);

  let response: string;
  let teeRef: string;
  let inferenceReal = false;

  if (ogResult) {
    response = `[0G Compute TEE | Model: ${model.name}]\n\n${ogResult.response}`;
    teeRef = ogResult.teeAttestationRef;
    inferenceReal = true;
  } else {
    // Simulated fallback
    await sleep(Math.floor(Math.random() * 800) + 400);
    const responsePool =
      INFERENCE_RESPONSES[model.category] ?? INFERENCE_RESPONSES["other"]!;
    const baseResponse =
      responsePool[Math.floor(Math.random() * responsePool.length)]!;
    response = `[Fine-tuned on ${model.baseModel} | Model: ${model.name}]\n\n${baseResponse}`;
    teeRef = `tee_sim_${randomHex(16).slice(2)}_${Date.now()}`;
  }

  const processingMs = Date.now() - startMs;
  const calledAt = new Date();

  await db.insert(inferenceCallsTable).values({
    modelId,
    callerWallet,
    promptPreview: prompt.slice(0, 200),
    responsePreview: response.slice(0, 200),
    teeAttestationRef: teeRef,
    processingMs,
  });

  await db
    .update(modelsTable)
    .set({ inferenceCount: model.inferenceCount + 1 })
    .where(eq(modelsTable.id, modelId));

  const inferTxHash = randomHex(64);
  await db.insert(activityTable).values({
    eventType: "inference_run",
    modelId,
    modelName: model.name,
    actorWallet: callerWallet,
    ogExplorerUrl: makeOgExplorerUrl(inferTxHash),
    metadata: JSON.stringify({ teeRef, processingMs, real: inferenceReal }),
  });

  res.json(
    InferModelResponse.parse({
      modelId,
      response,
      teeProvider: inferenceReal
        ? "0G Compute TEE (Live)"
        : "0G Compute TEE (Simulated)",
      teeAttestationRef: teeRef,
      processingMs,
      calledAt: calledAt.toISOString(),
    })
  );
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
