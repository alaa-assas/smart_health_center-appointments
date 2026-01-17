const nodemailer = require("nodemailer");

/**
 * @desc    Nodemailer transporter configuration
 *
 * This transporter is responsible for establishing a connection
 * with the SMTP server and sending emails.
 * Configuration values are loaded from environment variables
 * for security and flexibility.
 */
const transporter = nodemailer.createTransport({
    // SMTP server host (e.g., smtp.gmail.com)
    host: process.env.SMTP_HOST,

    // SMTP port (465 for SSL, 587 for TLS)
    port: process.env.SMTP_PORT,

    // Predefined email service (optional but useful for Gmail)
    service: "Gmail",

    // Enable SSL only for port 465
    secure: process.env.SMTP_SECURE === "true",

    // SMTP authentication credentials
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },

    // Connection timeout configurations (in milliseconds)
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    // TLS configuration (disable cert validation in development only)
    tls: {
        rejectUnauthorized: false, // ⚠️ Do NOT use in production
    },

    // Enable logging for debugging SMTP communication
    logger: true,
    // debug: true, // Uncomment to see full SMTP traffic
});

/**
 * @desc    Send an email using the configured Nodemailer transporter
 *
 * This function sends an email message and returns
 * the Nodemailer response object upon success.
 *
 * @param   {Object} mailOptions - Nodemailer mail options
 * @param   {String} mailOptions.to - Recipient email address
 * @param   {String} mailOptions.subject - Email subject
 * @param   {String} [mailOptions.text] - Plain text body
 * @param   {String} [mailOptions.html] - HTML body
 *
 * @returns {Promise<Object>} Nodemailer sendMail response
 *
 * @throws  {Error} If sending the email fails
 */
const sendMessage = async (mailOptions) => {
    try {
        // Send email using Nodemailer transporter
        const info = await transporter.sendMail(mailOptions);

        // Log successful email delivery
        console.log(
            `Message Sent: ${info.messageId} - ${info.response}`
        );

        return info;
    } catch (error) {
        // Log error details for debugging
        console.error("Error Sending Message:", error.message);

        // Re-throw the original error to be handled upstream
        throw error;
    }
};

module.exports = sendMessage;
