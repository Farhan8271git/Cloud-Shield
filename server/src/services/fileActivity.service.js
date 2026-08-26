import FileActivity from "../models/fileAcyivity.model.js";
import AppError from "../utils/AppError.js";
import fileExtension from "../utils/fileExtension.js";

const recordFileActivity = async ({
    userId, fileId, activityType, previousName = null, currentName = null, }) => {
    if (!userId || !fileId) {
        throw new AppError("User Id and File Id are required.", 400);
    }

    if (!activityType) {
        throw new AppError(
            "activity type is required.", 400
        );
    }

    const previousExtension = fileExtension.getFileExtension(currentName);

    const currentExtension = fileExtension.getFileExtension(currentName);

    const activity = await FileActivity.create({
        userId, fileId, activityType, previousName, currentName, previousExtension, currentExtension,
    }); 

    return activity;
};

export default {
    recordFileActivity,
};