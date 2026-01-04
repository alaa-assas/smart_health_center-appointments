import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  start: String,
  end: String
}, { _id: false });

const vacationSchema = new mongoose.Schema({
  from: Date,
  to: Date
}, { _id: false });

const doctorScheduleSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", unique: true },
  workDays: [Number],
  slots: [slotSchema],
  vacations: [vacationSchema]
}, { timestamps: true });

export default mongoose.model("DoctorSchedule", doctorScheduleSchema);