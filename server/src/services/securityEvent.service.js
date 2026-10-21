import SecurityEvent from "../models/securityEvent.model.js";
import AppError from "../utils/AppError.js";

const EVENT_TYPES = new Set([
    "integrity_violation",
    "suspicious_activity",
    "ransomware_detected",
]);

const isDuplicateKeyError = (error) => error?.code === 11000;

const createSecurityEvent = async ({
    userId,
    fileId,
    eventType,
    previousHash = null,
    currentHash = null,
    riskScore = 0,
    reason,
    metadata = {},
}) => {
    if (!userId || !fileId) {
        throw new AppError(
            "User and file ID are required.",
            400
        );
    }

    if (!EVENT_TYPES.has(eventType)) {
        throw new AppError(
            "Invalid security event type.",
            400
        );
    }

    if (typeof reason !== "string" || !reason.trim()) {
        throw new AppError(
            "Security event reason is required.",
            400
        );
    }

    if (
        typeof riskScore !== "number" ||
        !Number.isFinite(riskScore) ||
        riskScore < 0 ||
        riskScore > 100
    ) {
        throw new AppError(
            "Risk score must be a number between 0 and 100.",
            400
        );
    }

    const eventIdentity = {
        userId,
        fileId,
        eventType,
        previousHash,
        currentHash,
    };

    const existingEvent =
        await SecurityEvent.findOne(eventIdentity);

    if (existingEvent) {
        return existingEvent;
    }

    try {
        return await SecurityEvent.create({
            ...eventIdentity,
            riskScore,
            reason: reason.trim(),
            metadata,
        });
    } catch (error) {
        // The unique index may reject a concurrent duplicate insert.
        if (!isDuplicateKeyError(error)) {
            throw error;
        }

        const duplicateEvent =
            await SecurityEvent.findOne(eventIdentity);

        if (duplicateEvent) {
            return duplicateEvent;
        }

        // Do not hide a duplicate-key error from another index.
        throw error;
    }
};

export default {
    createSecurityEvent,
};