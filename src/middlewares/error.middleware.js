const collection = require("../utils/collection");

const handleError = (err, req, res, next) => {

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = "INTERNAL_ERROR";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    errorCode = "VALIDATION_ERROR";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
    errorCode = "DUPLICATE_ENTRY";
  }

  if (err.statusCode === 404) {
    errorCode = "NOT_FOUND";
  }

  if (err.statusCode === 400) {
    errorCode = "BAD_REQUEST";
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Something went wrong";
    errorCode = "SERVER_ERROR";
  }

  return res.status(statusCode).json(
    collection(false, message, null, errorCode)
  );
};

module.exports = handleError;