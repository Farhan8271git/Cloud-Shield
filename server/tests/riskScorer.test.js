import { describe, it } from "node:test";
import assert from "node:assert/strict";

import riskScorer from "../src/utils/riskScorer.js";

describe("riskScorer.calculateRiskScore", () => {
    it("should return zero risk when there is no activity", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 0,
            totalEvents: 0,
            windowSeconds: 30,
        });

        assert.equal(result.score, 0);
        assert.deepEqual(result.reasons, []);
    });

    it("should assign 5 points for one modified file", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 1,
            totalEvents: 1,
            windowSeconds: 30,
        });

        assert.equal(result.score, 5);
        assert.equal(result.reasons.length, 1);
    });

    it("should assign 15 points for 3 unique modified files", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 3,
            totalEvents: 3,
            windowSeconds: 30,
        });

        assert.equal(result.score, 15);
    });

    it("should assign 30 points for 6 to 10 unique modified files", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 8,
            totalEvents: 8,
            windowSeconds: 60,
        });

        assert.equal(result.score, 30);
    });

    it("should assign 45 points for more than 10 unique modified files", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 11,
            totalEvents: 11,
            windowSeconds: 60,
        });

        assert.equal(result.score, 45);
    });

    it("should add frequency risk for more than 3 events within 30 seconds", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 2,
            totalEvents: 4,
            windowSeconds: 30,
        });

        assert.equal(result.score, 20);
        assert.equal(result.reasons.length, 2);
    });

    it("should add 25 frequency points for more than 10 events within 30 seconds", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 3,
            totalEvents: 11,
            windowSeconds: 30,
        });

        assert.equal(result.score, 40);
        assert.equal(result.reasons.length, 2);
    });

    it("should not apply the rapid-event bonus outside the 30-second window", () => {
        const result = riskScorer.calculateRiskScore({
            uniqueFilesModified: 3,
            totalEvents: 11,
            windowSeconds: 60,
        });

        assert.equal(result.score, 15);
    });
});

describe("riskScorer.getRiskLevel", () => {
    it("should classify scores below 30 as low", () => {
        assert.equal(riskScorer.getRiskLevel(0), "low");
        assert.equal(riskScorer.getRiskLevel(29), "low");
    });

    it("should classify scores from 30 to 59 as medium", () => {
        assert.equal(riskScorer.getRiskLevel(30), "medium");
        assert.equal(riskScorer.getRiskLevel(59), "medium");
    });

    it("should classify scores from 60 to 79 as high", () => {
        assert.equal(riskScorer.getRiskLevel(60), "high");
        assert.equal(riskScorer.getRiskLevel(79), "high");
    });

    it("should classify scores of 80 or more as critical", () => {
        assert.equal(riskScorer.getRiskLevel(80), "critical");
        assert.equal(riskScorer.getRiskLevel(100), "critical");
    });
});