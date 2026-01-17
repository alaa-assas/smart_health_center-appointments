const { createLogger, format, transports } = require("winston");

/**
 * @desc    Winston logger configuration
 *
 * This logger handles application logging with multiple levels and outputs:
 * - Console output for development
 * - Separate file for error logs (error.log)
 * - Combined log file for all messages (combined.log)
 *
 * It includes timestamps and stack traces for easier debugging.
 *
 * @example
 * const logger = require("./logger");
 * logger.info("Server started successfully");
 * logger.error("Database connection failed");
 */
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf((info) => {
      return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" })
  ]
});

module.exports = logger;
