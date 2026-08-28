import activityAnalysisController from "../controllers/activityAnalysis.controller.js";
import AppError from "../utils/AppError.js";
import activityAnalysisService from "./activityAnalysis.service";

const detectSuspiciousActivity = async (userId, windowSeconds = 30) => {
    if (!userId) {
        throw new AppError("User id is required,", 400);
    }

    const analysis = await activityAnalysisService.analyzeRecentActivity(userId, windowSeconds);
    const signals = [];

    //  1. Multiple unique files modified within a short window

    if (analysis.uniqueFiles >= 3) {
        signals.push({
            type: "mass_file_modification",
            severity: "medium",
            description: " Multiple unique files were modified within a short period.",
            evidence: {
                uniqueFiles: analysis.uniqueFiles,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    // Detection rule #2
    if (
        analysis.modifications > 3 && 
        analysis.windowSeconds <= 30
    ) {
        signals.push ({
            type: "rapid_file_modification",
            severity: "high",
            description: "More than 3 file modifications occured within 30 seconds",
            evidence: {
                modifications: analysis.modifications,
                windowSeconds: analysis.windowSeconds,
            },
        });
    }

    // Rule #3: Detect multiple file extension changes within a short window.

    if ( 
        analysis.extensionChanges >= 2 &&
        analysis.windowSeconds <= 30
    ) {
        signals.push({
            type: "multiple_extension_changes",
            security: "high",
            description: "Multiple files changed their extensions within a short period.",
            evidence :{
                extensionChanges: analysis.extensionChanges,
                windowSeconds: analysis.windowSeconds,
            },
        });


        // RULE 4 DETECT MULTIPLE FILES RENAME 
        if(
            analysis.renames >= 3 &&
            analysis.windowSeconds <= 30
        ) {
            signals.push ({
                type: "mass_file_rename",
                severity: "medium",
                description: " Multiple files were renamd within a short period.",
                evidence:{
                    renames : analysis.renames,
                    windowSeconds: analysis.windowSeconds,
                },
            });
        }
    }


    return {
        windowSeconds: analysis.windowSeconds, signals,
        signalCount: signals.length, activity: analysis
    };
};

export default {
    detectSuspiciousActivity,
};