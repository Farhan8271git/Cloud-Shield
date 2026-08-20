import refreshService from "../services/refresh.service.js";
import { sendSuccess } from "../utils/response.js";

// for refresh token access 
// refresh access token
const refresh = async (req, res, next) => {
    try {
        // get refresh token from HttpOnly cookie
        const refreshToken = req.cookies.refreshToken;

        // validate and rotate refresh session
        const {
            accessToken,
            refreshToken: newRefreshToken,
        } = await refreshService.refreshAccessToken(refreshToken);

        // store new access token in HttpOnly cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        // store new refresh token in HttpOnly cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 4 * 60 * 60 * 1000,
        });

        // return success without exposing authentication tokens
        return sendSuccess(
            res,
            200,
            "Token refreshed successfully.",
            null
        );

    } catch (error) {
        next(error);
    }
};

export default {
    refresh,
};