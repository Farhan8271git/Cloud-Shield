import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const registerUser = async (userData) => {
  const { fullName, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists.");
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