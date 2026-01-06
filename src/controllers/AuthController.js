const collection = require("../utils/collection");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const passwordService = require('../utils/passwordService');
const cookieService = require('../utils/cookieService');
const tokenService = require('../utils/tokenService');


class AuthController {

    async handledFailedLogin(user) {
        // add +1
        user.failedLoginAttempts = user.failedLoginAttempts + 1;

        // check from limit
        if (user.failedLoginAttempts >= 5) {
            user.isLocked = true;
            const MIN = (30 * 60 * 1000);
            // locked -> locked until (30m)
            user.lockedUntil = new Date(Date.now() + MIN)
        }

        // save updates
        await user.save();
    }

    async resetFailedLoginAttemtps(user) {
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockedUntil = null;
        await user.save();
    }

    async register(req, res) {

        const {email, password, fullName, phone, dateOfBirth, address} = req.body;

        // return  res.json("{email, password, fullName, phone, birthday, address}");

        const existEmail = await User.findOne({email});

        if (existEmail) {
            throw new Error('Your Email Already Exist')
        }

        // Check From Strength Password
        try {
            passwordService.validatePasswordStrength(password);
        } catch (error) {
            return res.status(400).json(collection(false, error.message, null, "ERROR"));
        }

        const hashed = await passwordService.hashPassword(password);
        const user = await User.create({
            email,
            passwordHash: hashed,
            fullName,
            phone,
            dateOfBirth,
            address
        });

        // Generate tokens
        const accessToken = tokenService.genrateAccessToken({
            id: user._id,
            email: user.email,
            role: user.role,
        });

        const refreshToken = tokenService.genrateRefreshToken({
            id: user._id,
            email: user.email,
            role: user.role,
        });

        // Save on cookies
        cookieService.setAccessToken(res, accessToken);
        cookieService.setRefreshToken(res, refreshToken);

        return res.status(200).json(
            collection(true, "Signed Up Successfully", user, "SUCCESS")
        );
    }

    login = async (req, res) => {

        const {email, password} = req.body;

        const existEmail = await User.findOne({email});

        if (!existEmail) {
            throw new Error('Failed Login')
        }

        if (existEmail.isLocked) {
            if (existEmail.lockedUntil <= Date.now()) {
                // reset after locked until is end
                await this.resetFailedLoginAttemtps(existEmail);
            } else {
                // stop the locked users from login
                throw new Error("Sorry You are locked now");
            }
        }

        // Check From Strength Password
        try {
            passwordService.validatePasswordStrength(password);
        } catch (error) {
            return res.status(400).json(collection(false, error.message, null, "ERROR"));
        }

        // Password Verifying
        const verified = await passwordService.verifyPassword(
            password,
            existEmail.passwordHash
        );

        if (!verified) {
            // handle failed login attempts (5)
            await this.handledFailedLogin(existEmail);
            return res.status(404).json(collection(false, 'Failed Login', null, "ERROR"));
        }

        // reset after one success login
        await this.resetFailedLoginAttemtps(existEmail);


        // Generate tokens
        const accessToken = tokenService.genrateAccessToken({
            id: existEmail._id,
            email: existEmail.email,
            role: existEmail.role,
        });

        const refreshToken = tokenService.genrateRefreshToken({
            id: existEmail._id,
            email: existEmail.email,
            role: existEmail.role,
        });

        // Save on cookies
        cookieService.setAccessToken(res, accessToken);
        cookieService.setRefreshToken(res, refreshToken);

        return res.status(200).json(
            collection(true, 'Logged in Successfully', {user: existEmail}, "SUCCESS")
        );
    }

    async logout(req, res) {

        cookieService.clearTokens(res);
        return res.status(200).json(
            collection(true, 'Logged Out Successfully', null, "SUCCESS")
        );

    }

    async refreshToken(req, res) {

        const refreshToken = cookieService.getRefreshToken(req);

        if (!refreshToken) {
            return res.status(401).json(collection(false, 'Refresh Token Required', null, "ERROR"));
        }

        // verify to refresh token (age, valid)
        const decoded = tokenService.verifyRefreshToken(refreshToken);

        const tokenPayload = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        // generate tokens (access, refresh)
        const accessToken = tokenService.genrateAccessToken(tokenPayload);
        const newRefreshToken = tokenService.genrateRefreshToken(tokenPayload);

        // store cookies
        cookieService.setAccessToken(res, accessToken);
        cookieService.setRefreshToken(res, newRefreshToken);

        return res.status(200).json(
            collection(true, 'Tokens Refreshed Successfully', null, "SUCCESS")
        );
    }

    async getPorfile(req, res) {

        const id = req.user.id;

        let user = await User.findById(id)

        if (user.role === "doctor") {
            user.populate({
                path: 'doctor',
                populate: [
                    {path: 'specialtyId'},
                    {path: 'doctorSchedule'}
                ]
            });
        }

        return res.status(200).json(collection(true, 'Get Profile Data', user, "SUCCESS"));
    }

    async updateProfile(req, res) {
        const userId = req.user.id;
        const updateData = req.body;

        const allowedUserFields = [
            'fullName', 'phone', 'dateOfBirth', 'address'
        ];

        let userUpdates = {};
        allowedUserFields.forEach(field => {
            if (updateData[field] !== undefined) {
                userUpdates[field] = updateData[field];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {$set: userUpdates},
            {new: true, runValidators: true}
        );

        if (!updatedUser) {
            return res.status(404).json(collection(false, 'User not found', null, "NOT_FOUND"));
        }
        let responseData = {user: updatedUser};

        if (updatedUser.role === 'doctor') {

            const doctorUpdateResult = await this.updateDoctorProfile(userId, updateData);
            responseData.doctor = doctorUpdateResult.doctor;

            // إذا كان هناك تحديث للجدول الزمني
            if (updateData.schedule && Object.keys(updateData.schedule).length > 0) {
                responseData.schedule = await this.updateDoctorSchedule(
                    doctorUpdateResult.doctor._id,
                    updateData.schedule
                );
            }
        }
        return res.status(200).json(
            collection(true, 'Profile updated successfully', responseData, "SUCCESS")
        );
    }


    async updateDoctorProfile(userId, updateData) {
        try {

            let doctor = await Doctor.findOne({userId: userId});

            const allowedDoctorFields = [
                'fullName', 'specialtyId', 'location', 'bio'
            ];

            let doctorUpdates = {};
            allowedDoctorFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    doctorUpdates[field] = updateData[field];
                }
            });

            doctor = await Doctor.findByIdAndUpdate(
                doctor._id,
                {$set: doctorUpdates},
                {new: true, runValidators: true}
            ).populate('specialtyId', 'name description');


            return {doctor};

        } catch (error) {
            console.error('Update Doctor Profile Error:', error);
            throw error;
        }
    }

    async updateDoctorSchedule(doctorId, scheduleData) {
        try {

            let doctor = await Doctor.findById(doctorId).populate('doctorSchedule');

            let schedule;

            // إذا كان هناك جدول موجود، قم بتحديثه
            if (doctor.doctorSchedule) {
                schedule = await DoctorSchedule.findByIdAndUpdate(
                    doctor.doctorSchedule._id,
                    {$set: scheduleData},
                    {new: true, runValidators: true}
                );
            } else {
                scheduleData.doctorId = doctorId;
                schedule = await DoctorSchedule.create(scheduleData);

                await Doctor.findByIdAndUpdate(doctorId, {
                    $set: {doctorSchedule: schedule._id}
                });
            }

            return schedule;

        } catch (error) {
            console.error('Update Doctor Schedule Error:', error);
            throw error;
        }
    }
}


module.exports = new AuthController();
