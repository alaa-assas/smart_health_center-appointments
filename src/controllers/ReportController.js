const Appointment = require("../models/Appointment");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHanlder");
const ExportService = require("../services/export.service");
const mongoose = require("mongoose");


   //Helper to log reporting actions to AuditLog

const logReportAction = async (userId, action, details) => {
    await AuditLog.create({
        userId,
        action,
        entity: "Report",
        entityId: null, // Reports are virtual entities
    });
};

// @desc    Get detailed appointment report with filters
// @route   GET /api/v1/admin/reports/appointments
// @access  Private/Admin
const getAppointmentsReport = asyncHandler(async (req, res) => {
    const { from, to, doctorId, specialtyId, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 1. Build Match Stage
    const matchStage = {};
    if (from || to) {
        matchStage.date = {};
        if (from) matchStage.date.$gte = new Date(from);
        if (to) matchStage.date.$lte = new Date(to);
    }
    if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
    if (status) matchStage.status = status;

    // 2. Aggregation Pipeline
    const pipeline = [
        { $match: matchStage },
        // Lookup Doctor and their User details for name
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
        // Lookup Specialty
        {
            $lookup: {
                from: "specialties",
                localField: "doctorInfo.specialtyId",
                foreignField: "_id",
                as: "specialtyInfo"
            }
        },
        { $unwind: "$specialtyInfo" },
        // Filter by Specialty if provided
        ...(specialtyId ? [{ $match: { "specialtyInfo._id": new mongoose.Types.ObjectId(specialtyId) } }] : []),
        // Lookup Patient and their User details
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
        // Project final shape
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
    
    // Log the action
    await logReportAction(req.user.id, "REPORT_VIEW", "Appointment List");

    res.status(200).json({
        success: true,
        count: result[0].metadata[0]?.total || 0,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result[0].metadata[0]?.total || 0
        },
        data: result[0].data
    });
});

// @desc    Get summary statistics for dashboard
// @route   GET /api/v1/admin/reports/summary
// @access  Private/Admin
const getSummaryReport = asyncHandler(async (req, res) => {
    // Stats by Status
    const statusStats = await Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Stats by Specialty
    const specialtyStats = await Appointment.aggregate([
        {
            $lookup: {
                from: "doctors",
                localField: "doctorId",
                foreignField: "_id",
                as: "doc"
            }
        },
        { $unwind: "$doc" },
        {
            $lookup: {
                from: "specialties",
                localField: "doc.specialtyId",
                foreignField: "_id",
                as: "spec"
            }
        },
        { $unwind: "$spec" },
        { $group: { _id: "$spec.name", count: { $sum: 1 } } }
    ]);

    await logReportAction(req.user.id, "REPORT_VIEW", "Summary Statistics");

    res.status(200).json({
        success: true,
        data: {
            appointmentsByStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            appointmentsBySpecialty: specialtyStats.map(s => ({ name: s._id, count: s.count }))
        }
    });
});

// @desc    Get audit logs report
// @route   GET /api/v1/admin/reports/audit-logs
// @access  Private/Admin
const getAuditLogsReport = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find()
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .limit(100);

    res.status(200).json({
        success: true,
        data: logs
    });
});

const exportReport = asyncHandler(async (req, res) => {
    const { format, from, to, doctorId, specialtyId, status } = req.query;

    // Early validation of format to avoid unnecessary DB load
    if (!['xlsx', 'pdf'].includes(format)) {
        return res.status(400).json({
            success: false,
            message: "Invalid format. Use 'xlsx' or 'pdf'."
        });
    }

    // Build the dynamic filter object
    const matchStage = {};
    if (from || to) {
        matchStage.date = {};
        if (from) matchStage.date.$gte = new Date(from);
        if (to) matchStage.date.$lte = new Date(to);
    }

    if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
    if (status) matchStage.status = status;

    // Advanced Aggregation Pipeline to gather all necessary report data
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
        // Optional filter for specialty
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

    // Track the export action in Audit Logs
    await AuditLog.create({
        userId: req.user.id,
        action: "REPORT_EXPORT",
        entity: "Appointment"
    });

    const fileName = `Appointment_Report_${Date.now()}`;

    // Execute Export
    if (format === 'xlsx') {
        const buffer = await ExportService.toExcel(reportData, "Appointments");
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}.xlsx`
        );
        return res.send(buffer);
    }

    // PDF Export
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=${fileName}.pdf`
    );
    return ExportService.toPDF(reportData, "Appointment Report", res);
});

module.exports = {
    getAppointmentsReport,
    getSummaryReport,
    getAuditLogsReport,
    exportReport
};