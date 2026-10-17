import AppError from "../utils/AppError.js";
import activityAnalysisService from "./activityAnalysis.service.js";

const detectSuspiciousActivity = async (userId, windowSeconds = 30) => {
    if (!userId) {
        throw new AppError("User id is required.", 400);
    }

    if (
        !Number.isInteger(windowSeconds) ||
        windowSeconds <= 0 ||
        windowSeconds > 300
    ) {
        throw new AppError(
            "Window must be between 1 and 300 seconds.",
            400
        );
    }

    const analysis = await activityAnalysisService.analyzeRecentActivity(
        userId,
        windowSeconds
    );

    const signals = [];

    // Rule 1: multiple unique files modified
    if (analysis.uniqueFiles >= 3) {
        signals.push({
            type: "mass_file_modification",
            severity: "medium",
            description: "Multiple unique files were modified within a short period.",
            evidence: {
                uniqueFiles: analysis.uniqueFiles,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    // Rule 2: rapid file modifications
    if (
        analysis.modifications > 3 &&
        analysis.windowSeconds <= 30
    ) {
        signals.push({
            type: "rapid_file_modification",
            severity: "high",
            description: "More than 3 file modifications occurred within 30 seconds.",
            evidence: {
                modifications: analysis.modifications,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    // Rule 3: multiple file extension changes
    if (
        analysis.extensionChanges >= 2 &&
        analysis.windowSeconds <= 30
    ) {
        signals.push({
            type: "multiple_extension_changes",
            severity: "high",
            description: "Multiple files changed their extensions within a short period.",
            evidence: {
                extensionChanges: analysis.extensionChanges,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    // Rule 4: mass file renaming
    if (
        analysis.renames >= 3 &&
        analysis.windowSeconds <= 30
    ) {
        signals.push({
            type: "mass_file_rename",
            severity: "medium",
            description: "Multiple files were renamed within a short period.",
            evidence: {
                renames: analysis.renames,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    return {
        windowSeconds: analysis.windowSeconds,
        signals,
        signalCount: signals.length,
        activity: analysis,
    };
};

export default {
    detectSuspiciousActivity,
};