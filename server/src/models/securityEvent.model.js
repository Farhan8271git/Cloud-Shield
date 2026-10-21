import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
    {
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
            type: String,
            enum: [
                "integrity_violation",
                "suspicious_activity",
                "ransomware_detected",
            ],
            required: true,
            index: true,
        },

        // Used for integrity-transition identity.
        previousHash: {
            type: String,
            default: null,
        },

        currentHash: {
            type: String,
            default: null,
        },

        // Identifies the detection rule that generated a signal.
        detectionType: {
            type: String,
            default: null,
            trim: true,
            maxlength: 100,
        },

        // Stable identifier for a particular detection episode.
        episodeId: {
            type: String,
            default: null,
            trim: true,
            maxlength: 128,
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
            maxlength: 500,
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

// Integrity events are unique by the actual hash transition.
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
        name: "unique_security_event_transition_integrity",
        partialFilterExpression: {
            eventType: "integrity_violation",
        },
    }
);

// Detection events are unique by their explicit episode identity.
securityEventSchema.index(
    {
        userId: 1,
        fileId: 1,
        eventType: 1,
        detectionType: 1,
        episodeId: 1,
    },
    {
        unique: true,
        name: "unique_security_event_episode",
        partialFilterExpression: {
            episodeId: {
                $type: "string",
            },
        },
    }
);

const SecurityEvent = mongoose.model(
    "SecurityEvent",
    securityEventSchema
);

export default SecurityEvent;