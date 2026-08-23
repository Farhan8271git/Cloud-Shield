import AppError from "../utils/AppError.js";
import RefreshSession from "../models/refreshSession.model.js";
import { generateRefreshToken, hashRefreshToken, } from "../utils/refreshToken.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/user.model.js";

// refresh access token
const refreshAccessToken = async (refreshToken) => {

    // check refresh token
    if (!refreshToken) {
        throw new AppError("Refresh token is required.", 401);
    }

    // hash incoming refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // find refresh session
    const session = await RefreshSession.findOne({ tokenHash, });

    // reject unknown refresh token
    if (!session) { throw new AppError("Invalid refresh token.", 401); }



    // detect reuse of a revoked refresh token
    if (session.revokedAt) {

        // revoke all active sessions in the same token family
        await RefreshSession.updateMany(
            {
                familyId: session.familyId,
                revokedAt: null,
            },
            {
                $set: {
                    revokedAt: new Date(),
                },
            }
        );

        throw new AppError(
            "Refresh token reuse detected. Please log in again.",
            401
        );
    }


    // check absolute sesion expiration \
    if (session.expiresAt <= new Date()) {
        session.revokedAt = new Date();
        await session.save();

        throw new AppError("Refresh session has expired.", 401);
    }

    // for inactive time session tineout
    const idleTimeout = 4 * 60 * 60 * 1000;
    const lastActivity = session.lastUsedAt.getTime();
    const currentTime = Date.now();

    if (currentTime - lastActivity > idleTimeout) {
        session.revokedAt = new Date();
        await session.save();
        throw new AppError("Refresh session has expired due to inactivity.", 401);
    }

    //find  the user linked to refresh session
    const user = await User.findById(session.userId);

    //reject session if user no longer exists
    if (!user) {
        session.revokedAt = new Date();
        await session.save();
        throw new AppError("User account no longer exists.", 401);
    }

    // reject inactive account
    if (user.accountStatus !== "active") {
        session.revokedAt = new Date();
        throw new AppError("Account is not active.", 403);
    }

    //generate new access token
    const accessToken = jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
        },
        env.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );

    //generate new refresh token
    const newRefreshToken = generateRefreshToken();

    //hash new refresh token
    const newTokenHash = hashRefreshToken(newRefreshToken);

    // creaate refresh session tine stamp 
    const now = new Date();

    // revoke old refresh session
    session.revokedAt = now;
    await session.save();

    // create new refresh token
    const newSession = await RefreshSession.create({
        userId: user._id,
        familyId: session.familyId,
        tokenHash: newTokenHash,
        lastUsedAt: now,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
    });

    return {
        accessToken,
        refreshToken: newRefreshToken,
        session: newSession,
    }
};

// revoke refrsh session during logout
const revokeRefreshToken = async (refreshToken) => {
    //check refresh token
    if (!refreshToken) {
        return;
    }

    // hash icoming refrsh
    const tokenHash = hashRefreshToken(refreshToken);
    //find refresh token
    const session = await RefreshSession.findOne({
        tokenHash,
    });

    // ignore the unknown or revoked refresh tokens
    if(!session || session.revokedAt) {
        return;
    }

    // revoke refresh session
    session.revokedAt = new Date();
    await session.save();
};


export default {
    refreshAccessToken, revokeRefreshToken,
};