import recoveryService from "../services/recovery.service.js";
import { sendSuccess } from "../utils/response.js";

// Recover an authenticated user's file from its trusted backup

const recoverFile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { fileId } =  req.params;
        const result = await recoveryService.recoverFile(fileId, userId);

        return sendSuccess(res, 200, "File recoverd SuccessFully.", result);
    } catch (error) {
        next(error);
    }
};
export default {
    recoverFile,
};