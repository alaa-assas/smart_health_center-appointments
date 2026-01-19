const Appointment = require("../models/Appointment");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHanlder");
const ExportService = require("../services/export.service");
const collection = require("../utils/collection");
const mongoose = require("mongoose");

class ReportController {

    // Helper to log reporting actions to AuditLog
    logReportAction = async (userId, action, details) => {
        await AuditLog.create({
            userId,
            action,
            entity: "Report",
            entityId: null,
            details
        });
    };

    // @desc    Get detailed appointment report with filters
    // @route   GET /api/v1/admin/reports/appointments
    // @access  Private/Admin
    getAppointmentsReport = asyncHandler(async (req, res) => {
        const { from, to, doctorId, specialtyId, status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const matchStage = {};
        if (from || to) {
            matchStage.date = {};
            if (from) matchStage.date.$gte = new Date(from);
            if (to) matchStage.date.$lte = new Date(to);
        }
        if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        if (status) matchStage.status = status;

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctorInfo"
                }
            },
            { $unwind: "$doctorInfo" },
            {
                $lookup: {
                    from: "users",
                    localField: "doctorInfo.userId",
                    foreignField: "_id",
                    as: "doctorUserDetails"
                }
            },
            { $unwind: "$doctorUserDetails" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctorInfo.specialtyId",
                    foreignField: "_id",
                    as: "specialtyInfo"
                }
            },
            { $unwind: "$specialtyInfo" },
            ...(specialtyId
                ? [{ $match: { "specialtyInfo._id": new mongoose.Types.ObjectId(specialtyId) } }]
                : []),
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patientInfo"
                }
            },
            { $unwind: "$patientInfo" },
            {
                $lookup: {
                    from: "users",
                    localField: "patientInfo.userId",
                    foreignField: "_id",
                    as: "patientUserDetails"
                }
            },
            { $unwind: "$patientUserDetails" },
            {
                $project: {
                    _id: 1,
                    date: 1,
                    slot: 1,
                    status: 1,
                    cancelReason: 1,
                    patientName: "$patientUserDetails.name",
                    doctorName: "$doctorUserDetails.name",
                    specialty: "$specialtyInfo.name",
                    createdAt: 1
                }
            },
            { $sort: { date: -1 } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: parseInt(limit) }]
                }
            }
        ];

        const result = await Appointment.aggregate(pipeline);
        const total = result[0].metadata[0]?.total || 0;

        await this.logReportAction(req.user.id, "REPORT_VIEW", "Appointment List");

        return res.status(200).json(
            collection(
                true,
                "Appointments report fetched successfully",
                {
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total
                    },
                    data: result[0].data
                },
                "SUCCESS"
            )
        );
    });

    // @desc    Get summary statistics for dashboard
    // @route   GET /api/v1/admin/reports/summary
    // @access  Private/Admin
    getSummaryReport = asyncHandler(async (req, res) => {
        const statusStats = await Appointment.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const specialtyStats = await Appointment.aggregate([
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctor.specialtyId",
                    foreignField: "_id",
                    as: "specialty"
                }
            },
            { $unwind: "$specialty" },
            { $group: { _id: "$specialty.name", count: { $sum: 1 } } }
        ]);

        await this.logReportAction(req.user.id, "REPORT_VIEW", "Summary Statistics");

        return res.status(200).json(
            collection(
                true,
                "Summary report fetched successfully",
                {
                    appointmentsByStatus: statusStats.reduce(
                        (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
                        {}
                    ),
                    appointmentsBySpecialty: specialtyStats.map(s => ({
                        name: s._id,
                        count: s.count
                    }))
                },
                "SUCCESS"
            )
        );
    });

    // @desc    Get audit logs report
    // @route   GET /api/v1/admin/reports/audit-logs
    // @access  Private/Admin
    getAuditLogsReport = asyncHandler(async (req, res) => {
        const logs = await AuditLog.find()
            .populate("userId", "name email role")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json(
            collection(
                true,
                "Audit logs fetched successfully",
                logs,
                "SUCCESS"
            )
        );
    });

    // @desc    Export report as Excel or PDF
    // @route   GET /api/v1/admin/reports/export
    // @access  Private/Admin
    exportReport = asyncHandler(async (req, res) => {
        const { format, from, to, doctorId, specialtyId, status } = req.query;

        if (!["xlsx", "pdf"].includes(format)) {
            return res.status(400).json(
                collection(
                    false,
                    "Invalid format. Use 'xlsx' or 'pdf'.",
                    null,
                    "VALIDATION_ERROR"
                )
            );
        }

        const matchStage = {};
        if (from || to) {
            matchStage.date = {};
            if (from) matchStage.date.$gte = new Date(from);
            if (to) matchStage.date.$lte = new Date(to);
        }
        if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        if (status) matchStage.status = status;

        const reportData = await Appointment.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctor.specialtyId",
                    foreignField: "_id",
                    as: "specialty"
                }
            },
            { $unwind: "$specialty" },
            ...(specialtyId
                ? [{ $match: { "specialty._id": new mongoose.Types.ObjectId(specialtyId) } }]
                : []),
            {
                $lookup: {
                    from: "users",
                    localField: "doctor.userId",
                    foreignField: "_id",
                    as: "doctorUser"
                }
            },
            { $unwind: "$doctorUser" },
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            { $unwind: "$patient" },
            {
                $lookup: {
                    from: "users",
                    localField: "patient.userId",
                    foreignField: "_id",
                    as: "patientUser"
                }
            },
            { $unwind: "$patientUser" },
            {
                $project: {
                    _id: 0,
                    patientName: "$patientUser.fullName",
                    doctorName: "$doctorUser.fullName",
                    specialty: "$specialty.name",
                    startAt: "$slot.start",
                    endAt: "$slot.end",
                    status: 1,
                    createdAt: 1,
                    cancellationReason: "$cancelReason"
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        await this.logReportAction(
            req.user.id,
            "REPORT_EXPORT",
            `Export format: ${format}`
        );

        const fileName = `Appointment_Report_${Date.now()}`;

        if (format === "xlsx") {
            const buffer = await ExportService.toExcel(reportData, "Appointments");
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${fileName}.xlsx`
            );
            return res.send(buffer);
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}.pdf`
        );
        return ExportService.toPDF(reportData, "Appointment Report", res);
    });
}

module.exports = new ReportController();