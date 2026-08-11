import authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

// register user 
const register = async (req, res, next) => {
    try {
        const user = await authService.registerUser(req.body);
        return sendSuccess(res, 201, "User registerd successfully", user);
    } catch (error) {
        next(error);
    }
};

//login user 
const login = async (req, res, next) => {
    try{
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);

        return sendSuccess(res, 200, " Login successfull", { user, token,} 
        );
    } catch (error) { next(error) 
    }
};

export default {
    register,
    login,
};
