import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import File from "../models/file.model.js";
import AppError from "../utils/AppError.js";
import {
    validateUploadedFile,
} from "../utils/fileValidator.js";

const UPLOAD_DIRECTORY = path.resolve(
    process.cwd(),
    "uploads"
);



// Create a secure file record from an actual uploaded file
const createFile = async (userId, uploadedFile) => {

    if (!uploadedFile) {
        throw new AppError("Uploaded file is required.", 400);
    }


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

    // Server-controlled storage path
    const storagePath = path.join(
        "uploads",
        storedName
    );

    const absolutePath = path.join(
        UPLOAD_DIRECTORY,
        storedName
    );

    try {

        // Ensure upload directory exists
        await fs.mkdir(
            UPLOAD_DIRECTORY,
            { recursive: true }
        );

        // Write the actual file to disk
        await fs.writeFile(
            absolutePath,
            uploadedFile.buffer
        );

        // Save metadata in MongoDB
        const file = await File.create({
            userId,

            originalName: uploadedFile.originalname,

            storedName,

            storagePath,

            mimeType: detectedFile.mimetype,

            size: uploadedFile.size,

            hash,

            status: "pending",
        });

        return file;

    } catch (error) {

        // If database creation fails after the file
        // was written, remove the orphaned file.
        try {
            await fs.unlink(absolutePath);
        } catch {
            // Ignore cleanup failure.
        }

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