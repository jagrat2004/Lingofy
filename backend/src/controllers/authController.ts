import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user/User";
import UserPreferences from "../models/user/UserPreference";

const generateToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    const userName = name || email.split("@")[0];
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name: userName,
      email,
      password,
      role: "user"
    });

    if (user) {
      const token = generateToken(user._id.toString(), user.email);
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPreferences: false,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    let user;
    if (trimmedEmail.includes("@")) {
      user = await User.findOne({ email: trimmedEmail });
    } else {
      user = await User.findOne({ name: trimmedEmail });
      if (!user) user = await User.findOne({ email: trimmedEmail });
    }

    if (user && (await user.comparePassword(trimmedPassword))) {
      const token = generateToken(user._id.toString(), user.email);
      
      // Check if preferences exist
      const preferences = await UserPreferences.findOne({ userId: user._id });

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasPreferences: !!preferences,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
