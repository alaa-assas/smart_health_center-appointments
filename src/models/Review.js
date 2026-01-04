import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  stars: { type: Number, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);