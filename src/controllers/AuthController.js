const collection = require("../utils/collection");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const UrlToken = require("../models/UrlToken");
const passwordService = require('../utils/passwordService');
const cookieService = require('../utils/cookieService');
const tokenService = require('../utils/tokenService');
const sendMessage = require("../utils/mail");


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

            user = await User.findById(id).populate({
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
            'email', 'fullName', 'phone', 'dateOfBirth', 'address'
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

        return res.status(200).json(
            collection(true, 'Profile updated successfully', responseData, "SUCCESS")
        );
    }

    async askToUpdatePassword(req, res) {
        const userId = req.user.id;
        const email = req.user.email;

        const token = (Math.random() * 1e9) + ("ABC");
        await UrlToken.create({user: userId, token});

        const verifyUrl = `http://localhost:3000/api/v1/auth/verify/${token}`;

        const mailOptions = {
            from: "Health Center",
            to: email,
            subject: "Reset Password",
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #333;">مرحباً!</h2>
                    <p>تم طلب تحديث كلمة المرور لحسابك.</p>
                    <p>اضغط على الزر أدناه لتحديث كلمة المرور:</p>
                    <p>
                        <a href="${verifyUrl}" 
                           style="display: inline-block; padding: 10px 20px; 
                                  background-color: #4CAF50; color: white; 
                                  text-decoration: none; border-radius: 5px; 
                                  margin: 10px 0;">
                            تحديث كلمة المرور
                        </a>
                    </p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        إذا لم تطلب هذا الإجراء، يرجى تجاهل هذا البريد.
                    </p>
                </div>
            `,
            text: `لتحديث كلمة المرور، يرجى زيارة الرابط التالي: ${verifyUrl}`
        };

        const result = await sendMessage(mailOptions);
        console.log("📤 Email sending details:", {
            messageId: result.messageId,
            response: result.response,
            accepted: result.accepted,
            rejected: result.rejected
        });

        res.status(200).json(collection(true, "Sent email successfully", null, "SUCCESS"));
    }

    async verifyToUpdatePassword(req, res) {
        const token = req.params.token;

        // valid the token
        const urlToken = await UrlToken.findOne({token});

        if (!urlToken) {
            throw new Error("Invalid Token");
        }

        // 2. Check token expiration (15 minutes)
        const TOKEN_EXPIRY_MINUTES = 15;
        const currentTime = new Date();
        const tokenCreationTime = new Date(urlToken.createdAt);
        const timeDifferenceInMinutes = (currentTime - tokenCreationTime) / (1000 * 60);

        const isTokenExpired = timeDifferenceInMinutes > TOKEN_EXPIRY_MINUTES;

        // Always delete the token after checking (used or expired)
        await UrlToken.deleteOne({ _id: urlToken._id });

        if (isTokenExpired) {
            throw new Error("Token has expired. Please request a new password reset link.")
        }

        // knowing the user who ask to update the password
        await User.findByIdAndUpdate(urlToken.user, {isVerifiedToUpdate: true});

        res.status(200).json(collection(true, "Verifying Successfully", null, "SUCCESS"));
    }

    async updatePassword(req, res) {
        const {password} = req.body;
        const {id} = req.user;

        const isExist = await User.findOne({_id: id, isVerifiedToUpdate: true});

        if (!isExist) {
            throw new Error("You Can Not Make this Action");
        }

        // Check From Strength Password
        try {
            passwordService.validatePasswordStrength(password);
        } catch (error) {
            return res.status(400).json(collection(false, error.message, null, "ERROR"));
        }

        await User.findByIdAndUpdate(id, {
            passwordHash: await passwordService.hashPassword(password),
            isVerifiedToUpdate: false
        });

        res.status(200).json(collection(true, "Updated Password Successfully", null, "SUCCESS"));
    }
}


module.exports = new AuthController();
