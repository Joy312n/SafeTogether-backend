import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();
await connectDB();

const seedAdmin = async () => {
  const hashed = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: hashed,
    role: "admin"
  });
  console.log("✅ Admin seeded: admin@example.com / admin123");
  process.exit();
};

seedAdmin();