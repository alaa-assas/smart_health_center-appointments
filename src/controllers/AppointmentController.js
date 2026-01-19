const collection = require("../utils/collection");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorSchedule = require("../models/DoctorSchedule");
const Patient = require("../models/Patient");
const AppointmentUtils = require("../utils/appointmentUtils");
const { notifyUser } = require("../utils/notificationHelper");

class AppointmentController {

    /**
     * Create a new appointment
     *
     * @route   POST /appointments
     * @access  Admin | Patient
     *
     * @param {Object} req - Express request object
     * @param {Object} req.body
     * @param {String} req.body.doctorId - Doctor ID
     * @param {String} req.body.date - Appointment date (YYYY-MM-DD)
     * @param {Object} req.body.slot - Time slot { start, end }
     * @param {String} [req.body.patientId] - Required if admin
     *
     * @returns {Object} Created appointment data
     */
    async create(req, res, next) {
        const {doctorId, date, slot} = req.body;
        const userId = req.user.id;

        // Determine patient ID based on user role
        let patientId;
        if (req.user.role === "admin") {
            patientId = req.body.patientId;
            if (!patientId) {
                const error = new Error("You should add pateintId to Admin");
                error.statusCode = 400;
                return next(error);
            }
        } else {
            // Patient creates appointment for himself
            const patient = await Patient.findOne({userId});
            if (!patient) {
                const error = new Error(" pateint file not found");
                error.statusCode = 404;
                return next(error);
            }
            patientId = patient._id;
        }

        // Check doctor existence and status
        const doctor = await Doctor.findOne({_id: doctorId, isActive: true});
        if (!doctor) {
            const error = new Error("Doctor not found or is not active ");
            error.statusCode = 404;
            return next(error);
        }

        //check the appointment time should be 30 minutes
        if (!Appointment.isValidDuration(slot)) {
            const error = new Error("appointment time should be 30 minutes ");
            error.statusCode = 400;
            return next(error);
        }

        // Get doctor's schedule
        const schedule = await DoctorSchedule.findOne({
            doctorId,
            isActive: true,
        });
        if (!schedule) {
            const error = new Error("Doctor doesnt have schedule");
            error.statusCode = 400;
            return next(error);
        }

        // Check if appointment date is within doctor's working days
        const appointmentDate = new Date(date);
        const dayOfWeek = appointmentDate.getDay();
        if (!schedule.workDays.includes(dayOfWeek)) {
            const error = new Error("Doctor not work in this day");
            error.statusCode = 400;
            return next(error);
        }

        // Check if slot is within doctor's working hours
        const isWithinHours = schedule.slots.some((s) => {
            return slot.start >= s.start && slot.end <= s.end;
        });

        if (!isWithinHours) {
            const error = new Error("Doctor not work in this time of day");
            error.statusCode = 400;
            return next(error);
        }

        // Prevent conflict with doctor's appointments
        const doctorAppointments = await Appointment.find({
            doctorId,
            date: {
                $gte: AppointmentUtils.startOfDay(date),
                $lte: AppointmentUtils.endOfDay(date),
            },
            status: {$in: ["Pending", "Confirmed"]},
        });

        for (const apt of doctorAppointments) {
            if (AppointmentUtils.isTimeConflict(slot, apt.slot)) {
                const error = new Error(
                    "this time conflict with other Appointment in doctor schedule"
                );
                error.statusCode = 409;
                return next(error);
            }
        }

        // Prevent conflict with patient's appointments
        const patientAppointments = await Appointment.find({
            patientId,
            date: {
                $gte: AppointmentUtils.startOfDay(date),
                $lte: AppointmentUtils.endOfDay(date),
            },
            status: {$in: ["Pending", "Confirmed"]},
        });

        for (const apt of patientAppointments) {
            if (AppointmentUtils.isTimeConflict(slot, apt.slot)) {
                const error = new Error("You have another appointments in this time");
                error.statusCode = 409;
                return next(error);
            }
        }

        // Appointment must be in the future
        if (!AppointmentUtils.isFutureAppointment(appointmentDate, slot.start)) {
            const error = new Error(
                "appointments should be in feauter not in past"
            );
            error.statusCode = 400;
            return next(error);
        }

        // Create appointment
        const appointment = new Appointment({
            patientId,
            doctorId,
            date: appointmentDate,
            slot,
            status: "Pending",
            notes: req.body.notes,
            symptoms: req.body.symptoms,
        });

        await appointment.save();
        
        // Populate full appointment data
        const fullAppointment = await Appointment.findById(appointment._id)
            .populate({
                path: "patientId",
                populate: {path: "userId", select: "fullName email phone"},
            })
            .populate({
                path: "doctorId",
                populate: [
                    {path: "userId", select: "fullName email"},
                    {path: "specialtyId", select: "name"},
                ],
            });

       const io = req.app.get("io");

        if (io) {
            const patientName = fullAppointment.patientId?.userId?.fullName || 'Patient';
            const doctorName = fullAppointment.doctorId?.userId?.fullName || 'Doctor';
            const timeLabel = `${slot.start} - ${slot.end}`;
            const appointmentDate = new Date(date).toLocaleDateString();

            const doctorUserId = fullAppointment.doctorId?.userId?._id;
            const patientUserId = fullAppointment.patientId?.userId?._id;

            if (doctorUserId) {
                notifyUser(io, doctorUserId, 
                `You have a new appointment with patient ${patientName} at ${timeLabel}`,
                {
                    type: "appointment_created",
                    appointmentId: appointment._id,
                    timeLabel,
                    for: "doctor"
                }
                );
            }

            if (req.user.role !== "admin" && patientUserId) {
                notifyUser(io, patientUserId,
                `Your appointment with Dr. ${doctorName} is scheduled for ${appointmentDate} at ${timeLabel}`,
                {
                    type: "appointment_created",
                    appointmentId: appointment._id,
                    timeLabel,
                    for: "patient"
                }
                );
            }
        }
        
        return res
            .status(201)
            .json(
                collection(
                    true,
                    "Appointment created succesfully",
                    fullAppointment,
                    "CREATED"
                )
            );
    }

    /**
     * Update appointment status (Confirm / Cancel)
     *
     * @route   PATCH /appointments/:id/status
     * @access  Admin | Doctor
     */

    async updateStatus(req, res, next) {
        const { id } = req.params;
        const { status, cancelReason } = req.body;
        const userId = req.user.id;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            const error = new Error("Appointment not found");
            error.statusCode = 404;
            return next(error);
        }

        // Doctor can only update his own appointments
        if (req.user.role === "doctor") {
            const doctor = await Doctor.findOne({ userId });
            if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
            const error = new Error("You are not allowed to update this Appointment");
            error.statusCode = 403;
            return next(error);
            }
        }

        // Handle cancellation
        if (status === "Cancelled") {
            if (!cancelReason) {
            const error = new Error("Cancellation reason is required");
            error.statusCode = 400;
            return next(error);
            }
            appointment.cancelReason = cancelReason;
            appointment.cancelledBy = userId;
        }

        appointment.status = status;
        await appointment.save();

        const io = req.app.get("io");
        if (io && (status === "Confirmed" || status === "Cancelled")) {
            const populatedAppointment = await Appointment.findById(appointment._id)
            .populate({
                path: "patientId",
                populate: { path: "userId", select: "fullName" },
            })
            .populate({
                path: "doctorId",
                populate: { path: "userId", select: "fullName" },
            });

            const patientUserId = populatedAppointment?.patientId?.userId?._id;
            const doctorUserId = populatedAppointment?.doctorId?.userId?._id;
            const patientName = populatedAppointment?.patientId?.userId?.fullName || "Patient";
            const doctorName = populatedAppointment?.doctorId?.userId?.fullName || "Doctor";

            let messageForPatient = "";
            let messageForDoctor = "";

            if (status === "Confirmed") {
                messageForPatient = `Your appointment with Dr. ${doctorName} on ${new Date(appointment.date).toLocaleDateString()} has been confirmed.`;
                messageForDoctor = `You confirmed your appointment with patient ${patientName}.`;
            } else if (status === "Cancelled") {
                const reason = cancelReason || "No reason provided";
                messageForPatient = `Your appointment with Dr. ${doctorName} was cancelled. Reason: ${reason}`;
                messageForDoctor = `You cancelled your appointment with patient ${patientName}. Reason: ${reason}`;
            }

            if (doctorUserId) {
                notifyUser(io, doctorUserId, messageForDoctor, {
                    type: "appointment_status_update",
                    appointmentId: appointment._id,
                    status: status,
                    for: "doctor",
                });
            }

            if (patientUserId) {
                notifyUser(io, patientUserId, messageForPatient, {
                    type: "appointment_status_update",
                    appointmentId: appointment._id,
                    status: status,
                    for: "patient",
                });
            }
        }

        return res.status(200).json(
            collection(
                true,
                "The status updated successfully",
                appointment,
                "UPDATED"
            )
        );
    }

    /**
     * Update appointment date or slot
     *
     * @route   PUT /appointments/:id
     * @access  Patient
     */
    async update(req, res, next) {
        const {id} = req.params;
        const {date, slot} = req.body;
        const userId = req.user.id;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            const error = new Error("Appointment not found");
            error.statusCode = 404;
            return next(error);
        }

        // Ensure appointment belongs to patient
        const patient = await Patient.findOne({userId});
        if (
            !patient ||
            patient._id.toString() !== appointment.patientId.toString()
        ) {
            const error = new Error(
                "You are not allwed to update this Appointment"
            );
            error.statusCode = 403;
            return next(error);
        }

        // Only pending appointments can be updated
        if (appointment.status !== "Pending") {
            const error = new Error("You can just update the pending Appointment");
            error.statusCode = 400;
            return next(error);
        }

        // Validate slot duration
        if (slot && !Appointment.isValidDuration(slot)) {
            const error = new Error("The Appointment time should be 30 minuts");
            error.statusCode = 400;
            return next(error);
        }

        const newDate = date || appointment.date;
        const newSlot = slot || appointment.slot;

        if (date) appointment.date = new Date(date);
        if (slot) appointment.slot = slot;
        if (req.body.notes !== undefined) appointment.notes = req.body.notes;
        if (req.body.symptoms !== undefined)
            appointment.symptoms = req.body.symptoms;

        await appointment.save();

        return res
            .status(200)
            .json(collection(true, "Updated succesfully", appointment, "UPDATED"));
    }

    /**
     * Get appointments for the logged-in doctor
     *
     * @route   GET /appointments/doctor
     * @access  Doctor
     *
     * @query   {String} [date]   - Filter by date (YYYY-MM-DD)
     * @query   {String} [status] - Appointment status (Pending, Confirmed, Cancelled)
     * @query   {Number} [page=1] - Page number
     * @query   {Number} [limit=10] - Items per page
     *
     * @returns {Object} List of doctor's appointments with pagination
     */
    async getForDoctor(req, res, next) {
        const userId = req.user.id;
        const {date, status, page = 1, limit = 10} = req.query;

        const doctor = await Doctor.findOne({userId});
        if (!doctor) {
            const error = new Error("Doctor file not found");
            error.statusCode = 404;
            return next(error);
        }

        const filter = {doctorId: doctor._id};
        if (date) {
            filter.date = {
                $gte: AppointmentUtils.startOfDay(new Date(date)),
                $lte: AppointmentUtils.endOfDay(new Date(date)),
            };
        }
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const appointments = await Appointment.find(filter)
            .populate({
                path: "patientId",
                populate: {path: "userId", select: "fullName phone"},
            })
            .sort({date: 1, "slot.start": 1})
            .skip(skip)
            .limit(limit);

        const total = await Appointment.countDocuments(filter);

        return res.status(200).json(
            collection(
                true,
                " Get Doctor Appointments succesfully",
                {
                    appointments,
                    pagination: {page, limit, total, pages: Math.ceil(total / limit)},
                },
                "SUCCESS"
            )
        );
    }

    /**
     * Get appointments for the logged-in patient
     *
     * @route   GET /appointments/patient
     * @access  Patient
     *
     * @query   {String} [status] - Appointment status
     * @query   {Number} [page=1]
     * @query   {Number} [limit=10]
     *
     * @returns {Object} List of patient's appointments with pagination
     */
    async getForPatient(req, res, next) {
        const userId = req.user.id;
        const {status, page = 1, limit = 10} = req.query;

        const patient = await Patient.findOne({userId});
        if (!patient) {
            const error = new Error("Patient file not found");
            error.statusCode = 404;
            return next(error);
        }

        const filter = {patientId: patient._id};
        if (status) filter.status = status;

        const skip = (page - 1) * limit;
        const appointments = await Appointment.find(filter)
            .populate({
                path: "doctorId",
                populate: [
                    {path: "userId", select: "fullName"},
                    {path: "specialtyId", select: "name"},
                ],
            })
            .sort({date: -1})
            .skip(skip)
            .limit(limit);

        const total = await Appointment.countDocuments(filter);

        return res.status(200).json(
            collection(
                true,
                " Get Patient Appointments succesfully",
                {
                    appointments,
                    pagination: {page, limit, total, pages: Math.ceil(total / limit)},
                },
                "SUCCESS"
            )
        );
    }

    /**
     * Get appointment details by ID
     *
     * @route   GET /appointments/:id
     * @access  Admin | Doctor | Patient
     *
     * @param   {String} id - Appointment ID
     *
     * @returns {Object} Appointment details
     */
    async getById(req, res, next) {
        const {id} = req.params;
        const userId = req.user.id;

        const appointment = await Appointment.findById(id)
            .populate({
                path: "patientId",
                populate: {path: "userId", select: "fullName email"},
            })
            .populate({
                path: "doctorId",
                populate: [
                    {path: "userId", select: "fullName email"},
                    {path: "specialtyId", select: "name"},
                ],
            });

        if (!appointment) {
            const error = new Error("Appointment not found");
            error.statusCode = 404;
            return next(error);
        }

        let hasAccess = false;

        if (req.user.role === "admin") {
            hasAccess = true;
        } else if (req.user.role === "doctor") {
            const doctor = await Doctor.findOne({userId});
            hasAccess =
                doctor &&
                doctor._id.toString() === appointment.doctorId._id.toString();
        } else if (req.user.role === "patient") {
            const patient = await Patient.findOne({userId});
            hasAccess =
                patient &&
                patient._id.toString() === appointment.patientId._id.toString();
        }

        if (!hasAccess) {
            const error = new Error("You are not allowded to see this Appointment");
            error.statusCode = 403;
            return next(error);
        }

        return res
            .status(200)
            .json(
                collection(
                    true,
                    "Get The appointment details succesfully",
                    appointment,
                    "SUCCESS"
                )
            );
    }

    /**
     * Get available time slots for a doctor on a specific date
     *
     * @route   GET /appointments/available-slots/:doctorId
     * @access  Public
     *
     * @param   {String} doctorId - Doctor ID
     * @query   {String} [date] - Date (YYYY-MM-DD)
     *
     * @returns {Object} Available time slots
     */
    async getAvailableSlots(req, res, next) {
        const {doctorId} = req.params;
        const {date = new Date()} = req.query;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor || !doctor.isActive) {
            const error = new Error("Doctor not found or is not active");
            error.statusCode = 404;
            return next(error);
        }

        const schedule = await DoctorSchedule.findOne({
            doctorId,
            isActive: true,
        });
        if (!schedule) {
            return res
                .status(200)
                .json(
                    collection(
                        true,
                        "Doctor doesnt have a schedule",
                        {availableSlots: []},
                        "SUCCESS"
                    )
                );
        }

        const appointmentDate = new Date(date);
        const dayOfWeek = appointmentDate.getDay();
        if (!schedule.workDays.includes(dayOfWeek)) {
            return res
                .status(200)
                .json(
                    collection(
                        true,
                        "Doctor not Work in this day",
                        {availableSlots: []},
                        "SUCCESS"
                    )
                );
        }

        const bookedAppointments = await Appointment.find({
            doctorId,
            date: {
                $gte: AppointmentUtils.startOfDay(appointmentDate),
                $lte: AppointmentUtils.endOfDay(appointmentDate),
            },
            status: {$in: ["Pending", "Confirmed"]},
        });

        const allSlots = [];
        for (const workSlot of schedule.slots) {
            const slots = AppointmentUtils.generateSlots(
                workSlot.start,
                workSlot.end
            );
            allSlots.push(...slots);
        }

        const availableSlots = allSlots.filter((slot) => {
            const isBooked = bookedAppointments.some((apt) =>
                AppointmentUtils.isTimeConflict(slot, apt.slot)
            );

            const isPast = !AppointmentUtils.isFutureAppointment(
                appointmentDate,
                slot.start
            );

            return !isBooked && !isPast;
        });

        return res.status(200).json(
            collection(
                true,
                "Available Times",
                {
                    doctor: {
                        name: (await doctor.populate("userId")).userId?.fullName,
                        specialty: (await doctor.populate("specialtyId")).specialtyId
                            ?.name,
                    },
                    date: appointmentDate.toISOString().split("T")[0],
                    availableSlots,
                },
                "SUCCESS"
            )
        );
    }
}

module.exports = new AppointmentController();
