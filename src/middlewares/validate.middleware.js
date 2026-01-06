const { validationResult } = require("express-validator")

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Error Validation",
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        })
    }

    next();
}

module.exports = validate