import Appointment from "../models/Appointment.js";

const logger = require("../utils/logger");

class AppointmentController {
    createAppointment = async (req, res) => {
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
    };


    getMyAppointments = async (req, res) => {
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
    };


    updateAppointmentStatus = async (req, res) => {
        const {status} = req.body;

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
    };


    cancelAppointment = async (req, res) => {
        const {cancelReason} = req.body;

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
    };

}

module.exports = new AppointmentController();
