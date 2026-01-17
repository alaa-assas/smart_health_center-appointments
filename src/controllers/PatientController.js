const Patient = require("../models/Patient");
const collection = require("../utils/collection");

class PatientController {

    /**
     * @desc    Fetch all patients with basic related user information
     * @route   GET /patients
     * @access  Protected (Admin / Doctor)
     *
     * This method retrieves all patient records and populates
     * basic user details such as full name, phone, and email.
     */
    async getAll(req, res, next) {
        try {
            const patients = await Patient.find().populate("userId", "fullName phone email");
            return res.status(200).json(
                collection(true, "Patients retrieved successfully", patients, "SUCCESS")
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * @desc    Get patient details by ID
     * @route   GET /patients/:id
     * @access  Protected
     *
     * This method retrieves a single patient record
     * along with basic associated user information.
     */
    async getById(req, res, next) {
        const {id} = req.params;
        const patient = await Patient.findById(id).populate("userId", "fullName phone email");

        if (!patient) {
            const error = new Error("Patient not found");
            error.statusCode = 404;
            return next(error);
        }

        return res.status(200).json(
            collection(true, "Patient details retrieved", patient, "SUCCESS")
        );
    }

    /**
     * @desc    Create a new patient profile
     * @route   POST /patients
     * @access  Protected
     *
     * This method creates a new patient record
     * and links it to an existing user via userId.
     */
    async create(req, res, next) {
        const newPatient = new Patient(req.body);
        await newPatient.save();

        return res.status(201).json(
            collection(true, "Patient record created successfully", newPatient, "CREATED")
        );
    }


    /**
     * @desc    Update patient clinical information
     * @route   PUT /patients/:id
     * @access  Protected
     *
     * This method updates patient data while enforcing
     * schema validation rules.
     */
    async update(req, res, next) {
        const {id} = req.params;
        const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedPatient) {
            const error = new Error("Patient not found");
            error.statusCode = 404;
            return next(error);
        }

        return res.status(200).json(
            collection(true, "Patient data updated", updatedPatient, "UPDATED")
        );
    }

    /**
     * @desc    Delete a patient record permanently
     * @route   DELETE /patients/:id
     * @access  Protected (Admin)
     *
     * This method permanently removes a patient record
     * from the database.
     */
    async delete(req, res, next) {
        const {id} = req.params;
        const deletedPatient = await Patient.findByIdAndDelete(id);

        if (!deletedPatient) {
            const error = new Error("Patient not found");
            error.statusCode = 404;
            return next(error);
        }

        return res.status(200).json(
            collection(true, "Patient record deleted", null, "DELETED")
        );
    }

}

module.exports = new PatientController();