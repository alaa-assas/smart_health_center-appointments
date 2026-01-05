const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: String,
  phone: String
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);