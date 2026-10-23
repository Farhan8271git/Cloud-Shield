import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

import fileActivity from "../src/models/fileActivity.model.js";
import activityAnalysisService from "../src/services/activityAnalysis.service.js";

// Create a sample activity record.
const createActivity = (overrides = {}) => ({
    fileId: "file-1",
    activityType: "created",
    previousExtension: null,
    currentExtension: ".pdf",
    createdAt: new Date(),
    ...overrides,
});

// Mock the Mongoose query chain.
const mockActivityQuery = (activities) => {
    let query;

    query = {
        select: mock.fn(() => query),
        sort: mock.fn(() => query),
        lean: mock.fn(async () => activities),
    };

    mock.method(fileActivity, "find", () => query);

    return query;
};

describe("activityAnalysis.analyzeRecentActivity", () => {
    afterEach(() => {
        mock.restoreAll();
    });

    it("should reject a missing user ID", async () => {
        const findMock = mock.method(fileActivity, "find", () => {
            throw new Error("Database query should not run");
        });

        await assert.rejects(
            activityAnalysisService.analyzeRecentActivity(null),
            {
                message: "User id is required.",
                statusCode: 400,
            }
        );

        assert.equal(findMock.mock.callCount(), 0);
    });

    it("should reject invalid analysis windows", async () => {
        const findMock = mock.method(fileActivity, "find", () => {
            throw new Error("Database query should not run");
        });

        for (const invalidWindow of [0, -1, 301, 1.5, NaN]) {
            await assert.rejects(
                activityAnalysisService.analyzeRecentActivity(
                    "user-1",
                    invalidWindow
                ),
                {
                    message: "window must be between 1 and 300 seconds.",
                    statusCode: 400,
                }
            );
        }

        assert.equal(findMock.mock.callCount(), 0);
    });

    it("should return zero counts when no activities exist", async () => {
        const query = mockActivityQuery([]);

        const result =
            await activityAnalysisService.analyzeRecentActivity(
                "user-1",
                30
            );

        assert.equal(result.windowSeconds, 30);
        assert.equal(result.totalActivities, 0);
        assert.equal(result.uniqueFiles, 0);
        assert.equal(result.modifications, 0);
        assert.equal(result.renames, 0);
        assert.equal(result.deletions, 0);
        assert.equal(result.extensionChanges, 0);
        assert.deepEqual(result.activities, []);

        assert.equal(query.select.mock.callCount(), 1);
        assert.equal(query.sort.mock.callCount(), 1);
        assert.equal(query.lean.mock.callCount(), 1);
    });

    it("should count activities, unique files, and extension changes", async () => {
        const activities = [
            createActivity({
                fileId: "file-1",
                activityType: "modified",
                previousExtension: ".txt",
                currentExtension: ".locked",
            }),
            createActivity({
                fileId: "file-1",
                activityType: "renamed",
                previousExtension: ".txt",
                currentExtension: ".txt",
            }),
            createActivity({
                fileId: "file-2",
                activityType: "deleted",
                previousExtension: ".pdf",
                currentExtension: null,
            }),
            createActivity({
                fileId: "file-3",
                activityType: "created",
                previousExtension: null,
                currentExtension: ".png",
            }),
        ];

        mockActivityQuery(activities);

        const result =
            await activityAnalysisService.analyzeRecentActivity(
                "user-1",
                60
            );

        assert.equal(result.windowSeconds, 60);
        assert.equal(result.totalActivities, 4);
        assert.equal(result.uniqueFiles, 3);
        assert.equal(result.modifications, 1);
        assert.equal(result.renames, 1);
        assert.equal(result.deletions, 1);
        assert.equal(result.extensionChanges, 1);
        assert.equal(result.activities, activities);
    });

    it("should query the requested user and time window", async () => {
        const query = mockActivityQuery([]);

        const before = Date.now();

        await activityAnalysisService.analyzeRecentActivity(
            "user-42",
            45
        );

        const after = Date.now();

        const [filter] = fileActivity.find.mock.calls[0].arguments;

        assert.equal(filter.userId, "user-42");
        assert.ok(filter.createdAt.$gte instanceof Date);

        assert.ok(
            filter.createdAt.$gte.getTime() >= before - 45_000 &&
            filter.createdAt.$gte.getTime() <= after - 45_000
        );

        assert.equal(
            query.select.mock.calls[0].arguments[0],
            "fileId activityType previousExtension currentExtension createdAt"
        );

        assert.deepEqual(query.sort.mock.calls[0].arguments[0], {
            createdAt: -1,
        });
    });
});