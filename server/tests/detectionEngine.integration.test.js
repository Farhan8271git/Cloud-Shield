import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { after, before, describe, it } from "node:test";

import FileActivity from "../src/models/fileActivity.model.js";
import SecurityEvent from "../src/models/securityEvent.model.js";
import detectionEngine from "../src/services/detectionEngine.service.js";

// Load the dedicated test database configuration
dotenv.config({ path: ".env.test" });

const testUri = process.env.MONGODB_TEST_URI;
const testUserIds = [];

const createTestActivity = (userId, fileId, overrides = {}) => ({
    userId,
    fileId,
    activityType: "modified",
    ...overrides,
});

const uniqueEpisodeActivities = async (userId, count = 4) => {
    const activities = Array.from({ length: count }, () =>
        createTestActivity(
            userId,
            new mongoose.Types.ObjectId()
        )
    );

    return FileActivity.insertMany(activities);
};

describe(
    "Detection engine MongoDB integration tests",
    { skip: !testUri },
    () => {
        before(async () => {
            const databaseName = new URL(testUri).pathname
                .replace(/^\/+/, "");

            assert.match(
                databaseName,
                /(?:_|-)test$/i,
                "MONGODB_TEST_URI must target a database ending in _test or -test"
            );

            await mongoose.connect(testUri, {
                autoIndex: false,
            });

            const indexes = await SecurityEvent.collection.indexes();
            const indexNames = indexes.map((index) => index.name);

            assert.ok(
                indexNames.includes("unique_security_event_episode"),
                "Detection episode unique index is missing"
            );

            assert.ok(
                indexNames.includes(
                    "unique_security_event_transition_integrity"
                ),
                "Integrity transition unique index is missing"
            );
        });

        after(async () => {
            try {
                if (mongoose.connection.readyState === 1) {
                    if (testUserIds.length > 0) {
                        await FileActivity.deleteMany({
                            userId: { $in: testUserIds },
                        });

                        await SecurityEvent.deleteMany({
                            userId: { $in: testUserIds },
                        });
                    }
                }
            } finally {
                if (mongoose.connection.readyState !== 0) {
                    await mongoose.disconnect();
                }
            }
        });

        it("detects multiple file modifications and persists events", async () => {
            const userId = new mongoose.Types.ObjectId();
            testUserIds.push(userId);

            await uniqueEpisodeActivities(userId, 4);

            const result =
                await detectionEngine.detectSuspiciousActivity(
                    userId,
                    30
                );

            assert.ok(
                result.signals.some(
                    (signal) =>
                        signal.type === "mass_file_modification"
                )
            );

            assert.ok(result.persistedEventCount > 0);

            const persistedCount =
                await SecurityEvent.countDocuments({
                    userId,
                    eventType: "suspicious_activity",
                });

            assert.ok(persistedCount > 0);
        });

        it("does not persist events for normal activity", async () => {
            const userId = new mongoose.Types.ObjectId();
            testUserIds.push(userId);

            await FileActivity.create(
                createTestActivity(
                    userId,
                    new mongoose.Types.ObjectId()
                )
            );

            const result =
                await detectionEngine.detectSuspiciousActivity(
                    userId,
                    30
                );

            assert.equal(result.signalCount, 0);
            assert.equal(result.persistedEventCount, 0);

            const persistedCount =
                await SecurityEvent.countDocuments({ userId });

            assert.equal(persistedCount, 0);
        });

        it("does not create duplicate events when identical evidence is reprocessed", async () => {
            const userId = new mongoose.Types.ObjectId();
            testUserIds.push(userId);

            const insertedActivities =
                await uniqueEpisodeActivities(userId, 4);

            const first =
                await detectionEngine.detectSuspiciousActivity(
                    userId,
                    30
                );

            const second =
                await detectionEngine.detectSuspiciousActivity(
                    userId,
                    30
                );

            assert.ok(first.persistedEventCount > 0);

            assert.equal(
                second.persistedEventCount,
                first.persistedEventCount
            );

            const persistedCount =
                await SecurityEvent.countDocuments({
                    userId,
                    eventType: "suspicious_activity",
                });

            assert.equal(
                persistedCount,
                first.persistedEventCount
            );

            assert.ok(insertedActivities.length > 0);
        });

        it("propagates persistence errors instead of returning success", async () => {
            const userId = new mongoose.Types.ObjectId();
            testUserIds.push(userId);

            await uniqueEpisodeActivities(userId, 4);

            // Temporarily replace the service method to simulate a database failure.
            const securityEventService =
                await import("../src/services/securityEvent.service.js");

            const originalMethod =
                securityEventService.default.createSecurityEvent;

            try {
                securityEventService.default.createSecurityEvent =
                    async () => {
                        throw new Error("Simulated persistence failure");
                    };

                await assert.rejects(
                    detectionEngine.detectSuspiciousActivity(
                        userId,
                        30
                    ),
                    /Simulated persistence failure/
                );
            } finally {
                securityEventService.default.createSecurityEvent =
                    originalMethod;
            }
        });
    }
);