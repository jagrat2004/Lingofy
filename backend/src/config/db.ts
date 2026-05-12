import mongoose from "mongoose";
import { env } from "./env";
import User from "../models/user/User";

const autoSeedAdmin = async () => {
  try {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) return;

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin"
      });
      console.log("Auto-seeded Admin User ✨");
    }
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
};

export const connectDB = async () => {
  try {
    const uri = env.MONGO_URI || "mongodb://127.0.0.1:27017/lingofy";
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
    await autoSeedAdmin();
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};