const Patient = require("../models/Patient");
const collection = require("../utils/collection");

class PatientController {
 
    //Fetch all patients and populate their basic user info
 
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

   // Fetch a specific patient by their ID

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await Patient.findById(id).populate("userId", "fullName phone email");
      
      if (!patient) {
        const error = new Error("Patient not found");
        error.statusCode = 404;
        return next(error);
      }
      
      return res.status(200).json(
        collection(true, "Patient details retrieved", patient, "SUCCESS")
      );
    } catch (error) {
      next(error);
    }
  }

   // Create a new patient profile linked to a User ID
   
  async create(req, res, next) {
    try {
      const newPatient = new Patient(req.body);
      await newPatient.save();
      
      return res.status(201).json(
        collection(true, "Patient record created successfully", newPatient, "CREATED")
      );
    } catch (error) {
      next(error);
    }
  }


   // Update patient clinical data

  async update(req, res, next) {
    try {
      const { id } = req.params;
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
    } catch (error) {
      next(error);
    }
  }

   // Remove a patient record from the system

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedPatient = await Patient.findByIdAndDelete(id);
      
      if (!deletedPatient) {
        const error = new Error("Patient not found");
        error.statusCode = 404;
        return next(error);
      }
      
      return res.status(200).json(
        collection(true, "Patient record deleted", null, "DELETED")
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PatientController();