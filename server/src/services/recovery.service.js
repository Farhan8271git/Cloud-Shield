import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import File from "../models/file.model.js";
import AppError from "../utils/AppError.js";

const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "uploads");

const BACKUP_DIRECTORY = path.join(UPLOAD_DIRECTORY, "backups");

// Recover a user's file from its trusted backup
const recoverFile = async (fileId, userId) => {
    if (!fileId || !userId) {
        throw new AppError("File ID and user ID are required.", 400);
    }

    // Find the file and enforce ownership
    const file = await File.findOne({
        _id: fileId, userId,
    }
    );

    if (!file) {
        throw new AppError(
            "File not found or you do not have permission to access it.", 404
        );
    }

    // A recovery operation requires a trusted backup
    if (!file.backupStoredName || !file.backupHash) {
        throw new AppError(
            "Trusted backup is not available for this file.", 404
        );
    }

    // Build paths only from server-controlled filenames
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
        throw new AppError("Trusted backup file is unavailable.", 404);
    }

    // Verify the backup before trusting it
    const calculatedBackupHash = crypto
        .createHash("sha256")
        .update(backupBuffer)
        .digest("hex");

    if (calculatedBackupHash !== file.backupHash) {
        throw new AppError("Trusted backup integrity verification failed.", 409
        );
    }

    // Restore the trusted backup
    try {
        await fs.writeFile(
            currentFilePath, backupBuffer
        );
    } catch {
        throw new AppError("Failed to restore the file.", 500
        );
    }

    // Verify the restored file
    let restoredBuffer;

    try {
        restoredBuffer = await fs.readFile(currentFilePath
        );
    } catch {
        throw new AppError("Restored file could not be verified.", 500
        );
    }

    const restoredHash = crypto
        .createHash("sha256")
        .update(restoredBuffer)
        .digest("hex");

    // The restored file must match the original trusted hash
    if (restoredHash !== file.hash) {
        throw new AppError("File recovery verification failed.", 500
        );
    }

    file.integrityStatus = "intact";

    await file.save();

    return {
        fileId: file._id,
        originalName: file.originalName,
        restoredHash,
        integrityStatus: file.integrityStatus,
    };
};

export default {
    recoverFile,
};