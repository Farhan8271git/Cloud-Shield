import mongoose from "mongoose";
import env from "../src/config/env.js";

const checkSecurityEventFields = async () => {
    await mongoose.connect(env.MONGODB_URI);

    try {
        const collection =
            mongoose.connection.collection("securityevents");

        const [total, detectionFieldsPresent, episodeFieldsPresent, eventTypes] =
            await Promise.all([
                collection.countDocuments(),

                collection.countDocuments({
                    detectionType: { $exists: true },
                }),

                collection.countDocuments({
                    episodeId: { $exists: true },
                }),

                collection.distinct("eventType"),
            ]);

        console.log(
            JSON.stringify(
                {
                    total,
                    detectionFieldsPresent,
                    episodeFieldsPresent,
                    eventTypes,
                },
                null,
                2
            )
        );
    } finally {
        await mongoose.disconnect();
    }
};

checkSecurityEventFields().catch((error) => {
    console.error("Security event field check failed.");
    console.error(error);
    process.exitCode = 1;
});