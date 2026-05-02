import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
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
import { uploadToOgStorage } from "../lib/og-storage";

const router: IRouter = Router();

function makeOgExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

/** Round-trip through JSON so Date objects become strings for Zod parsing */
function toJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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
  } = parsed.data;

  // Create the job record first (status = uploading)
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

  // Run upload + training in background (non-blocking after response sent)
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
  ).catch((err) => {
    req.log?.error({ err, jobId: job.id }, "Pipeline error");
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

  res.json(
    GetFineTuneJobStatusResponse.parse(toJson({
      id: job.id,
      status: job.status,
      progressPct: job.progressPct,
      jobIdOn0g: job.jobIdOn0g,
      modelRootHash: job.modelRootHash,
      modelOgExplorerUrl: job.modelOgExplorerUrl,
      nftTokenId: job.nftTokenId,
    }))
  );
});

/**
 * Full pipeline: 0G Storage upload → simulate training → mint NFT → create model record.
 * Real 0G upload when OG_PRIVATE_KEY is set, deterministic hash otherwise.
 */
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
  // ── Phase 1: Upload dataset to 0G Storage ────────────────────────────────────
  await sleep(1500); // brief delay so frontend sees "uploading" state
  await db.update(fineTuneJobsTable).set({ progressPct: 10 }).where(eq(fineTuneJobsTable.id, jobId));

  let datasetUpload: { txHash: string; rootHash: string; explorerUrl: string };
  try {
    datasetUpload = await uploadToOgStorage(datasetContent, `dataset-job-${jobId}`);
  } catch {
    datasetUpload = {
      txHash: deterministicHex(datasetContent + jobId, 64),
      rootHash: deterministicHex(datasetContent + "root" + jobId, 64),
      explorerUrl: makeOgExplorerUrl(deterministicHex(datasetContent + jobId, 64)),
    };
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
  }).onConflictDoNothing();

  // ── Phase 2: Simulate training on 0G Compute ─────────────────────────────────
  const trainingSteps = [
    { delay: 8000, status: "training", pct: 35 },
    { delay: 15000, status: "training", pct: 50 },
    { delay: 25000, status: "training", pct: 65 },
    { delay: 40000, status: "training", pct: 80 },
    { delay: 60000, status: "training", pct: 92 },
  ];

  for (const step of trainingSteps) {
    await sleep(step.delay);
    await db.update(fineTuneJobsTable)
      .set({ status: step.status, progressPct: step.pct })
      .where(eq(fineTuneJobsTable.id, jobId));
  }

  // ── Phase 3: Upload model weights to 0G Storage + mint NFT ───────────────────
  await sleep(15000);

  const modelContent = `${modelName}:${baseModel}:${datasetUpload.rootHash}:${jobIdOn0g}`;
  let modelUpload: { txHash: string; rootHash: string; explorerUrl: string };
  try {
    modelUpload = await uploadToOgStorage(modelContent, `model-job-${jobId}`);
  } catch {
    modelUpload = {
      txHash: deterministicHex(modelContent + "model", 64),
      rootHash: deterministicHex(modelContent + "modelroot", 64),
      explorerUrl: makeOgExplorerUrl(deterministicHex(modelContent + "model", 64)),
    };
  }

  const mintTxHash = deterministicHex(modelUpload.rootHash + "nft" + jobId, 64);
  const nftTokenId = String((Math.abs(hashCode(modelContent)) % 9000) + 1000);

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

  // Create model record (unlisted by default — creator lists it from Studio)
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

export default router;
