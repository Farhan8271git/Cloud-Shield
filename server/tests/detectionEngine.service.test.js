import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import activityAnalysisService from "../src/services/activityAnalysis.service.js";
import detectionEngine from "../src/services/detectionEngine.service.js";

const createAnalysis = (overrides = {}) => ({
    windowSeconds: 30,
    totalActivities: 0,
    uniqueFiles: 0,
    modifications: 0,
    renames: 0,
    deletions: 0,
    extensionChanges: 0,
    activities: [],
    ...overrides,
});

describe("detectionEngine.detectSuspiciousActivity", () => {
    let analysisMock;

    beforeEach(() => {
        analysisMock = mock.method(
            activityAnalysisService,
            "analyzeRecentActivity",
            async (_userId, windowSeconds) =>
                createAnalysis({ windowSeconds })
        );
    });

    afterEach(() => {
        mock.restoreAll();
    });

    it("should reject a missing user ID", async () => {
        await assert.rejects(
            detectionEngine.detectSuspiciousActivity(null),
            {
                message: "User id is required.",
                statusCode: 400,
            }
        );

        assert.equal(analysisMock.mock.callCount(), 0);
    });

    it("should reject an invalid analysis window", async () => {
        await assert.rejects(
            detectionEngine.detectSuspiciousActivity("user-1", 0),
            {
                message: "Window must be between 1 and 300 seconds.",
                statusCode: 400,
            }
        );

        assert.equal(analysisMock.mock.callCount(), 0);
    });

    it("should detect mass file modification", async () => {
        analysisMock.mock.mockImplementation(async () =>
            createAnalysis({
                uniqueFiles: 3,
            })
        );

        const result =
            await detectionEngine.detectSuspiciousActivity("user-1");

        assert.ok(
            result.signals.some(
                (signal) => signal.type === "mass_file_modification"
            )
        );
    });

    it("should detect rapid file modification", async () => {
        analysisMock.mock.mockImplementation(async () =>
            createAnalysis({
                modifications: 4,
            })
        );

        const result =
            await detectionEngine.detectSuspiciousActivity("user-1");

        const signal = result.signals.find(
            (item) => item.type === "rapid_file_modification"
        );

        assert.ok(signal);
        assert.equal(signal.severity, "high");
    });

    it("should report extension changes with a severity", async () => {
        analysisMock.mock.mockImplementation(async () =>
            createAnalysis({
                extensionChanges: 2,
            })
        );

        const result =
            await detectionEngine.detectSuspiciousActivity("user-1");

        const signal = result.signals.find(
            (item) => item.type === "multiple_extension_changes"
        );

        assert.ok(signal);
        assert.equal(signal.severity, "high");
        assert.equal(signal.security, undefined);
    });

    it("should detect mass renaming independently of extension changes", async () => {
        analysisMock.mock.mockImplementation(async () =>
            createAnalysis({
                renames: 3,
                extensionChanges: 0,
            })
        );

        const result =
            await detectionEngine.detectSuspiciousActivity("user-1");

        assert.ok(
            result.signals.some(
                (signal) => signal.type === "mass_file_rename"
            )
        );
    });

    it("should return no signals for normal activity", async () => {
        const result =
            await detectionEngine.detectSuspiciousActivity("user-1");

        assert.equal(result.signalCount, 0);
        assert.deepEqual(result.signals, []);
    });
});