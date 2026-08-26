import mongoose from "mongoose";

const fileActivitySchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Uaer",
        required: true,
        index: true,
    },

    fileId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        required: true,
        index: true,
    },

    activityType:{
        type: String,
        enum: [
            "created",
            "modified",
            "renamed",
            "deleted",
        ],
        required: true,
        index: true,  
    },

    previousName: {
        type: String,
        default: null,
        trim: true,
    },

    currentName: {
        type: String,
        default: null,
        trim: true,
    },

    previousExtension:{
        type: String,
        default: null,
        trim: true,
    },

    currentExtension:{
        type: String,
        default: null,
        trim: true,
    },
},
{
    timestamps: true,
}
);

const FileActivity = mongoose.model(
    "FileActivity",
    fileActivitySchema
);


export default FileActivity;