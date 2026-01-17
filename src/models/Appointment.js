const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        slot: {
            start: { type: String, required: true },
            end: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
            default: "Pending",
        },
        cancelReason: String,
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        notes: String,
        symptoms: [String],
    },
    { timestamps: true }
);

// Compound indexes
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

// Helper method to check time conflict
appointmentSchema.statics.hasTimeConflict = function (slot1, slot2) {
    const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const start1 = toMinutes(slot1.start);
    const end1 = toMinutes(slot1.end);
    const start2 = toMinutes(slot2.start);
    const end2 = toMinutes(slot2.end);

    return start1 < end2 && end1 > start2;
};

// Helper method to check if slot is exactly 30 minutes
appointmentSchema.statics.isValidDuration = function (slot) {
    const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    return toMinutes(slot.end) - toMinutes(slot.start) === 30;
};

module.exports = mongoose.model("Appointment", appointmentSchema);