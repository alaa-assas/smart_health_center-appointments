import Appointment from "../models/Appointment.js";


export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      date,
      slot
    } = req.body;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      slot,
      status: "PENDING"
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let filter = {};

    if (role === "PATIENT") {
      filter.patientId = userId;
    } else if (role === "DOCTOR") {
      filter.doctorId = userId;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "fullName email")
      .populate("doctorId", "fullName email");

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const cancelAppointment = async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    appointment.status = "CANCELED";
    appointment.cancelReason = cancelReason;
    appointment.canceledBy = req.user._id;

    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
