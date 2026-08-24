import { hash } from "bcryptjs";
import mongoose from "mongoose";
import { maxLength, string } from "zod";
const fileSchema = new mongoose.Schema({
    // identify the user who owns the file 
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    // preserve the original filename for user display
    originalName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 255,
    },

    // store the file using a controlled internal name 
    storedName: {
        type: String,
        required: true,
        unique: true,
    },

    // identify where the file is physically stored
    storagePath: {
        type: String,
        required: true,
    },

    //file MIME type
    mimeType: {
        type: String,
        required: true,
    },
    

    // store  file size in bytes
    size: {
        type: Number,
        required: true,
        min: 0,
    },

    //store cryptographic file fingerprint
    hash: {
        type: string,
        required: true,
        index:true,
    },

    // track the security state of the file 
    status: {
        type: string,
        enum: ["pending", "safe", "suspicious", "infected", "quarantined",],
        default: "pending",
        required: true,
        index: true,
    },
},
    {
        timestamps: true,
    }
);

const File = mongoose.model("File", fileSchema);

export default File;