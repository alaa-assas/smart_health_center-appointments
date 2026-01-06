const collection = require("../utils/collection");
const User = require("../models/User");
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

        const user = await User.findById(id)

        if(user.role === "doctor"){
            user.populate("Specialty")
                .populate({
                    path: 'doctor',
                    populate: {
                        path: 'Specialty',
                    }
                })
                .populate({
                    path: 'doctor',
                    populate: {
                        path: 'DoctorSchedule',
                    }
                });
        }

        return res.status(200).json(collection(true, 'Get Profile Data', user, "SUCCESS"));
    }
}

module.exports = new AuthController();
