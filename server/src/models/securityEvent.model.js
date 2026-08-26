import mongoose from 'mongoose';
import { maxLength, trim } from 'zod';

const securityEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        required: true,
        index: true,
    },

    eventType: {
        type: "string",
        enum: [
            "integrity_violation",
            "suspicious_activity",
            "ransomware_detected",
        ],
        required: true,
        index: true,
    },

    previousHash: {
        type: String,
        default: null,
    },

    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },

    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    previousExtension: {
        type: String,
        default: null,
        trim: true,
    },

    currentExtension: {
        type: String,
        default: null,
        trim: true,
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

},
    {
        timestamps: true,
    }
);

securityEventSchema.index(
    {
        userId: 1,
        fileId: 1,
        eventType: 1,
        previousHash: 1,
        currentHash: 1,
    },
    {
        unique: true,
        name: "unique_security_event_transition",
    }
);

const SecurityEvent = mongoose.model(
    "SecurityEvent", securityEventSchema
);

export default SecurityEvent;