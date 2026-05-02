import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, activityTable } from "@workspace/db";
import {
  GetActivityQueryParams,
  GetActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const query = GetActivityQueryParams.safeParse(req.query);
  const limit = (query.success && query.data.limit) ? query.data.limit : 50;

  const events = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json(GetActivityResponse.parse(events));
});

export default router;
