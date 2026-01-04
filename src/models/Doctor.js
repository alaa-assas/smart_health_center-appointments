import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: String,
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: "Specialty" },
  location: String,
  bio: String,
  avgRating: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);