import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { after, before, describe, it } from "node:test";

import SecurityEvent from "../src/models/securityEvent.model.js";
import securityEventService from "../src/services/securityEvent.service.js";

// Load the dedicated test database configuration
dotenv.config({ path: ".env.test" });

const testUri = process.env.MONGODB_TEST_URI;

const testUsers = [];

const newIdentity = () => {
    const identity = {
        userId: new mongoose.Types.ObjectId(),
        fileId: new mongoose.Types.ObjectId(),
    };

    testUsers.push(identity.userId);

    return identity;
};

const createIntegrityPayload = (identity, overrides = {}) => ({
    ...identity,
    eventType: "integrity_violation",
    previousHash: "trusted-hash",
    currentHash: "modified-hash",
    riskScore: 90,
    reason: "Integration test: file integrity violation",
    ...overrides,
});

const createDetectionPayload = (identity, overrides = {}) => ({
    ...identity,
    eventType: "suspicious_activity",
    previousHash: null,
    currentHash: null,
    detectionType: "integration_test",
    episodeId: `episode-${crypto.randomUUID()}`,
    riskScore: 75,
    reason: "Integration test: suspicious activity",
    ...overrides,
});

describe(
    "SecurityEvent MongoDB integration tests",
    { skip: !testUri },
    () => {
        before(async () => {
            // Protect non-test databases
            const databaseName = new URL(testUri).pathname
                .replace(/^\/+/, "");

            assert.match(
                databaseName,
                /(?:_|-)test$/i,
                "MONGODB_TEST_URI must point to a database ending in _test or -test"
            );

            // Disable automatic index creation so migration is tested as-is
            await mongoose.connect(testUri, {
                autoIndex: false,
            });

            const indexes = await SecurityEvent.collection.indexes();
            const indexNames = indexes.map((index) => index.name);

            assert.ok(
                indexNames.includes(
                    "unique_security_event_transition_integrity"
                ),
                "Integrity transition index is missing"
            );

            assert.ok(
                indexNames.includes("unique_security_event_episode"),
                "Detection episode index is missing"
            );

            assert.ok(
                !indexNames.includes("unique_security_event_transition"),
                "Legacy transition index must be removed"
            );
        });

        after(async () => {
            try {
                // Remove only records created by these tests
                if (
                    mongoose.connection.readyState === 1 &&
                    testUsers.length > 0
                ) {
                    await SecurityEvent.deleteMany({
                        userId: { $in: testUsers },
                    });
                }
            } finally {
                if (mongoose.connection.readyState !== 0) {
                    await mongoose.disconnect();
                }
            }
        });

        it("returns the existing integrity event instead of duplicating it", async () => {
            const identity = newIdentity();
            const payload = createIntegrityPayload(identity);

            const first = await securityEventService.createSecurityEvent(
                payload
            );

            const second = await securityEventService.createSecurityEvent(
                payload
            );

            assert.equal(
                second._id.toString(),
                first._id.toString()
            );

            const count = await SecurityEvent.countDocuments({
                userId: identity.userId,
                fileId: identity.fileId,
                eventType: "integrity_violation",
            });

            assert.equal(count, 1);
        });

        it("rejects duplicate integrity transitions at the database level", async () => {
            const identity = newIdentity();
            const payload = createIntegrityPayload(identity);

            await SecurityEvent.create(payload);

            await assert.rejects(
                SecurityEvent.create({
                    ...payload,
                    reason: "A duplicate transition",
                }),
                (error) => error?.code === 11000
            );
        });

        it("returns the existing detection event for the same episode", async () => {
            const identity = newIdentity();

            const payload = createDetectionPayload(identity);

            const first = await securityEventService.createSecurityEvent(
                payload
            );

            const second = await securityEventService.createSecurityEvent({
                ...payload,
                reason: "Repeated detection of the same episode",
            });

            assert.equal(
                second._id.toString(),
                first._id.toString()
            );

            const count = await SecurityEvent.countDocuments({
                userId: identity.userId,
                fileId: identity.fileId,
                eventType: payload.eventType,
                detectionType: payload.detectionType,
                episodeId: payload.episodeId,
            });

            assert.equal(count, 1);
        });

        it("rejects duplicate detection episodes at the database level", async () => {
            const identity = newIdentity();
            const payload = createDetectionPayload(identity);

            await SecurityEvent.create(payload);

            await assert.rejects(
                SecurityEvent.create({
                    ...payload,
                    reason: "A duplicate episode",
                }),
                (error) => error?.code === 11000
            );
        });

        it("allows different detection episodes with the same hash values", async () => {
            const identity = newIdentity();

            const firstPayload = createDetectionPayload(identity, {
                previousHash: "same-previous-hash",
                currentHash: "same-current-hash",
                episodeId: `episode-${crypto.randomUUID()}`,
            });

            const secondPayload = {
                ...firstPayload,
                episodeId: `episode-${crypto.randomUUID()}`,
                reason: "A separate detection episode",
            };

            const first = await securityEventService.createSecurityEvent(
                firstPayload
            );

            const second = await securityEventService.createSecurityEvent(
                secondPayload
            );

            assert.notEqual(
                first._id.toString(),
                second._id.toString()
            );

            const count = await SecurityEvent.countDocuments({
                userId: identity.userId,
                fileId: identity.fileId,
                eventType: "suspicious_activity",
            });

            assert.equal(count, 2);
        });
    }
);