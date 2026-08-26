import detectionService from "../services/detection.service.js";
import { sendSuccess } from "../utils/response.js";

const getRecentActivity = async (req, res, next) => {
    try{
        const userId = req.user._id;

        const windowSeconds = req.query.window ? Number(req.query.window) : 30;

        const activity = await detectionService.getRecentIntegrityActivity( userId, windowSeconds);

        return sendSuccess( res, 200, "Recent file activity retrieved successfully.", activity);
    } catch (error) {
        next(error)
    }
};

export default {
    getRecentActivity,
};