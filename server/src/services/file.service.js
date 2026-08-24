import File from "../models/file.model.js";
import AppError from "../utils/AppError.js";

// create file metadata for authenticated user
const createFile = async (userId, fileData) => {

    // extract file metadata
    const {
        originalName,
        storedName,
        storagePath,
        mimeType,
        size,
        hash,
    } = fileData;

    // create file record with authenticated user's ID as owner
    const file = await File.create({
        userId,
        originalName,
        storedName,
        storagePath,
        mimeType,
        size,
        hash,
    });

    return file;
};

// find a file owned by authenticated user
const getUserFile = async (fileId, userId) => {

    // find file by ID and ownership
    const file = await File.findOne({
        _id: fileId,
        userId,
    });

    // reject missing or unauthorized resource
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