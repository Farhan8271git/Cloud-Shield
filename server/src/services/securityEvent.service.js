import SecurityEvent from "../models/securityEvent.model.js";
import AppError from "../utils/AppError.js";


// create the security event
const createSecurityEvent = async ({
    userId, fileId, eventType, previousHash = null, currentHash = null, riskScore = 0, reason, metadata= {},
}) => {
    if(!userId || fileId) {
        throw new AppError("User and file ID are required.", 400);
    }

    if (!eventType) {
        throw new AppError("security event type is required.", 400);
    }

    if (!reason) {
        throw new AppError(
            "Security event reason is required.", 400
        );
    }

    if (riskScore < 0 || riskScore > 100) {
        throw new AppError("Risk score must be between 0 and 100.", 400);
    }
// security event 
const existingEvent = await SecurityEvent.findOne({
    userId, fileId, eventType, previousHash, currentHash,
});
if (existingEvent) {
    return existingEvent;
}

const securityEvent = await SecurityEvent.create({
    userId, fileId, eventType, previousHash, currentHash, riskScore, reason, metadata,
});

    return securityEvent;
};

export default {
    createSecurityEvent
};