import healthService from "../services/health.service.js";
import { sendSuccess } from "../utils/response.js";

const getHealth = (req,res) => {
    const healthData = healthService.getHealthStatus();
    return sendSuccess(res, 200, "Cloud shield API is running",
        healthData
    );
};

export default {
    getHealth,
};