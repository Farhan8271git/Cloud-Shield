import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import env from "../config/env.js";

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      throw new AppError("Authentication required.", 401);
    }
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Authentication token expired.", 401);
      }
      if (error.name === "JsonWebTokenError") {
        throw new AppError("Invalid authentication token.", 401);
      }

      throw error;
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new AppError("Authentication required.", 401);
    }

    if (user.accountStatus !== "active") {
      throw new AppError("Account is not active.", 403);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;