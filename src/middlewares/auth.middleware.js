const User = require("../models/User");
const cookieService = require("../utils/cookieService");
const tokenService = require("../utils/tokenService");
const collection = require("../utils/collection"); 

// Authentication
const requireAuth = async (req, res, next) => {
    try {
        // get token from request (access)
        const token = cookieService.getAccessToken(req);
        if (!token) {
            return res.status(401).json(collection(false, "Authentication token missing", null, "UNAUTHORIZED"));
        }
        // another way: (Local Storage, Send token in response)
        // const token = req.headers.authorization?.replace("Bearer", "")

        // verify the token (age, valid)
        const decoded = tokenService.verifyAccessToken(token)

        // decoded the token to get user details
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json(collection(false, "User no longer exists", null, "NOT_FOUND"));
        }

        if (user.isLocked) {
            return res.status(401).json(collection(false, "Account is locked", null, "FORBIDDEN"));
        }

        // store date to use it next
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role
        }

        next();
    } catch (error) {
        throw new Error(error.message);
    }
}

// Authorization

// HOF
const auhtorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(collection(false, "Authentication Failed", null, "UNAUTHORIZED"));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(collection(false, "Insufficient permissions", null, "FORBIDDEN"));
        }

        next();
    }
}

module.exports = {
    requireAuth,
    auhtorize
}