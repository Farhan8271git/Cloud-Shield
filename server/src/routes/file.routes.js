import { Router } from "express";
import fileController from "../controllers/file.controller.js";
import authenticate from "../middleware/auth.middleware.js"; 
import upload from "../middleware/upload.middleware.js";
import integrityController from "../controllers/integrity.controller.js";


const router = Router();

// create/ upload file metadata for authenticated user 
router.post("/", authenticate, upload.single("file"),
fileController.createFile);

// get file owned by authenticated user 
router.get("/:fileId", authenticate,fileController.getFile);

// file integrity check  
router.get ("/:fileId/integrity", authenticate, integrityController.checkIntegrity);

export default router;