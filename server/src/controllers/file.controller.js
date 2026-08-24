import fileService from "../services/file.service.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";

// create file metadata
const createFile = async (req, res, next) => {
    try {
        // Multer places the uploaded file in req.file
        if (!req.file) {
            throw new AppError("File is required.", 400);
        }

        // Authentication middleware provides the authenticated user
        const userId = req.user._id;

        // Pass the actual uploaded file to the service
        const file = await fileService.createFile(
            userId,
            req.file
        );

        return sendSuccess(
            res,
            201,
            "File uploaded successfully.",
            file
        );
    } catch (error) {
        next(error);
    }
};


//get file owned by authenticated user
const getFile = async (req, res, next) => {
    try {
        // get authenticated user 
        const userId = req.user._id;

        // get file ID  from URL parameter
        const { fileID } = req.params;

        // service enforces ownership
        const file = await fileService.getUserFile(
            fileID, userId
        );

        // return file metadata
        return sendSuccess(res, 200, " file retrived successfully.", file
        );
    } catch (error) {
        next(error);
    }
};

export default {
    createFile, getFile
};