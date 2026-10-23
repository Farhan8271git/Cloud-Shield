import mongoose from "mongoose";
import env from "../config/env.js";
const checkSecurityEventDuplicates = async () => {
    await mongoose.connect(env.MONGODB_URI);

    try {
        const collection =
            mongoose.connection.collection("securityevents");

        const duplicates = await collection.aggregate([
            {
                $match: {
                    eventType: "integrity_violation",
                },
            },
            {
                $group: {
                    _id: {
                        userId: "$userId",
                        fileId: "$fileId",
                        eventType: "$eventType",
                        previousHash: "$previousHash",
                        currentHash: "$currentHash",
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
            {
                $match: {
                    count: {
                        $gt: 1,
                    },
                },
            },
            {
                $limit: 10,
            },
        ]).toArray();

        console.log(
            "Duplicate integrity transitions:",
            JSON.stringify(duplicates, null, 2)
        );
    } finally {
        await mongoose.disconnect();
    }
};

checkSecurityEventDuplicates().catch((error) => {
    console.error("Duplicate check failed.");
    console.error(error);
    process.exitCode = 1;
});