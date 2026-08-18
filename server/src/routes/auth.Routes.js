import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import validate from "../middleware/validate.middleware.js";
import { registerSchema, LoginSchema, } from "../validators/auth.validators.js";
import authenticate from "../middleware/auth.middleware.js";


//router 
const router = Router();

// register route
router.post("/register", validate(registerSchema), authController.register);

//login route 
router.post( "/login", validate(LoginSchema), authController.login);

// login
router.get("/me", authenticate, authController.me);


export default router; 