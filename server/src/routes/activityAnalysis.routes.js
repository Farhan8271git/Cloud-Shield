import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import activityAnalysisController from "../controllers/activityAnalysis.controller.js";

const  router = Router();

router.get("/", authenticate, activityAnalysisController.getRecentActivityAnalysis);

export default router;