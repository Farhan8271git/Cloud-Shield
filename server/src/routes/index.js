import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.Routes.js";
import fileRoutes from "./file.routes.js";
import securityRoutes from "./security.routes.js";
import activityAnalysisRoutes from "./activityAnalysis.routes.js";

const router = Router();
// health 
router.use("/",healthRoutes);

// authentication 
router.use("/auth", authRoutes);

//file management 
router.use("/files", fileRoutes);

// security 
router.use("/security", securityRoutes);

//activity analysis 
router.use("/security/activity-analysis", activityAnalysisRoutes);

export default router;