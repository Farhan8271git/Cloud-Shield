import integrityService from "../services/integrity.service.js";
import { sendSuccess } from "../utils/response.js";

// check integrity of an authenticated user file

const checkIntegrity = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { fileId } = req.params;
        const result = await integrityService.checkFileItegrity(
            fileId, userId
        );

        return sendSuccess( 
            res, 200, "File integrity checked successfully.", result
        );
    } catch(error) {
        next(error);
    }
    
};

export default {
    checkIntegrity,
};