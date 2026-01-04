import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: String,
  phone: String
}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);