import fileService from "../services/file.service.js";
import { sendSuccess } from "../utils/response.js";


// create file metadata
const createFile = async (req, res, next) => {
    try {
        // get authenticated user's ID
        const userId = req.user._id;

        // pass file metadata from request body to service
        const file = await fileService.createFile(
            userId,
            req.body
        );

        // return created file
        return sendSuccess(
            res,
            201,
            "File metadata created successfully.",
            file
        );
    } catch (error) {
        next(error);
    }
};

//get file owned by authenticated user
const getFile = async (req, res, next) => {
    try{
        // get authenticated user 
        const userId = req.user._id;

        // get file ID  from URL parameter
        const { fileID } = req.params;

        // service enforces ownership
        const file = await fileService.getUserFile(
         fileID, userId   
        );

        // return file metadata
        return sendSuccess( res, 200, " file retrived successfully.", file
        );
    } catch (error) {
        next(error);
    }
};

export default {
    createFile, getFile
};