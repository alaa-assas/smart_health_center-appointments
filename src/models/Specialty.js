const mongoose = require("mongoose");

const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Specialty name is required"],
    unique: [true, "Specialty name already exists"],
    trim: true,
    minlength: [2, "Specialty name is too short"],
    maxlength: [100, "Specialty name is too long"],
    validate: {
      validator: function(v) {
        return /\S/.test(v.trim()); // Ensures the value is not just whitespace
      },
      message: "Specialty name cannot be empty or whitespace only"
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description is too long (maximum 500 characters)"]
  }
}, { timestamps: true });

// Improve query performance and enforce uniqueness
specialtySchema.index({ name: 1 });

module.exports = mongoose.model("Specialty", specialtySchema);