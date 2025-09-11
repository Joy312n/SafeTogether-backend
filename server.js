import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import cloudinary from "./config/cloudinary.js";
// console.log("Cloudinary Config:", {
//   name: process.env.CLOUD_NAME,
//   key: process.env.CLOUD_KEY ,
//   secret: process.env.CLOUD_SECRET 
// });
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);
app.get("/test-cloudinary", (req, res) => {
  res.json(cloudinary.config(), {message: true});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
