import multer from "multer";

//temprory uploaded file in memory
const storage = multer.memoryStorage();

// MAXIMUM UPLOAD SIZE 10MB
const MAX_FILE_SIZE = 10 * 1024 *1024;

// accept single file from the "file" from field
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    }
});

export default upload;