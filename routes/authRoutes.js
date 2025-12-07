import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import OTP from "../models/Otp.js";
import authorize from "../middleware/roleMiddleware.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Send OTP Route
// Ensure this exists in your routes/authRoutes.js file
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndUpdate(
      { email }, 
      { otp, createdAt: Date.now() }, 
      { upsert: true }
    );

    const mailOptions = {
            from: `"Me" <${process.env.EMAIL}>`,
            to: email,
            subject: "Email Verification",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #e3f2fd, #ffffff); padding: 40px 20px;">
                    <div style="max-width: 520px; margin: auto; background-color: #ffffff; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                    <h1 style="text-align: center; color: #1e88e5; margin-bottom: 20px;">🔐 Verify Your Email</h1>
                    <p style="font-size: 17px; color: #444; line-height: 1.6;">
                        Hello,<br><br>
                        We're excited to have you on board. To complete your registration, please use the following One-Time Password (OTP):
                    </p>

                    <div style="text-align: center; margin: 35px 0;">
                        <span style="display: inline-block; background: linear-gradient(to right, #42a5f5, #1e88e5); color: #fff; font-size: 28px; padding: 12px 28px; border-radius: 10px; font-weight: bold; letter-spacing: 6px;">
                        ${otp}
                        </span>
                    </div>

                    <p style="font-size: 15px; color: #777; text-align: center; margin-top: -10px;">
                        This OTP will expire in 5 minutes.<br>
                        Please do not share it with anyone.
                    </p>

                    <p style="font-size: 16px; color: #444; margin-top: 30px;">
                        If you didn’t request this, please ignore this email or let us know.
                    </p>

                    <p style="font-size: 16px; color: #444; margin-top: 30px;">
                        Cheers,<br>
                        <span style="font-weight: bold; color: #1e88e5;">The Team</span>
                    </p>
                    </div>
                    <div style="text-align: center; margin-top: 25px; font-size: 13px; color: #aaaaaa;">
                    © ${new Date().getFullYear()} Your ONE. All rights reserved.
                    </div>
                </div>
                `

        };

    

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Register with OTP Verification
router.post("/register", async (req, res) => {
  const { name, email, password, otp } = req.body;
  try {
    // Verify OTP
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }
    
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // OTP is valid, double-check user existence
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Create User
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    // Clean up used OTP
    await OTP.deleteOne({ email });

    res.json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Login (Standard)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user info along with token
    res.json({ token, role: user.role, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: create official/analyst
router.post("/create-user", protect, authorize(["admin"]), async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!["official", "analyst"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    res.json({ message: `${role} created`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;