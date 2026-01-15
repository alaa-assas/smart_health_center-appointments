const nodemailer = require("nodemailer");

// handler the mail service
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    service: "Gmail",
    secure: process.env.SMTP_SECURE === 'true', // true لـ 465, false لـ 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000, // 10 ثواني
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
        rejectUnauthorized: false // مهم للتطوير
    },
    // debug: true, // لرؤية تفاصيل الاتصال
    logger: true

});

const sendMessage = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Message Sent: ${info.messageId} - ${info.response}`);
        return info;
    } catch (error) {
        console.error("Error Sending Message:", error.message);
        throw new error;
    }
}

module.exports = sendMessage;
