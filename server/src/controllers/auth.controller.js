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
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);

        // store cookies 
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 *60 * 1000,   // session out time is 15 minutes 
        });

        return sendSuccess(res, 200, " Loginsuccessfull",{ user, token, });
      } catch (error) {
        next(error)
    }
};

const me = async (req, res, next) => {
    try {
        return sendSuccess(res, 200,"Authenticated user.",req.user);
    } catch (error) {
        next(error);
    }   
};

export default {
    register,
    login,
    me,
};
