import { Router, type IRouter } from "express";
import { eq, desc, count, gte, inArray } from "drizzle-orm";
import { db, fineTuneJobsTable, modelsTable, licensesTable, inferenceCallsTable } from "@workspace/db";
import {
  GetPlatformStatsResponse,
  GetCreatorStatsQueryParams,
  GetCreatorStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // ─── Real weekly revenue from licenses table ─────────────────────────────
  // Compute the last 7 days of license-derived revenue for this creator's models.
  const modelIds = models.map((m) => m.id);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentLicenses = modelIds.length
    ? await db
        .select({
          modelId: licensesTable.modelId,
          createdAt: licensesTable.createdAt,
        })
        .from(licensesTable)
        .where(
          inArray(licensesTable.modelId, modelIds)
        )
        .then((rows) => rows.filter((r) => r.createdAt >= sevenDaysAgo))
    : [];

  const priceByModel = new Map(models.map((m) => [m.id, m.licensePriceUsd]));

  const buckets: number[] = new Array(7).fill(0);
  for (const lic of recentLicenses) {
    const dayDiff = Math.floor((Date.now() - lic.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    if (dayDiff >= 0 && dayDiff < 7) {
      buckets[6 - dayDiff] += (priceByModel.get(lic.modelId) ?? 0) * 0.85;
    }
  }

  const today = new Date();
  const weeklyRevenue = buckets.map((rev, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return {
      day: DAY_LABELS[date.getDay()]!,
      revenueUsd: Math.round(rev * 100) / 100,
    };
  });

  // weeklyRevenue is purely derived from the licenses table — no synthetic
  // fallback. An empty chart is honest about no recent purchases.

  const stats = {
    totalJobs: jobs.length,
    completedJobs,
    listedModels,
    totalLicenses,
    totalInferenceCalls,
    estimatedEarningsUsd: Math.round(estimatedEarningsUsd * 100) / 100,
    weeklyRevenue,
    jobs,
    models,
  };

  res.json(GetCreatorStatsResponse.parse(JSON.parse(JSON.stringify(stats))));
});

export default router;
