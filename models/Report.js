import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  location: { type: String },
  description: { type: String, required: true },
  imageUrl: { type: String },
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  latitude: { type: Number },   // new
  longitude: { type: Number },  // new
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Report", reportSchema);
