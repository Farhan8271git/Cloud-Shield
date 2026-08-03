import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.Routes.js";


const router = Router();
// health route 
router.use("/",healthRoutes);

// authentication routes
router.use("/auth", authRoutes);

export default router;