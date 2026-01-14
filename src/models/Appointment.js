const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: Date, required: true },
  slot: { start: String, end: String },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
    default: "Pending"
  },
  cancelReason: String,
  reminderSent24h: { type: Boolean, default: false },
  reminderSent1h: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
