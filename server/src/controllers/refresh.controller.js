import refreshService from "../services/refresh.service.js";
import { sendSuccess } from "../utils/response.js";

// for refresh token access 
const refresh =  async (req, res, next) => {
    try{
        // get the refresh token from HttpOnly cookkie 
        const refreshToken = req.cookies.refreshToken;

        // validation of the refresh session
        await refreshService.refreshAccessToken(refreshToken);

        // for temprory response 
        return sendSuccess(res, 200, "Refresh token is valid.", null); 
    } catch (error) {
        next(error);
    }
};

export default {
    refresh,
};