import { Router, type IRouter } from "express";
import { eq, desc, and, gt } from "drizzle-orm";
import { db, licensesTable, modelsTable, activityTable } from "@workspace/db";
import {
  ListLicensesQueryParams,
  ListLicensesResponse,
  PurchaseLicenseBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

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

  const { modelId, buyerWallet, durationDays } = parsed.data;

  const [model] = await db
    .select()
    .from(modelsTable)
    .where(eq(modelsTable.id, modelId));

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  const paymentTxHash = randomHex(64);
  const activeUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const [license] = await db
    .insert(licensesTable)
    .values({
      modelId,
      buyerWallet,
      ogPaymentTxHash: paymentTxHash,
      ogExplorerUrl: makeOgExplorerUrl(paymentTxHash),
      activeUntil,
    })
    .returning();

  // Update model license count
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
    metadata: JSON.stringify({ durationDays, priceUsd: model.licensePriceUsd }),
  });

  const licenseWithModel = {
    ...license,
    model,
  };

  res.status(201).json(licenseWithModel);
});

export default router;
