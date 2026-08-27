import activityAnalysisService from "../services/activityAnalysis.service.js";
import { sendSuccess } from "../utils/response.js";

const getRecentActivityAnalysis = async (res, req, next) => { 
    try{
        const userId = req.user._id;
        const windowSeconds = req.query.window ? Number(req.query.window) : 30;

        const analysis  = await  activityAnalysisService.analyzeRecentActivity(userId, windowSeconds);

        return sendSuccess( res, 200, "Recent file activity analyzed successfully.", analysis);

    } catch (error) {
        next (error);
    }
    
};

export default {
    getRecentActivityAnalysis,
};