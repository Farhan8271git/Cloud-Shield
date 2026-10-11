import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import File from "../models/file.model.js";
import AppError from "../utils/AppError.js";
import fileActivityService from "./fileActivity.service.js";

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "uploads");

const BACKUP_DIRECTORY = path.join(
    UPLOAD_DIRECTORY,
    "backups"
);

// Record recovery activity without masking the recovery result.
const recordRecoveryActivity = async ({
    userId,
    fileId,
    activityType,
    fileName,
}) => {
    try {
        await fileActivityService.recordFileActivity({
            userId,
            fileId,
            activityType,
            previousName: fileName,
            currentName: fileName,
        });
    } catch (error) {
        // Audit logging failures must remain visible to operators.
        console.error("Recovery activity logging failed:", {
            fileId: String(fileId),
            activityType,
            message: error.message,
        });
    }
};

// Recover a user's file from its trusted backup.
const recoverFile = async (fileId, userId) => {
    if (!fileId || !userId) {
        throw new AppError(
            "File ID and user ID are required.",
            400
        );
    }

    let file = null;

    try {
        // Find the file and enforce ownership.
        file = await File.findOne({
            _id: fileId,
            userId,
        });

        if (!file) {
            throw new AppError(
                "File not found or you do not have permission to access it.",
                404
            );
        }

        // A recovery operation requires a trusted backup.
        if (!file.backupStoredName || !file.backupHash) {
            throw new AppError(
                "Trusted backup is not available for this file.",
                404
            );
        }

        // Build paths using server-controlled filenames.
        const backupPath = path.join(
            BACKUP_DIRECTORY,
            file.backupStoredName
        );

        const currentFilePath = path.join(
            UPLOAD_DIRECTORY,
            file.storedName
        );

        let backupBuffer;

        try {
            backupBuffer = await fs.readFile(backupPath);
        } catch {
            throw new AppError(
                "Trusted backup file is unavailable.",
                404
            );
        }

        // Verify the backup before trusting it.
        const calculatedBackupHash = crypto
            .createHash("sha256")
            .update(backupBuffer)
            .digest("hex");

        if (calculatedBackupHash !== file.backupHash) {
            throw new AppError(
                "Trusted backup integrity verification failed.",
                409
            );
        }

        // Restore the trusted backup.
        try {
            await fs.writeFile(
                currentFilePath,
                backupBuffer
            );
        } catch {
            throw new AppError(
                "Failed to restore the file.",
                500
            );
        }

        // Read the restored file for verification.
        let restoredBuffer;

        try {
            restoredBuffer = await fs.readFile(
                currentFilePath
            );
        } catch {
            throw new AppError(
                "Restored file could not be verified.",
                500
            );
        }

        const restoredHash = crypto
            .createHash("sha256")
            .update(restoredBuffer)
            .digest("hex");

        // The restored file must match the original trusted hash.
        if (restoredHash !== file.hash) {
            throw new AppError(
                "File recovery verification failed.",
                500
            );
        }

        // Update the integrity status after successful verification.
        file.integrityStatus = "intact";

        await file.save();

        // Record the successful recovery.
        await recordRecoveryActivity({
            userId,
            fileId: file._id,
            activityType: "recovered",
            fileName: file.originalName,
        });

        return {
            fileId: file._id,
            originalName: file.originalName,
            restoredHash,
            integrityStatus: file.integrityStatus,
        };
    } catch (error) {
        // Record failures only when the file was identified and its ownership was verified.
        if (file) {
            await recordRecoveryActivity({
                userId,
                fileId: file._id,
                activityType: "recovery_failed",
                fileName: file.originalName,
            });
        }

        // Preserve the original recovery error.
        throw error;
    }
};

export default {
    recoverFile,
};