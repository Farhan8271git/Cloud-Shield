import authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

const register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.body);
        return sendSuccess(res, 201, "User registerd successfully", user);
    } catch (error) {
        next(error);
    }
};

export default {
    register,
};
