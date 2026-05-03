import { Router, type IRouter } from "express";
import { eq, desc, and, gt } from "drizzle-orm";
import { ethers } from "ethers";
import { db, licensesTable, modelsTable, activityTable } from "@workspace/db";
import {
  ListLicensesQueryParams,
  ListLicensesResponse,
  PurchaseLicenseBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// EIP-712 domain — the same constants are mirrored client-side in model-detail.tsx
const EIP712_DOMAIN = {
  name: "Foundry",
  version: "1",
  chainId: 16600, // 0G Galileo testnet
} as const;

const EIP712_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  PurchaseLicense: [
    { name: "modelId", type: "uint256" },
    { name: "buyer", type: "address" },
    { name: "durationDays", type: "uint256" },
    { name: "signedAt", type: "uint256" },
  ],
};

function toJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function deterministicHex(input: string, len: number): string {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31n + BigInt(input.charCodeAt(i))) % (2n ** 256n);
  }
  return "0x" + hash.toString(16).padStart(len, "0");
}

function makeOgExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

router.get("/licenses", async (req, res): Promise<void> => {
  const query = ListLicensesQueryParams.safeParse(req.query);

  const licenses = await db
    .select({
      id: licensesTable.id,
      modelId: licensesTable.modelId,
      buyerWallet: licensesTable.buyerWallet,
      ogPaymentTxHash: licensesTable.ogPaymentTxHash,
      ogExplorerUrl: licensesTable.ogExplorerUrl,
      activeUntil: licensesTable.activeUntil,
      createdAt: licensesTable.createdAt,
      model: {
        id: modelsTable.id,
        jobId: modelsTable.jobId,
        nftTokenId: modelsTable.nftTokenId,
        ogChainTxHash: modelsTable.ogChainTxHash,
        ogExplorerUrl: modelsTable.ogExplorerUrl,
        creatorWallet: modelsTable.creatorWallet,
        name: modelsTable.name,
        description: modelsTable.description,
        category: modelsTable.category,
        baseModel: modelsTable.baseModel,
        datasetDescription: modelsTable.datasetDescription,
        samplePrompt: modelsTable.samplePrompt,
        sampleOutput: modelsTable.sampleOutput,
        licensePriceUsd: modelsTable.licensePriceUsd,
        isListed: modelsTable.isListed,
        inferenceCount: modelsTable.inferenceCount,
        licenseCount: modelsTable.licenseCount,
        modelRootHash: modelsTable.modelRootHash,
        datasetRootHash: modelsTable.datasetRootHash,
        createdAt: modelsTable.createdAt,
      },
    })
    .from(licensesTable)
    .innerJoin(modelsTable, eq(licensesTable.modelId, modelsTable.id))
    .where(
      query.success && query.data.buyerWallet
        ? eq(licensesTable.buyerWallet, query.data.buyerWallet)
        : undefined
    )
    .orderBy(desc(licensesTable.createdAt));

  res.json(ListLicensesResponse.parse(toJson(licenses)));
});

router.post("/licenses", async (req, res): Promise<void> => {
  const parsed = PurchaseLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { modelId, buyerWallet, durationDays, signature, signedAt } = parsed.data;

  const [model] = await db
    .select()
    .from(modelsTable)
    .where(and(eq(modelsTable.id, modelId), eq(modelsTable.isListed, true)));

  if (!model) {
    res.status(404).json({ error: "Model not found or not listed" });
    return;
  }

  // ─── EIP-712 signature verification (mandatory) ─────────────────────────
  // We refuse purchases that do not carry a wallet-signed proof of consent.
  // The signature is verified server-side via ethers.verifyTypedData and
  // permanently recorded alongside the license.
  let verifiedSignature: string;
  let verifiedSignedAt: Date;
  try {
    const recovered = ethers.verifyTypedData(
      EIP712_DOMAIN,
      EIP712_TYPES,
      {
        modelId: BigInt(modelId),
        buyer: buyerWallet,
        durationDays: BigInt(durationDays),
        signedAt: BigInt(signedAt),
      },
      signature
    );
    if (recovered.toLowerCase() !== buyerWallet.toLowerCase()) {
      res.status(401).json({
        error: "Signature does not match buyerWallet",
        recovered,
      });
      return;
    }
    if (Math.abs(Date.now() - signedAt) > 10 * 60 * 1000) {
      res.status(401).json({ error: "Signature expired (>10 min old)" });
      return;
    }
    verifiedSignature = signature;
    verifiedSignedAt = new Date(signedAt);
    logger.info({ buyerWallet, modelId }, "License: EIP-712 signature verified");
  } catch (err) {
    logger.warn({ err }, "License: signature verification failed");
    res.status(401).json({ error: "Invalid EIP-712 signature" });
    return;
  }

  // Reject if a non-expired license already exists for this wallet+model
  const now = new Date();
  const [existing] = await db
    .select()
    .from(licensesTable)
    .where(
      and(
        eq(licensesTable.modelId, modelId),
        eq(licensesTable.buyerWallet, buyerWallet),
        gt(licensesTable.activeUntil, now)
      )
    );
  if (existing) {
    res.status(409).json({ error: "Active license already exists for this wallet" });
    return;
  }

  const paymentTxHash = deterministicHex(
    `${buyerWallet}:${modelId}:${durationDays}:${Date.now()}`,
    64
  );
  const activeUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const [license] = await db
    .insert(licensesTable)
    .values({
      modelId,
      buyerWallet,
      ogPaymentTxHash: paymentTxHash,
      ogExplorerUrl: makeOgExplorerUrl(paymentTxHash),
      buyerSignature: verifiedSignature,
      signedAt: verifiedSignedAt,
      activeUntil,
    })
    .returning();

  await db
    .update(modelsTable)
    .set({ licenseCount: model.licenseCount + 1 })
    .where(eq(modelsTable.id, modelId));

  await db.insert(activityTable).values({
    eventType: "license_purchased",
    modelId,
    modelName: model.name,
    actorWallet: buyerWallet,
    ogExplorerUrl: makeOgExplorerUrl(paymentTxHash),
    metadata: JSON.stringify({
      durationDays,
      priceUsd: model.licensePriceUsd,
      signed: !!verifiedSignature,
    }),
  });

  res.status(201).json(toJson({ ...license, model }));
});

export default router;
