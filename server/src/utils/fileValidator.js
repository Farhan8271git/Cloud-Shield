import { fileTypeFromBuffer } from "file-type";
import AppError from "./AppError.js";

const ALLOWED_FILE_TYPES = new Map([
    ["application/pdf", [".pdf"]],
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]],
    ["text/plain", [".txt"]],
]);

const validateUploadedFile = async (file) => {
    if (!file) {
        throw new AppError("File is required.", 400);
    }

    const detectedType = await fileTypeFromBuffer(file.buffer);

    // Plain text does not have a reliable magic-byte signature.
    if (!detectedType) {
        if (file.mimetype === "text/plain") {
            return {
                mimeType: "text/plain",
                extension: ".txt",
            };
        }

        throw new AppError(
            "Unable to determine the uploaded file type.",
            400
        );
    }

    const allowedExtensions =
        ALLOWED_FILE_TYPES.get(detectedType.mime);

    if (!allowedExtensions) {
        throw new AppError(
            "This file type is not allowed.",
            415
        );
    }

    const detectedExtension = `.${detectedType.ext}`;

    if (!allowedExtensions.includes(detectedExtension)) {
        throw new AppError(
            "File extension does not match its actual content.",
            400
        );
    }

    return {
        mimeType: detectedType.mime,
        extension: detectedExtension,
    };
};

export {
    validateUploadedFile,
};