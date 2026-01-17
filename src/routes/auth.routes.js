const express = require("express");
const router = express.Router();

const {requireAuth, auhtorize} = require("../middlewares/auth.middleware");

const asyncHandler = require("../utils/asyncHanlder");
const validate = require("../middlewares/validate.middleware");

const {loginLimiter} = require("../middlewares/limiter.middleware");

const authController = require("../controllers/AuthController");
const {
    registerValidation,
    loginValidation,
    updateProfileValidation
} = require("../validations/auth.validation");

router.post(
    "/register",
    [...registerValidation, validate],
    asyncHandler(authController.register)
);

router.post(
    "/login",
    [loginLimiter, [...loginValidation, validate]],
    asyncHandler(authController.login)
);

router.post("/logout", [requireAuth], asyncHandler(authController.logout));

router.post(
    "/refresh-token",
    [requireAuth],
    asyncHandler(authController.refreshToken)
);

router.get("/profile", [requireAuth], asyncHandler(authController.getPorfile));

router.put("/profile",
    [requireAuth, [...updateProfileValidation, validate]],
    asyncHandler(authController.updateProfile)
);

//Reset Password
router.post("/ask-to-update-password", [requireAuth], asyncHandler(authController.askToUpdatePassword));

router.put("/verify/:token", asyncHandler(authController.verifyToUpdatePassword))

router.put("/update-password", [requireAuth],
    asyncHandler(authController.updatePassword));

module.exports = router;
