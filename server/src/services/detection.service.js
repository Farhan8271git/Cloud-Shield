import SecurityEvent from "../models/securityEvent.model.js";
import AppError from "../utils/AppError.js";
import riskScorer from "../utils/riskScorer.js";

const getRecentIntegrityActivity = async (userId, windowSeconds = 30 ) => {
    if (!userId) {
        throw new AppError("user id is required.", 400);
    }


    if (!Number.isInteger(windowSeconds) || windowSeconds <=0 || windowSeconds > 300) {
        throw new AppError("window must be between 1 and 300 seconds.", 400);
    }


    const windowStart = new Date(
        Date.now() - windowSeconds * 1000
    );

    const events = await SecurityEvent.find({ 
        userId, eventType:"integrity_violation",
        createdAt: {
            $gte: windowStart,
        },
    })

    .select("filedId previousHash currentHash createdAt riskScore").sort({
        createdAt: -1,
    });

    const uniqueFields = new Set(
        events.map((event) => event.fileId.toString())
    );

    const unqiueFieldsModified = uniqueFields.size;
    const totalEvents = events.length;

    const risk = riskScorer.calculateRiskScore({
        unqiueFieldsModified, totalEvents, windowSeconds,

    });

    
    const riskLevel = riskScorer.getRiskLevel(
        risk.score
    );

    return {
        windowSeconds,
        totalEvents: events.length,
        uniqueFilesModified: uniqueFields.size,
        riskScore: risk.score,
        riskLevel, reasons: risk.reasons,
        events,
    };
};

export default {
    getRecentIntegrityActivity,
};