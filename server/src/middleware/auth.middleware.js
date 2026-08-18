import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import env from "../config/env.js";

//for cookies accesstoken
const authenticate = (req, res, next) => {
    try{
        const token = req.cookies.accessToken;
        if(!token) {
            throw new AppError("Authentication required.", 401);
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded;
        next();
        } catch (error) {
        next(error);
    }
};

export default authenticate;