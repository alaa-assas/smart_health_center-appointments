const User = require("../models/User");
const cookieService = require("../utils/cookieService");
const tokenService = require("../utils/tokenService");

// Authentication
const requireAuth = async (req, res, next) => {
    try {
        // get token from request (access)
        const token = cookieService.getAccessToken(req);

        // another way: (Local Storage, Send token in response)
        // const token = req.headers.authorization?.replace("Bearer", "")

        // verify the token (age, valid)
        const decoded = tokenService.verifyAccessToken(token)

        // decoded the token to get user details
        const user = await User.findById(decoded.id);

        if(!user) {
            return res.status(401).json({ message: "User no longer exist" });
        }

        if (user.isLocked) {
            return res.status(401).json({message: "Not Authorized"});
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
        if(!req.user) {
            return res.status(401).json({ message: "Authentication Failed" })
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(401).json({ message: "Invalid Role" })
        }

        next();
    }
}

module.exports = {
    requireAuth,
    auhtorize
}