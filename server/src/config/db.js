import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
    try{
        await mongoose.connect(env.MONGODB_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed.");
        console.error(error.message);

        process.exit(1);
    }
    
};

export default connectDB;