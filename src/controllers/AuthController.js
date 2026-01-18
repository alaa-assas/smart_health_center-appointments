const collection = require("../utils/collection");
const User = require("../models/User");
const Patient = require("../models/Patient")
const Doctor = require("../models/Doctor");
const UrlToken = require("../models/UrlToken");
const passwordService = require('../utils/passwordService');
const cookieService = require('../utils/cookieService');
const tokenService = require('../utils/tokenService');
const sendMessage = require("../utils/mail");


class AuthController {

    /**
     * Handle failed login attempts for a user
     *
     * - Increments failed login attempts counter
     * - Locks the user account after reaching the maximum attempts
     * - Sets lock duration to 30 minutes
     *
     * @param {Object} user - User mongoose document
     * @returns {Promise<void>}
     */
    async handledFailedLogin(user) {
        // Increment failed login attempts by 1
        user.failedLoginAttempts = user.failedLoginAttempts + 1;

        // Check if failed attempts reached the limit
        if (user.failedLoginAttempts >= 5) {
            user.isLocked = true;

            // Lock duration: 30 minutes (in milliseconds)
            const MIN = (30 * 60 * 1000);

            // Set account lock expiration time
            user.lockedUntil = new Date(Date.now() + MIN)
        }

        // save updates
        await user.save();
    }

    /**
     * Reset failed login attempts after successful login
     *
     * - Resets failed attempts counter
     * - Unlocks the user account
     * - Clears lock expiration time
     *
     * @param {Object} user - User mongoose document
     * @returns {Promise<void>}
     */
    async resetFailedLoginAttemtps(user) {
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockedUntil = null;

        // Persist changes to database
        await user.save();
    }


    /**
     * Register a new user
     *
     * @route   POST /auth/register
     * @access  Public
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @body    {String} email
     * @body    {String} password
     * @body    {String} fullName
     * @body    {String} phone
     * @body    {Date}   dateOfBirth
     * @body    {String} address
     *
     * @returns {Object} Newly created user with authentication tokens
     */
    async register(req, res) {

        const {email, password, fullName, phone, dateOfBirth, address, gender, chronicConditions} = req.body;

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

        const patient = await Patient.create({
            userId:user._id,
            gender,
            chronicConditions
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
            collection(true, "Signed Up Successfully", {user, patient}, "SUCCESS")
        );
    }

    /**
     * Login user
     *
     * - Validates user credentials
     * - Handles account lock logic
     * - Tracks failed login attempts
     * - Generates authentication tokens
     *
     * @route   POST /auth/login
     * @access  Public
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @body    {String} email
     * @body    {String} password
     *
     * @returns {Object} Logged-in user data with tokens
     */
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

    /**
     * Logout current user
     *
     * - Clears authentication cookies (access & refresh tokens)
     *
     * @route   POST /auth/logout
     * @access  Authenticated
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} Success message
     */
    async logout(req, res) {

        cookieService.clearTokens(res);
        return res.status(200).json(
            collection(true, 'Logged Out Successfully', null, "SUCCESS")
        );

    }

    /**
     * Refresh access & refresh tokens
     *
     * - Reads refresh token from cookies
     * - Verifies refresh token validity
     * - Generates new access & refresh tokens
     * - Stores new tokens in cookies
     *
     * @route   POST /auth/refresh-token
     * @access  Public (requires refresh token cookie)
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} Success message
     */
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

    /**
     * Get logged-in user profile
     *
     * - Returns basic user data
     * - Populates doctor-specific data if user role is "doctor"
     *
     * @route   GET /auth/profile
     * @access  Authenticated
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} User profile data
     */
    async getPorfile(req, res) {
        const id = req.user.id;
        let user = await User.findById(id)

        // If user is a patient
        if (user.role === "patient") {
            const patient = await Patient.findOne({userId:id}).select(["gender","chronicConditions","isActive"]);
            user = {user, patient}
        }else if (user.role === "doctor") { // If user is a doctor, populate doctor-related data
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

    /**
     * Update logged-in user profile
     *
     * - Allows updating only specific fields
     * - Prevents updating restricted fields (role, password, etc.)
     *
     * @route   PUT /auth/profile
     * @access  Authenticated
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} Updated user data
     */
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

        return res.status(200).json(
            collection(true, 'Profile updated successfully', {user: updatedUser}, "SUCCESS")
        );
    }

    /**
     * Request password update (send verification email)
     *
     * - Generates a temporary URL token
     * - Sends verification email to the user
     *
     * @route   POST /auth/password/request
     * @access  Authenticated
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} Success message
     */
    async askToUpdatePassword(req, res) {
        const userId = req.user.id;
        const email = req.user.email;

        const token = (Math.random() * 1e9) + ("ABC");
        await UrlToken.create({user: userId, token});

        const verifyUrl = `http://localhost:3000/api/v1/auth/verify/${token}`;

        // Email content
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

    /**
     * Verify password update request
     *
     * - Validates verification token
     * - Checks token expiration (15 minutes)
     * - Marks user as verified to update password
     *
     * @route   GET /auth/verify/:token
     * @access  Public
     *
     * @param   {String} token - Verification token
     *
     * @returns {Object} Success message
     */
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
        await UrlToken.deleteOne({_id: urlToken._id});

        if (isTokenExpired) {
            throw new Error("Token has expired. Please request a new password reset link.")
        }

        // knowing the user who ask to update the password
        await User.findByIdAndUpdate(urlToken.user, {isVerifiedToUpdate: true});

        res.status(200).json(collection(true, "Verifying Successfully", null, "SUCCESS"));
    }

    /**
     * Update user password
     *
     * - Requires prior verification
     * - Validates password strength
     * - Hashes new password before saving
     *
     * @route   PUT /auth/password/update
     * @access  Authenticated (verified)
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     *
     * @returns {Object} Success message
     */
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
