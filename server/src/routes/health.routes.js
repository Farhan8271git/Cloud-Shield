import { Router } from "express";
const router = Router();

router .get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        message: "Cloud-Shield API is working properly",
        timestamp: new Date().toISOString(),
        enviroment: process.env.NODE_ENV || "development",

    });
});

export default router;