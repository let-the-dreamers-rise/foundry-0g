import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, modelsTable, activityTable } from "@workspace/db";
import {
  GetModelParams,
  GetModelResponse,
  UpdateModelParams,
  UpdateModelBody,
  UpdateModelResponse,
  ListModelParams,
  ListModelBody,
  ListModelResponse,
  ListModelsQueryParams,
  ListModelsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toJson<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

router.get("/models", async (req, res): Promise<void> => {
  const query = ListModelsQueryParams.safeParse(req.query);

  let rows = await db
    .select()
    .from(modelsTable)
    .orderBy(desc(modelsTable.createdAt));

  if (query.success) {
    const { baseModel, category, creatorWallet, sort } = query.data;
    if (baseModel) rows = rows.filter((m) => m.baseModel === baseModel);
    if (category) rows = rows.filter((m) => m.category === category);
    if (creatorWallet) rows = rows.filter((m) => m.creatorWallet === creatorWallet);
    if (sort === "popular") rows = rows.sort((a, b) => b.inferenceCount - a.inferenceCount);
    else if (sort === "cheapest") rows = rows.sort((a, b) => a.licensePriceUsd - b.licensePriceUsd);
  }

  res.json(ListModelsResponse.parse(toJson(rows)));
});

router.get("/models/:id", async (req, res): Promise<void> => {
  const params = GetModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [model] = await db
    .select()
    .from(modelsTable)
    .where(eq(modelsTable.id, params.data.id));

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.json(GetModelResponse.parse(toJson(model)));
});

router.patch("/models/:id", async (req, res): Promise<void> => {
  const params = UpdateModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(modelsTable).where(eq(modelsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  const [model] = await db
    .update(modelsTable)
    .set(parsed.data)
    .where(eq(modelsTable.id, params.data.id))
    .returning();

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.json(UpdateModelResponse.parse(toJson(model)));
});

router.post("/models/:id/list", async (req, res): Promise<void> => {
  const params = ListModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ListModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(modelsTable).where(eq(modelsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  // Ownership check: only the creator can list the model
  if (existing.creatorWallet.toLowerCase() !== parsed.data.creatorWallet.toLowerCase()) {
    res.status(403).json({ error: "Only the model creator can list this model" });
    return;
  }

  const [model] = await db
    .update(modelsTable)
    .set({ isListed: true, licensePriceUsd: parsed.data.licensePriceUsd })
    .where(eq(modelsTable.id, params.data.id))
    .returning();

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  await db.insert(activityTable).values({
    eventType: "model_listed",
    modelId: model.id,
    modelName: model.name,
    actorWallet: parsed.data.creatorWallet,
    ogExplorerUrl: model.ogExplorerUrl,
    metadata: JSON.stringify({ licensePriceUsd: parsed.data.licensePriceUsd }),
  });

  res.json(ListModelResponse.parse(toJson(model)));
});

export default router;
