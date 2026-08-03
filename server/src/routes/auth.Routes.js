import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import validate from "../middleware/validate.middleware.js";
import { registerSchema } from "../validators/auth.validators.js";



//router 
const router = Router();

// register route
router.post("/register", validate(registerSchema), authController.register);

export default router; 