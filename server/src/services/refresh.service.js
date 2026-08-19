import AppError from "../utils/AppError.js";
import RefreshSession from "../models/refreshSession.model.js";
import {generateRefreshToken,hashRefreshToken,} from "../utils/refreshToken.js";

// refresh access token
const refreshAccessToken = async (refreshToken) => {

    // check refresh token
    if (!refreshToken) {
        throw new AppError("Refresh token is required.", 401);
    }

    // hash incoming refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // find refresh session
    const session = await RefreshSession.findOne({tokenHash,});

    // reject unknown refresh token
    if (!session) { throw new AppError("Invalid refresh token.", 401);}

    // reject revoked session
    if (session.revokedAt) { throw new AppError("Refresh session has been revoked.", 401);} 
    return session;
};

export default {
    refreshAccessToken,
};