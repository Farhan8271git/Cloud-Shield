import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

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

export default {
  registerUser,
};