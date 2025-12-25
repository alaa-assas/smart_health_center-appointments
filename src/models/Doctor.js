const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
    // Add your fields here
    },
    {
    timestamps: true,
    }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
