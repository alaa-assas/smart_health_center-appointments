/**
 * @desc    Send a real-time notification to a single user
 *
 * Emits a Socket.IO event to a room associated with the user ID.
 *
 * @param {Object} io - Initialized Socket.IO server instance
 * @param {String|ObjectId} userId - Target user ID
 * @param {String} message - Notification message to send
 * @param {Object} [payload={}] - Optional additional data to include
 *
 * @example
 * notifyUser(io, "64a3f2...", "Your appointment starts in 1 hour", { appointmentId: "1234" });
 */
const notifyUser = (io, userId, message, payload = {}) => {
  if (!io) return;
  
  io.to(`user_${userId}`).emit("appointment-notification", {
    message,
    ...payload,
    timestamp: new Date(),
  });
};

/**
 * @desc    Send a real-time notification to both patient and doctor
 *
 * Wraps `notifyUser` for convenience when sending the same message
 * to both sides of an appointment.
 *
 * @param {Object} io - Initialized Socket.IO server instance
 * @param {String|ObjectId} patientId - Patient's user ID
 * @param {String|ObjectId} doctorId - Doctor's user ID
 * @param {String} message - Notification message to send
 * @param {Object} [payload={}] - Optional additional data to include
 *
 * @example
 * notifyBoth(io, "patientId", "doctorId", "Your appointment starts in 1 hour", { appointmentId: "1234" });
 */
const notifyBoth = (io, patientId, doctorId, message, payload = {}) => {
  notifyUser(io, patientId, message, { ...payload, recipient: "patient" });
  notifyUser(io, doctorId, message, { ...payload, recipient: "doctor" });
};

module.exports = { notifyUser, notifyBoth };