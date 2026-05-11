import { connectDB } from "../config/db";
import User from "../models/user/User";
import mongoose from "mongoose";
import { env } from "../config/env";

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin user updated successfully");
    } else {
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin"
      });
      console.log("Admin user created successfully");
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedAdmin();
