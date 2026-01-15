const notifyUser = (io, userId, message, payload = {}) => {
  if (!io) return;
  
  io.to(`user_${userId}`).emit("appointment-notification", {
    message,
    ...payload,
    timestamp: new Date(),
  });
};

const notifyBoth = (io, patientId, doctorId, message, payload = {}) => {
  notifyUser(io, patientId, message, { ...payload, recipient: "patient" });
  notifyUser(io, doctorId, message, { ...payload, recipient: "doctor" });
};

module.exports = { notifyUser, notifyBoth };