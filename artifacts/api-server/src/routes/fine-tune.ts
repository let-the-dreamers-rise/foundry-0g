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

const router: IRouter = Router();

function makeOgExplorerUrl(txHash: string): string {
  return `https://chainscan-galileo.0g.ai/tx/${txHash}`;
}

function randomHex(len: number): string {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
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

  res.json(ListFineTuneJobsResponse.parse(jobs));
});

router.post("/fine-tune", async (req, res): Promise<void> => {
  const parsed = CreateFineTuneJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { creatorWallet, baseModel, modelName, description, category, datasetDescription, samplePrompt, sampleOutput, licensePriceUsd, datasetContent: _datasetContent } = parsed.data;

  const datasetTxHash = randomHex(64);
  const datasetRootHash = randomHex(64);
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
      datasetRootHash,
      datasetOgTxHash: datasetTxHash,
      datasetOgExplorerUrl: makeOgExplorerUrl(datasetTxHash),
      status: "uploading",
      progressPct: 0,
    })
    .returning();

  await db.insert(activityTable).values({
    eventType: "job_started",
    modelId: null,
    modelName,
    actorWallet: creatorWallet,
    ogExplorerUrl: makeOgExplorerUrl(datasetTxHash),
    metadata: JSON.stringify({ baseModel, category }),
  });

  // Kick off simulated training progress in background
  simulateTraining(job.id, modelName, description, category, baseModel, datasetDescription, samplePrompt, sampleOutput, licensePriceUsd, creatorWallet, datasetRootHash);

  res.status(201).json(GetFineTuneJobResponse.parse(job));
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

  res.json(GetFineTuneJobResponse.parse(job));
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
    GetFineTuneJobStatusResponse.parse({
      id: job.id,
      status: job.status,
      progressPct: job.progressPct,
      jobIdOn0g: job.jobIdOn0g,
      modelRootHash: job.modelRootHash,
      modelOgExplorerUrl: job.modelOgExplorerUrl,
      nftTokenId: job.nftTokenId,
    })
  );
});

async function simulateTraining(
  jobId: number,
  modelName: string,
  description: string,
  category: string,
  baseModel: string,
  datasetDescription: string,
  samplePrompt: string,
  sampleOutput: string,
  licensePriceUsd: number,
  creatorWallet: string,
  datasetRootHash: string
): Promise<void> {
  // uploading → training over ~90 seconds, then complete
  const steps = [
    { delay: 3000, status: "uploading", pct: 10 },
    { delay: 8000, status: "uploading", pct: 25 },
    { delay: 15000, status: "training", pct: 35 },
    { delay: 25000, status: "training", pct: 50 },
    { delay: 40000, status: "training", pct: 65 },
    { delay: 60000, status: "training", pct: 80 },
    { delay: 80000, status: "training", pct: 92 },
    { delay: 90000, status: "completed", pct: 100 },
  ];

  for (const step of steps) {
    await sleep(step.delay);
    if (step.status === "completed") {
      const modelRootHash = randomHex(64);
      const mintTxHash = randomHex(64);
      const nftTokenId = String(Math.floor(Math.random() * 9000) + 1000);

      await db
        .update(fineTuneJobsTable)
        .set({
          status: "completed",
          progressPct: 100,
          modelRootHash,
          modelOgExplorerUrl: makeOgExplorerUrl(modelRootHash),
          nftTokenId,
          nftOgChainTxHash: mintTxHash,
          nftOgExplorerUrl: makeOgExplorerUrl(mintTxHash),
          completedAt: new Date(),
        })
        .where(eq(fineTuneJobsTable.id, jobId));

      // Create model record
      const [model] = await db
        .insert(modelsTable)
        .values({
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
          modelRootHash,
          datasetRootHash,
        })
        .returning();

      await db.insert(activityTable).values({
        eventType: "model_trained",
        modelId: model.id,
        modelName: modelName,
        actorWallet: creatorWallet,
        ogExplorerUrl: makeOgExplorerUrl(mintTxHash),
        metadata: JSON.stringify({ nftTokenId, baseModel }),
      });
    } else {
      await db
        .update(fineTuneJobsTable)
        .set({ status: step.status as string, progressPct: step.pct })
        .where(eq(fineTuneJobsTable.id, jobId));
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default router;
