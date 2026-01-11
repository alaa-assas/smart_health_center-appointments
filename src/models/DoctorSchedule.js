const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    start: String,
    end: String,
  },
  { _id: false }
);

const vacationSchema = new mongoose.Schema(
  {
    from: Date,
    to: Date,
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },
    workDays: [Number],
    slots: [slotSchema],
    vacations: [vacationSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
