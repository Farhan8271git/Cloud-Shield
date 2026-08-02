import healthService from "../services/health.service.js";

const getHealth = (req, res) => {
    const healthData = healthService.getHealthStatus();
    res.status(200).json({
        success: true,
        data: healthData,
    });

};
export default {
    getHealth,
};