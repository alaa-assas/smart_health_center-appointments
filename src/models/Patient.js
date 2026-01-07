const mongoose = require("mongoose");

// update the patient models
const patientSchema = new mongoose.Schema({

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ["male", "female", "other"] 
  },
  chronicConditions: {
    type: [String],
    default: []
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);