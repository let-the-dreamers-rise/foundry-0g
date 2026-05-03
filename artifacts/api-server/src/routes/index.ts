import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fineTuneRouter from "./fine-tune";
import modelsRouter from "./models";
import licensesRouter from "./licenses";
import inferenceRouter from "./inference";
import activityRouter from "./activity";
import statsRouter from "./stats";
import ogStatusRouter from "./og-status";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ogStatusRouter);
router.use(fineTuneRouter);
router.use(modelsRouter);
router.use(licensesRouter);
router.use(inferenceRouter);
router.use(activityRouter);
router.use(statsRouter);

export default router;
