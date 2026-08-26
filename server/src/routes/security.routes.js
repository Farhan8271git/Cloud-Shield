import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import detectionController from "../controllers/detection.controller.js";


const router = Router ();

router.get ("/activity", authenticate, detectionController.getRecentActivity);

export default router;