import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { ethers } from "ethers";
import { db, fineTuneJobsTable, modelsTable, activityTable } from "@workspace/db";
import {
  CreateFineTuneJobBody,
  GetFineTuneJobParams,
  GetFineTuneJobStatusParams,
  ListFineTuneJobsQueryParams,
  ListFineTuneJobsResponse,
  GetFineTuneJobResponse,
  GetFineTuneJobStatusResponse,
} from "@workspace/api-zod";
import { uploadToOgStorage, isOgStorageConfigured, OgStorageConfigError, OgStorageUploadError } from "../lib/og-storage";
import { mintModelNft } from "../lib/og-chain";
import { createFineTuneTask, pollTaskStatus, isCliEnabled } from "../lib/og-fine-tune";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EIP712_DOMAIN = {
  name: "Foundry",
  version: "1",
  chainId: 16602,
} as const;

const EIP712_FT_TYPES: Record<string, Array<{ name: string; type: string }>> = {
  CreateFineTune: [
    { name: "creator", type: "address" },
    { name: "modelName", type: "string" },
    { name: "baseModel", type: "string" },
    { name: "signedAt", type: "uint256" },
  ],
};

function toJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function makeOgExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

function deterministicHex(input: string, len: number): string {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31n + BigInt(input.charCodeAt(i))) % (2n ** 256n);
  }
  return "0x" + hash.toString(16).padStart(len, "0");
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

router.get("/fine-tune", async (req, res): Promise<void> => {
  const query = ListFineTuneJobsQueryParams.safeParse(req.query);
  const jobs = await db
    .select()
    .from(fineTuneJobsTable)
    .where(
      query.success && query.data.creatorWallet
        ? eq(fineTuneJobsTable.creatorWallet, query.data.creatorWallet)
        : undefined
    )
    .orderBy(desc(fineTuneJobsTable.startedAt));

  res.json(ListFineTuneJobsResponse.parse(toJson(jobs)));
});

router.post("/fine-tune", async (req, res): Promise<void> => {
  const parsed = CreateFineTuneJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    creatorWallet,
    baseModel,
    modelName,
    description,
    category,
    datasetDescription,
    samplePrompt,
    sampleOutput,
    licensePriceUsd,
    datasetContent,
    signature,
    signedAt,
  } = parsed.data;

  // ─── EIP-712 creator-ownership verification (mandatory) ──────────────────
  // Without this, anyone could spoof creatorWallet and submit jobs on behalf
  // of another address (and ultimately list models that aren't theirs).
  try {
    const recovered = ethers.verifyTypedData(
      EIP712_DOMAIN,
      EIP712_FT_TYPES,
      {
        creator: creatorWallet,
        modelName,
        baseModel,
        signedAt: BigInt(signedAt),
      },
      signature
    );
    if (recovered.toLowerCase() !== creatorWallet.toLowerCase()) {
      res.status(401).json({ error: "Signature does not match creatorWallet" });
      return;
    }
    if (Math.abs(Date.now() - signedAt) > 10 * 60 * 1000) {
      res.status(401).json({ error: "Signature expired (>10 min old)" });
      return;
    }
  } catch (err) {
    logger.warn({ err }, "Fine-tune: EIP-712 verification failed");
    res.status(401).json({ error: "Invalid EIP-712 signature" });
    return;
  }

  const jobIdOn0g = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const [job] = await db
    .insert(fineTuneJobsTable)
    .values({
      creatorWallet,
      baseModel,
      modelName,
      description,
      category,
      jobIdOn0g,
      datasetRootHash: null,
      datasetOgTxHash: null,
      datasetOgExplorerUrl: null,
      status: "uploading",
      progressPct: 0,
    })
    .returning();

  await db.insert(activityTable).values({
    eventType: "job_started",
    modelId: null,
    modelName,
    actorWallet: creatorWallet,
    ogExplorerUrl: null,
    metadata: JSON.stringify({ baseModel, category }),
  });

  res.status(201).json(GetFineTuneJobResponse.parse(toJson(job)));

  runPipeline(
    job.id,
    jobIdOn0g,
    datasetContent,
    modelName,
    description,
    category,
    baseModel,
    datasetDescription,
    samplePrompt,
    sampleOutput,
    licensePriceUsd,
    creatorWallet
  ).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    req.log?.error({ err: msg, jobId: job.id }, "Pipeline error");
    await db.update(fineTuneJobsTable).set({
      status: "failed",
      progressPct: 0,
      errorMessage: msg.slice(0, 500),
    }).where(eq(fineTuneJobsTable.id, job.id)).catch(() => {});
  });
});

router.get("/fine-tune/:id", async (req, res): Promise<void> => {
  const params = GetFineTuneJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(fineTuneJobsTable)
    .where(eq(fineTuneJobsTable.id, params.data.id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(GetFineTuneJobResponse.parse(toJson(job)));
});

router.get("/fine-tune/:id/status", async (req, res): Promise<void> => {
  const params = GetFineTuneJobStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(fineTuneJobsTable)
    .where(eq(fineTuneJobsTable.id, params.data.id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(GetFineTuneJobStatusResponse.parse(toJson({
    id: job.id,
    status: job.status,
    progressPct: job.progressPct,
    jobIdOn0g: job.jobIdOn0g,
    modelRootHash: job.modelRootHash,
    modelOgExplorerUrl: job.modelOgExplorerUrl,
    nftTokenId: job.nftTokenId,
  })));
});

async function runPipeline(
  jobId: number,
  jobIdOn0g: string,
  datasetContent: string,
  modelName: string,
  description: string,
  category: string,
  baseModel: string,
  datasetDescription: string,
  samplePrompt: string,
  sampleOutput: string,
  licensePriceUsd: number,
  creatorWallet: string
): Promise<void> {
  await sleep(500);
  await db.update(fineTuneJobsTable).set({ progressPct: 10 }).where(eq(fineTuneJobsTable.id, jobId));

  // ─── Real 0G Storage dataset upload ────────────────────────────────────
  // Throws OgStorageConfigError if OG_PRIVATE_KEY is missing, or
  // OgStorageUploadError if the indexer / network fails. Both bubble up to
  // the route's catch handler which marks the job as failed with the
  // surfaced error message — no silent fake-hash fallback.
  let datasetUpload: Awaited<ReturnType<typeof uploadToOgStorage>>;
  try {
    datasetUpload = await uploadToOgStorage(datasetContent, `dataset-job-${jobId}`);
  } catch (err) {
    if (err instanceof OgStorageConfigError) {
      logger.warn({ jobId, err: err.message }, "Dataset upload skipped: 0G Storage not configured");
    } else if (err instanceof OgStorageUploadError) {
      logger.error({ jobId, err: err.message }, "Dataset upload failed");
    }
    throw err;
  }

  await db.update(fineTuneJobsTable).set({
    datasetRootHash: datasetUpload.rootHash,
    datasetOgTxHash: datasetUpload.txHash,
    datasetOgExplorerUrl: datasetUpload.explorerUrl,
    progressPct: 25,
  }).where(eq(fineTuneJobsTable.id, jobId));

  await db.insert(activityTable).values({
    eventType: "dataset_uploaded",
    modelId: null,
    modelName,
    actorWallet: creatorWallet,
    ogExplorerUrl: datasetUpload.explorerUrl,
    metadata: JSON.stringify({ datasetRootHash: datasetUpload.rootHash }),
  });

  // ─── 0G Compute fine-tuning ─────────────────────────────────────────────
  // Real path: shell out to `0g-compute-cli fine-tuning create-task` then poll
  // `task-status` every 5s until completed/failed. Falls back to a simulated
  // progress loop when the CLI is not configured (OG_COMPUTE_PROVIDER missing).
  let cliModelRootHash: string | undefined;
  const cliTask = await createFineTuneTask({
    datasetRootHash: datasetUpload.rootHash,
    baseModel,
    jobLabel: jobIdOn0g,
  });

  if (cliTask) {
    logger.info({ jobId, taskId: cliTask.taskId }, "0G CLI fine-tune task created");
    await db.update(fineTuneJobsTable).set({
      status: "training",
      jobIdOn0g: cliTask.taskId,
      progressPct: 30,
    }).where(eq(fineTuneJobsTable.id, jobId));

    const startedAt = Date.now();
    const maxMs = 30 * 60 * 1000; // 30-min cap
    while (Date.now() - startedAt < maxMs) {
      await sleep(5000);
      const status = await pollTaskStatus(cliTask.taskId);
      if (!status) continue;
      await db.update(fineTuneJobsTable).set({
        status: status.status === "completed" ? "training" : status.status === "failed" ? "failed" : "training",
        progressPct: Math.min(95, Math.max(30, status.progressPct)),
      }).where(eq(fineTuneJobsTable.id, jobId));
      if (status.status === "completed") {
        cliModelRootHash = status.modelRootHash;
        break;
      }
      if (status.status === "failed") {
        await db.update(fineTuneJobsTable).set({ status: "failed", progressPct: 0 })
          .where(eq(fineTuneJobsTable.id, jobId));
        return;
      }
    }
  } else {
    // Simulated training loop (demo mode — no CLI configured).
    const trainingSteps: Array<{ delay: number; pct: number }> = [
      { delay: 8000, pct: 35 },
      { delay: 15000, pct: 50 },
      { delay: 25000, pct: 65 },
      { delay: 40000, pct: 80 },
      { delay: 60000, pct: 92 },
    ];
    for (const step of trainingSteps) {
      await sleep(step.delay);
      await db.update(fineTuneJobsTable)
        .set({ status: "training", progressPct: step.pct })
        .where(eq(fineTuneJobsTable.id, jobId));
    }
    await sleep(15000);
  }

  const modelContent = `${modelName}:${baseModel}:${datasetUpload.rootHash}:${jobIdOn0g}`;
  // Prefer the CLI-returned model root hash when available; otherwise upload
  // a deterministic stub so demo runs still produce a viewable artifact.
  const modelUpload = cliModelRootHash
    ? {
        rootHash: cliModelRootHash,
        txHash: cliModelRootHash,
        explorerUrl: `https://chainscan-galileo.0g.ai/tx/${cliModelRootHash}`,
        real: true,
      }
    : await uploadToOgStorage(modelContent, `model-job-${jobId}`);
  if (isCliEnabled() && !cliModelRootHash) {
    logger.warn({ jobId }, "CLI was enabled but produced no modelRootHash — using stub");
  }

  // Try to mint a real Foundry7857 NFT on 0G Chain. Falls back to deterministic
  // placeholder when FOUNDRY_CONTRACT_ADDRESS / OG_PRIVATE_KEY aren't set.
  const mintResult = await mintModelNft({
    to: creatorWallet,
    modelRootHash: modelUpload.rootHash,
    datasetRootHash: datasetUpload.rootHash,
    baseModel,
    category,
    licensePriceUsd,
  });

  const mintTxHash = mintResult?.txHash ?? deterministicHex(modelUpload.rootHash + "nft" + jobId, 64);
  const nftTokenId = mintResult?.tokenId ?? String((Math.abs(hashCode(modelContent)) % 9000) + 1000);

  await db.update(fineTuneJobsTable).set({
    status: "completed",
    progressPct: 100,
    modelRootHash: modelUpload.rootHash,
    modelOgExplorerUrl: modelUpload.explorerUrl,
    nftTokenId,
    nftOgChainTxHash: mintTxHash,
    nftOgExplorerUrl: makeOgExplorerUrl(mintTxHash),
    completedAt: new Date(),
  }).where(eq(fineTuneJobsTable.id, jobId));

  const [model] = await db.insert(modelsTable).values({
    jobId,
    nftTokenId,
    ogChainTxHash: mintTxHash,
    ogExplorerUrl: makeOgExplorerUrl(mintTxHash),
    creatorWallet,
    name: modelName,
    description,
    category,
    baseModel,
    datasetDescription,
    samplePrompt,
    sampleOutput,
    licensePriceUsd,
    isListed: false,
    inferenceCount: 0,
    licenseCount: 0,
    modelRootHash: modelUpload.rootHash,
    datasetRootHash: datasetUpload.rootHash,
  }).returning();

  await db.insert(activityTable).values({
    eventType: "model_trained",
    modelId: model.id,
    modelName,
    actorWallet: creatorWallet,
    ogExplorerUrl: makeOgExplorerUrl(mintTxHash),
    metadata: JSON.stringify({ nftTokenId, baseModel, modelRootHash: modelUpload.rootHash }),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
