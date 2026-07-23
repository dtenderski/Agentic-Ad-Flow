import { Router, type IRouter } from "express";
import healthRouter from "./health";
import businessesRouter from "./businesses";
import productsRouter from "./products";
import campaignsRouter from "./campaigns";
import adsetsRouter from "./adsets";
import creativesRouter from "./creatives";
import pipelineRouter from "./pipeline";
import blueprintsRouter from "./blueprints";
import approvalsRouter from "./approvals";
import memoryRouter from "./memory";
import dashboardRouter from "./dashboard";
import metaRouter from "./meta";
import googleRouter from "./google";
import tiktokRouter from "./tiktok";
import linkedinRouter from "./linkedin";
import copilotRouter from "./copilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(businessesRouter);
router.use(productsRouter);
router.use(campaignsRouter);
router.use(adsetsRouter);
router.use(creativesRouter);
router.use(pipelineRouter);
router.use(blueprintsRouter);
router.use(approvalsRouter);
router.use(memoryRouter);
router.use(metaRouter);
router.use(googleRouter);
router.use(tiktokRouter);
router.use(linkedinRouter);
router.use(copilotRouter);

export default router;
