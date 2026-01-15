const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const { notifyUser } = require("../utils/notificationHelper");

let ioInstance;

/**
 * Sends a real-time reminder notification to both patient and doctor.
 * Fetches user names from linked User documents via population.
 */
const sendReminder = async (appointment, timeLabel) => {
  try {
    console.log(`hi ${new Date().getTime()}` )
    // Fetch patient and doctor records in parallel for efficiency
    const [patientRecord, doctorRecord] = await Promise.all([
      Patient.findById(appointment.patientId).populate('userId', 'fullName'),
      Doctor.findById(appointment.doctorId).populate('userId', 'fullName')
    ]);

    // Skip if either user profile is missing or not linked properly
    if (!patientRecord?.userId || !doctorRecord?.userId) {
      console.warn("Cannot send reminder: incomplete user data", appointment._id);
      return;
    }

    // Fallback to generic names if fullName is missing
    const patientName = patientRecord.userId.fullName || "Patient";
    const doctorName = doctorRecord.userId.fullName || "Doctor";

    // Craft personalized messages for each recipient
    const patientMsg = `Reminder: Your appointment with Dr. ${doctorName} is in ${timeLabel}`;
    const doctorMsg = `Reminder: Your appointment with patient ${patientName} is in ${timeLabel}`;

    // Emit real-time notifications to both users via WebSocket
    notifyUser(ioInstance, patientRecord.userId._id, patientMsg, {
      type: "reminder",
      appointmentId: appointment._id,
      timeLabel,
    });

    notifyUser(ioInstance, doctorRecord.userId._id, doctorMsg, {
      type: "reminder",
      appointmentId: appointment._id,
      timeLabel,
    });
  } catch (err) {
    console.error("Failed to send reminder:", err.message);
  }
};

/**
 * Starts the background cron job that checks for upcoming appointments
 * and triggers reminders at the right time (1 hour and 24 hours before).
 */
const startReminders = (io) => {
  ioInstance = io;

  // Run every minute to catch appointments falling into the reminder window
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    // === 1-hour reminder logic ===
    // Look for appointments starting between 55 and 65 minutes from now
    // (5-minute buffer to handle cron execution timing)
    const min1h = new Date(now.getTime() + 55 * 60 * 1000);
    const max1h = new Date(now.getTime() + 65 * 60 * 1000);
    
    const appointments1h = await Appointment.find({
      date: { $gte: min1h, $lte: max1h },
      status: "Confirmed",
      reminderSent1h: false,
    }, null, { lean: true }); // Use lean for better performance

    // Send reminder and mark as sent to avoid duplicates
    for (const appt of appointments1h) {
      await sendReminder(appt, "1 hour");
      await Appointment.findByIdAndUpdate(appt._id, { reminderSent1h: true });
    }

    // === 24-hour reminder logic ===
    // Look for appointments starting between 23 and 25 hours from now
    const min24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const max24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    const appointments24h = await Appointment.find({
      date: { $gte: min24h, $lte: max24h },
      status: "Confirmed",
      reminderSent24h: false,
    }, null, { lean: true });

    for (const appt of appointments24h) {
      await sendReminder(appt, "24 hours");
      await Appointment.findByIdAndUpdate(appt._id, { reminderSent24h: true });
    }
  });
};

module.exports = { startReminders };