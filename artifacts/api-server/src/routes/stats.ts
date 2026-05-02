import { Router, type IRouter } from "express";
import { eq, desc, count, sum } from "drizzle-orm";
import { db, fineTuneJobsTable, modelsTable, licensesTable, inferenceCallsTable } from "@workspace/db";
import {
  GetPlatformStatsResponse,
  GetCreatorStatsQueryParams,
  GetCreatorStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [modelCountResult] = await db.select({ count: count() }).from(modelsTable);
  const [jobCountResult] = await db.select({ count: count() }).from(fineTuneJobsTable);
  const [inferenceCountResult] = await db.select({ count: count() }).from(inferenceCallsTable);
  const [licenseCountResult] = await db.select({ count: count() }).from(licensesTable);

  const featuredModels = await db
    .select()
    .from(modelsTable)
    .where(eq(modelsTable.isListed, true))
    .orderBy(desc(modelsTable.inferenceCount))
    .limit(6);

  const stats = {
    totalModels: modelCountResult?.count ?? 0,
    totalFineTuneJobs: jobCountResult?.count ?? 0,
    totalInferenceCalls: inferenceCountResult?.count ?? 0,
    totalLicenses: licenseCountResult?.count ?? 0,
    totalDatasetStorageGb: Number(((modelCountResult?.count ?? 0) * 0.42).toFixed(2)),
    featuredModels,
  };

  res.json(GetPlatformStatsResponse.parse(stats));
});

router.get("/stats/creator", async (req, res): Promise<void> => {
  const query = GetCreatorStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { creatorWallet } = query.data;

  const jobs = await db
    .select()
    .from(fineTuneJobsTable)
    .where(eq(fineTuneJobsTable.creatorWallet, creatorWallet))
    .orderBy(desc(fineTuneJobsTable.startedAt));

  const models = await db
    .select()
    .from(modelsTable)
    .where(eq(modelsTable.creatorWallet, creatorWallet))
    .orderBy(desc(modelsTable.createdAt));

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const listedModels = models.filter((m) => m.isListed).length;

  let totalLicenses = 0;
  let totalInferenceCalls = 0;
  for (const model of models) {
    totalLicenses += model.licenseCount;
    totalInferenceCalls += model.inferenceCount;
  }

  const estimatedEarningsUsd = models.reduce((acc, m) => {
    return acc + m.licenseCount * m.licensePriceUsd * 0.85;
  }, 0);

  const stats = {
    totalJobs: jobs.length,
    completedJobs,
    listedModels,
    totalLicenses,
    totalInferenceCalls,
    estimatedEarningsUsd: Math.round(estimatedEarningsUsd * 100) / 100,
    jobs,
    models,
  };

  res.json(GetCreatorStatsResponse.parse(JSON.parse(JSON.stringify(stats))));
});

export default router;
