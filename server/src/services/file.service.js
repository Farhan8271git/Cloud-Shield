import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import File from "../models/file.model.js";
import AppError from "../utils/AppError.js";
import { validateUploadedFile, } from "../utils/fileValidator.js";
import fileActivityService from "./fileActivity.service.js";

const UPLOAD_DIRECTORY = path.resolve(
    process.cwd(),
    "uploads"
);

const BACKUP_DIRECTORY = path.resolve(
    process.cwd(),
    "uploads", "backups"
)

const writeExclusiveFile = async (filePath, buffer, onCreated) => {
    // Create a new file without overwriting an existing path.
    const handle = await fs.open(filePath, "wx", 0o600);

    // Record ownership immediately after creation succeeds.
    onCreated();

    let operationError = null;

    try {
        await handle.writeFile(buffer);
    } catch (error) {
        operationError = error;
    }

    // Always attempt to close the file handle.
    try {
        await handle.close();
    } catch (error) {
        if (!operationError) {
            operationError = error;
        }
    }

    if (operationError) {
        throw operationError;
    }
};

// Create a secure file record from an uploaded file.
const createFile = async (userId, uploadedFile) => {
    if (!userId) {
        throw new AppError("User ID is required.", 400);
    }

    if (!uploadedFile) {
        throw new AppError("Uploaded file is required.", 400);
    }

    // Validate the uploaded file before writing anything to disk.
    const detectedFile = await validateUploadedFile(uploadedFile);

    // Calculate the SHA-256 hash of the uploaded content.
    const hash = crypto
        .createHash("sha256")
        .update(uploadedFile.buffer)
        .digest("hex");

    // Generate server-controlled filenames.
    const extension = path.extname(uploadedFile.originalname);

    const storedName = `${crypto.randomUUID()}${extension}`;
    const backupStoredName = `${crypto.randomUUID()}${extension}`;

    // Resolve the physical storage paths.
    const absolutePath = path.join(UPLOAD_DIRECTORY, storedName);

    const absoluteBackupPath = path.join(
        BACKUP_DIRECTORY,
        backupStoredName
    );

    // Store relative paths in the database.
    const storagePath = path.join("uploads", storedName);

    const backupStoragePath = path.join(
        "uploads",
        "backups",
        backupStoredName
    );

    // The backup originates from the same validated buffer.
    const backupHash = crypto
        .createHash("sha256")
        .update(uploadedFile.buffer)
        .digest("hex");

    // Verify the expected content hash before writing to disk.
    if (hash !== backupHash) {
        throw new AppError(
            "Trusted backup verification failed.",
            500
        );
    }

    // Track which resources this operation successfully creates.
    let currentFileWritten = false;
    let backupFileWritten = false;
    let createdFileId = null;

    try {
        // Ensure both storage directories exist.
        await fs.mkdir(UPLOAD_DIRECTORY, {
            recursive: true,
        });

        await fs.mkdir(BACKUP_DIRECTORY, {
            recursive: true,
        });

        // Create the current file and track ownership immediately.
        await writeExclusiveFile(
            absolutePath,
            uploadedFile.buffer,
            () => {
                currentFileWritten = true;
            }
        );

        // Create the trusted backup and track ownership immediately.
        await writeExclusiveFile(
            absoluteBackupPath,
            uploadedFile.buffer,
            () => {
                backupFileWritten = true;
            }
        );

        // Read the backup from disk and verify its actual contents.
        const storedBackupBuffer = await fs.readFile(absoluteBackupPath);

        const storedBackupHash = crypto
            .createHash("sha256")
            .update(storedBackupBuffer)
            .digest("hex");

        if (storedBackupHash !== hash) {
            throw new AppError(
                "Trusted backup verification failed.",
                500
            );
        }

        // Create the database record only after both files exist.
        const file = await File.create({
            userId,
            originalName: uploadedFile.originalname,
            storedName,
            storagePath,
            mimeType: detectedFile.mimeType,
            size: uploadedFile.size,
            hash,
            backupStoredName,
            backupStoragePath,
            backupHash,
            status: "pending",
            integrityStatus: "intact",
        });

        createdFileId = file._id;

        // Record the file creation activity.
        await fileActivityService.recordFileActivity({
            userId,
            fileId: file._id,
            activityType: "created",
            currentName: file.originalName,
        });

        return file;
        } catch (error) {
        // Preserve files if database rollback cannot be confirmed.
        let safeToRemoveFiles = true;

        // Roll back the database record if it was created.
        if (createdFileId) {
            try {
                const rollbackResult = await File.deleteOne({
                    _id: createdFileId,
                    userId,
                });

                if (rollbackResult.deletedCount !== 1) {
                    safeToRemoveFiles = false;

                    console.error(
                        "Upload rollback could not confirm metadata deletion.",
                        {
                            fileId: String(createdFileId),
                            deletedCount: rollbackResult.deletedCount,
                        }
                    );
                }
            } catch (cleanupError) {
                safeToRemoveFiles = false;

                console.error(
                    "Failed to remove file metadata after upload failure.",
                    {
                        fileId: String(createdFileId),
                        message: cleanupError.message,
                    }
                );
            }
        }

        if (safeToRemoveFiles) {
            // Remove only the current file created by this operation.
            if (currentFileWritten) {
                try {
                    await fs.unlink(absolutePath);
                } catch (cleanupError) {
                    console.error(
                        "Failed to clean up uploaded file.",
                        {
                            storedName,
                            message: cleanupError.message,
                        }
                    );
                }
            }

            // Remove only the backup created by this operation.
            if (backupFileWritten) {
                try {
                    await fs.unlink(absoluteBackupPath);
                } catch (cleanupError) {
                    console.error(
                        "Failed to clean up backup file.",
                        {
                            backupStoredName,
                            message: cleanupError.message,
                        }
                    );
                }
            }
        } else {
            console.error(
                "Preserving uploaded files because database rollback was not confirmed.",
                {
                    fileId: String(createdFileId),
                    storedName,
                    backupStoredName,
                }
            );
        }

        // Preserve the original error for the caller.
        throw error;
    }
};

// Find a file owned by authenticated user
const getUserFile = async (fileId, userId) => {

    const file = await File.findOne({
        _id: fileId,
        userId,
    });

    if (!file) {
        throw new AppError(
            "File not found or you do not have permission to access it.",
            404
        );
    }

    return file;
};

export default {
    createFile,
    getUserFile,
};