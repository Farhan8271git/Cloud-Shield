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

// Create a secure file record from an actual uploaded file
const createFile = async (userId, uploadedFile) => {

    if (!userId) {
        throw new AppError("User ID is required.", 400);
    }

    if (!uploadedFile) {
        throw new AppError("Uploaded file is required.", 400);
    }

    // validate uploade file 
    const detectedFile = await validateUploadedFile(
        uploadedFile
    );


    // Generate SHA-256 from the actual file contents
    const hash = crypto
        .createHash("sha256")
        .update(uploadedFile.buffer)
        .digest("hex");

    // Generate a server-controlled filename
    const extension = path.extname(
        uploadedFile.originalname
    );

    const storedName = `${crypto.randomUUID()}${extension}`;
    const backupStoredName = `${crypto.randomUUID()}${extension}`;

    // Server-controlled storage path
    const storagePath = path.join("uploads", storedName);

    const backupStoragePath = path.join("uploads", "backups", backupStoredName);

    const absolutePath = path.join(UPLOAD_DIRECTORY, storedName);

    const absoluteBackupPath = path.join(BACKUP_DIRECTORY, backupStoredName);

    // backup is generated from the same trusted original buffer
    const backupHash = crypto
        .createHash("sha256").update(uploadedFile.buffer).digest("hex");

    // defensive verfication before writing anything 
    if (hash !== backupHash) {
        throw new AppError("Trusted backup verification failed.", 500);
    }

    let currentFileWritten = false;
    let backupFileWritten = false;

    try {

        // Ensure upload directory exists
        await fs.mkdir(
            UPLOAD_DIRECTORY,
            { recursive: true }
        );

        // backup directory 
        await fs.mkdir(
            BACKUP_DIRECTORY,
            { recursive: true }
        );

        // Write current file 
        await fs.writeFile(
            absolutePath,
            uploadedFile.buffer
        );

        currentFileWritten = true;

        //Write trusted backup
        await fs.writeFile(
            absoluteBackupPath, uploadedFile.buffer
        );

        // Save metadata in MongoDB
        const file = await File.create({
            userId,
            originalName: uploadedFile.originalname,
            storedName, storagePath,
            mimeType: detectedFile.mimeType,
            size: uploadedFile.size, hash,
            backupStoredName, backupStoragePath,
            backupHash,
            status: "pending",
            integrityStatus: "intact",
        });

        // recod file creation 

        await fileActivityService.recordFileActivity({
            userId, fileId: file._id,
            activityType: "created",
            currentName: file.originalName,
        });

        return file;
    } catch (error) {

        // If database creation fails after the file
        // was written, remove the files whisch are created
        try {
            await fs.unlink(absolutePath);
        } catch {
            // Ignore cleanup failure.
        }



        if (backupFileWritten) {
            try {
                await fs.unlink(absoluteBackupPath);
            } catch {
                // igonre cleanup
            }
        }

        throw error
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