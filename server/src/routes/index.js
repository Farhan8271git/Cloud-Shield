import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.Routes.js";
import fileRoutes from "./file.routes.js";

const router = Router();
// health route 
router.use("/",healthRoutes);

// authentication routes
router.use("/auth", authRoutes);

//file management routes
router.use("/files", fileRoutes);

export default router;