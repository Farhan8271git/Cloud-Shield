import path from "path";
import AppError from "./AppError.js";

// Resolve a server-controlled filename inside an allowed directory.
const resolveStoragePath = (directory, storedName) => {
    if (
        typeof storedName !== "string" ||
        storedName.length === 0 ||
        storedName !== path.basename(storedName) ||
        storedName.includes("/") ||
        storedName.includes("\\")
    ) {
        throw new AppError(
            "Invalid stored filename.",
            400
        );
    }

    const resolvedDirectory = path.resolve(directory);
    const resolvedPath = path.resolve(
        resolvedDirectory,
        storedName
    );

    // Ensure the resulting path remains inside the allowed directory.
    if (
        path.dirname(resolvedPath) !== resolvedDirectory
    ) {
        throw new AppError(
            "Invalid storage path.",
            400
        );
    }

    return resolvedPath;
};

export default {
    resolveStoragePath,
};