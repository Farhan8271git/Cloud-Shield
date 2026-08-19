import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import RefreshSession from "../models/refreshSession.model.js";
import { generateRefreshToken, hashRefreshToken, } from "../utils/refreshToken.js";

const registerUser = async (userData) => {
  const { fullName, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("Email already exists.", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword,
  });

  // Remove password before returning
  const userResponse = newUser.toObject();
  delete userResponse.password;

  return userResponse;
};

//login user 
const loginUser = async (email, password, sessionInfo = {}) => {
  const user = await User.findOne({ email });

  // Use a generic error so attackers cannot discover registered emails.
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  //for checking account status
  if (user.accountStatus !== "active") {
    throw new AppError("Account is not active.", 403);
  }

  // comparing the login password with stored bycrypt hash
  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  // reject invalid credentials
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }
  // update last sucessfull login time 
  user.lastLogin = new Date();
  await user.save();
  
  // generate short time access token
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  // generte Refresh token
  const refreshToken = generateRefreshToken();

  // hashed refresh token before storing 
  const refreshTokenHash = hashRefreshToken(refreshToken);

  // create refresh session timestamps
  const now = new Date();
  const refreshExpiresAt = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 60 * 1000
  );

  // store refresh session
  await RefreshSession.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    lastUsedAt: now,
    expiresAt: refreshExpiresAt,
    userAgent: sessionInfo.userAgent || null,
    ipAddress: sessionInfo.ipAddress || null,
  });

  // remove password before returning user
  const userResponse = user.toObject();
  delete userResponse.password;
  
   //return authentication data controller
  return {
    user: userResponse,
    token,
    refreshToken,
  };
};

export default {
  registerUser,
  loginUser,
};