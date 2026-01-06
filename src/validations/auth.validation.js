const { body, param, query } = require("express-validator");
const User = require("../models/User");
const mongoose = require("mongoose");

const authValidation = {
    registerValidation :
        [

        body("email")
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email format")
            .normalizeEmail()
            .custom(async (email) => {
                const existingUser = await User.findOne({email});
                if (existingUser) {
                    throw new Error("Invalid email");
                }
                return true;
            })
            .bail(),

        body("password")
            .notEmpty().withMessage("Password is required").bail()
            .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long").bail()
            .isStrongPassword({
                minLength: 6,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0,
                returnScore: false // يعرض رسالة واحدة بدلاً من رسائل متعددة
            }).withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

        body("fullName")
            .notEmpty().withMessage("FullName is required")
            .isLength({min: 2, max: 50})
            .withMessage("Name must be between 2 and 50 characters")
            .bail(),

        body("phone")
            .notEmpty().withMessage("Phone number is required")
            .isMobilePhone("any")
            .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage("Invalid phone number")
            .trim()
            .bail(),

        body('dateOfBirth')
            .optional()
            .isISO8601().withMessage('The date of birth must be correct.')
            .custom((value) => {
                if (!value) return true;

                const date = new Date(value);
                const today = new Date();

                if (date > today) {
                    throw new Error('The date of birth cannot be in the future.');
                }

                return true;
            })
            .toDate()
            .bail(),

        body('address')
            .optional()
            .trim(),

    ],

    loginValidation : [
        // Email exists
        body("email")
            .notEmpty().withMessage("Email is required")
            .isEmail().withMessage("Invalid email format")
            .normalizeEmail()
            .custom(async (email) => {
                const user = await User.findOne({email});
                if (!user) {
                    throw new Error("Email not found");
                }
                return true;
            })
            .bail(),

        // Strong password format
        body("password")
            .notEmpty().withMessage("Password is required").bail()
            .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long").bail()
            .isStrongPassword({
                minLength: 6,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0,
                returnScore: false
            }).withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

    ]

};

module.exports = authValidation;
