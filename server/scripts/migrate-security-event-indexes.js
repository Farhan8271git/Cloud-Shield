import mongoose from "mongoose";
import env from "../src/config/env.js";

const COLLECTION_NAME = "securityevents";

const LEGACY_INDEX = "unique_security_event_transition";
const TRANSITION_INDEX =
    "unique_security_event_transition_integrity";
const EPISODE_INDEX = "unique_security_event_episode";

const TRANSITION_KEYS = {
    userId: 1,
    fileId: 1,
    eventType: 1,
    previousHash: 1,
    currentHash: 1,
};

const EPISODE_KEYS = {
    userId: 1,
    fileId: 1,
    eventType: 1,
    detectionType: 1,
    episodeId: 1,
};

const TRANSITION_FILTER = {
    eventType: "integrity_violation",
};

const EPISODE_FILTER = {
    episodeId: { $type: "string" },
};

const sameDefinition = (actual, expected) =>
    JSON.stringify(actual) === JSON.stringify(expected);

const hasExpectedIndex = (index, keys, filter) =>
    Boolean(
        index &&
        index.unique === true &&
        sameDefinition(index.key, keys) &&
        sameDefinition(index.partialFilterExpression, filter)
    );

const findDuplicates = async (
    collection,
    match,
    fields,
) => {
    const groupId = Object.fromEntries(
        fields.map((field) => [field, `$${field}`]),
    );

    return collection.aggregate([
        { $match: match },
        {
            $group: {
                _id: groupId,
                count: { $sum: 1 },
            },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 10 },
    ]).toArray();
};

const ensureNoDuplicates = async (collection) => {
    const integrityDuplicates = await findDuplicates(
        collection,
        TRANSITION_FILTER,
        [
            "userId",
            "fileId",
            "eventType",
            "previousHash",
            "currentHash",
        ],
    );

    if (integrityDuplicates.length) {
        throw new Error(
            `Duplicate integrity transitions found: ${JSON.stringify(integrityDuplicates)}`,
        );
    }

    const episodeDuplicates = await findDuplicates(
        collection,
        EPISODE_FILTER,
        [
            "userId",
            "fileId",
            "eventType",
            "detectionType",
            "episodeId",
        ],
    );

    if (episodeDuplicates.length) {
        throw new Error(
            `Duplicate detection episodes found: ${JSON.stringify(episodeDuplicates)}`,
        );
    }
};

const ensureEpisodeIndex = async (collection) => {
    const indexes = await collection.indexes();
    const existing = indexes.find(
        (index) => index.name === EPISODE_INDEX,
    );

    if (existing) {
        if (
            !hasExpectedIndex(
                existing,
                EPISODE_KEYS,
                EPISODE_FILTER,
            )
        ) {
            throw new Error(
                `Index "${EPISODE_INDEX}" has an unexpected definition.`,
            );
        }

        console.log("Detection episode index already verified.");
        return;
    }

    await collection.createIndex(EPISODE_KEYS, {
        unique: true,
        name: EPISODE_INDEX,
        partialFilterExpression: EPISODE_FILTER,
    });

    console.log("Detection episode index created.");
};

const migrateTransitionIndex = async (collection) => {
    let indexes = await collection.indexes();

    const legacy = indexes.find(
        (index) => index.name === LEGACY_INDEX,
    );

    const target = indexes.find(
        (index) => index.name === TRANSITION_INDEX,
    );

    if (target) {
        if (
            !hasExpectedIndex(
                target,
                TRANSITION_KEYS,
                TRANSITION_FILTER,
            )
        ) {
            throw new Error(
                `Index "${TRANSITION_INDEX}" has an unexpected definition.`,
            );
        }

        if (legacy) {
            throw new Error(
                "Both legacy and target transition indexes exist. Manual review required.",
            );
        }

        console.log("Integrity transition index already verified.");
        return;
    }

    if (!legacy) {
        console.log(
            "No legacy transition index exists. Creating the target index for a fresh database.",
        );

        await collection.createIndex(TRANSITION_KEYS, {
            unique: true,
            name: TRANSITION_INDEX,
            partialFilterExpression: TRANSITION_FILTER,
        });

        console.log("Integrity transition index created.");
        return;
    }

    const validLegacy =
        legacy.unique === true &&
        sameDefinition(legacy.key, TRANSITION_KEYS) &&
        !legacy.partialFilterExpression;

    if (!validLegacy) {
        throw new Error(
            "Legacy transition index has an unexpected definition. Migration stopped.",
        );
    }

    console.log(
        "Legacy index confirmed. Preparing transition index replacement.",
    );

    // Check the exact index state again immediately before the change.
    indexes = await collection.indexes();

    const currentLegacy = indexes.find(
        (index) => index.name === LEGACY_INDEX,
    );

    const currentTarget = indexes.find(
        (index) => index.name === TRANSITION_INDEX,
    );

    if (currentTarget || !currentLegacy) {
        throw new Error(
            "Index state changed during preflight. Migration stopped.",
        );
    }

    /*
     * MongoDB versions may reject parallel indexes with the same key
     * pattern and different partial filters. Replacing the legacy index
     * is therefore a separate, controlled operation.
     *
     * Run this script only while application writes to securityevents
     * are paused. The drop/create sequence is not transactional.
     */
    await collection.dropIndex(LEGACY_INDEX);
    console.log("Legacy transition index removed.");

    try {
        await collection.createIndex(TRANSITION_KEYS, {
            unique: true,
            name: TRANSITION_INDEX,
            partialFilterExpression: TRANSITION_FILTER,
        });

        console.log("Integrity transition index created.");
    } catch (error) {
        console.error(
            "Failed to create the new transition index.",
        );
        console.error(
            "Attempting to restore the legacy uniqueness constraint.",
        );

        try {
            await collection.createIndex(TRANSITION_KEYS, {
                unique: true,
                name: LEGACY_INDEX,
            });

            console.error(
                "Legacy index restored. Review the original error before retrying.",
            );
        } catch (restoreError) {
            console.error(
                "CRITICAL: Legacy index restoration failed. Keep application writes paused and inspect database indexes immediately.",
            );
            console.error(restoreError);
        }

        throw error;
    }
};

const migrateSecurityEventIndexes = async () => {
    await mongoose.connect(env.MONGODB_URI);

    try {
        const collection =
            mongoose.connection.collection(COLLECTION_NAME);

        console.log("Checking existing security-event indexes...");

        console.log(
            JSON.stringify(await collection.indexes(), null, 2),
        );

        await ensureNoDuplicates(collection);

        console.log("Duplicate checks passed.");

        await ensureEpisodeIndex(collection);

        await migrateTransitionIndex(collection);

        const finalIndexes = await collection.indexes();

        const finalTransition = finalIndexes.find(
            (index) => index.name === TRANSITION_INDEX,
        );

        const finalEpisode = finalIndexes.find(
            (index) => index.name === EPISODE_INDEX,
        );

        if (
            !hasExpectedIndex(
                finalTransition,
                TRANSITION_KEYS,
                TRANSITION_FILTER,
            )
        ) {
            throw new Error(
                "Final integrity transition index verification failed.",
            );
        }

        if (
            !hasExpectedIndex(
                finalEpisode,
                EPISODE_KEYS,
                EPISODE_FILTER,
            )
        ) {
            throw new Error(
                "Final detection episode index verification failed.",
            );
        }

        console.log("Security-event indexes verified successfully.");

        console.log(
            JSON.stringify(finalIndexes, null, 2),
        );
    } finally {
        await mongoose.disconnect();
    }
};

migrateSecurityEventIndexes().catch((error) => {
    console.error("Security-event index migration failed.");
    console.error(error);
    process.exitCode = 1;
});