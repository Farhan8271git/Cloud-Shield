import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

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
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  // Use a generic error so attackers cannot discover registered emails.
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.accountStatus !== "active") {
    throw new AppError("Account is not active.", 403);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  user.lastLogin = new Date();
  await user.save();

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

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token,
  };
};

export default {
  registerUser,
  loginUser,
};