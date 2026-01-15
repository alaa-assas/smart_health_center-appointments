require('dotenv').config(); // تحميل متغيرات البيئة
const sendMessage = require("../utils/mail");

async function testSendMail() {
    try {
        const token = "test-token-12345";
        const verifyUrl = `http://localhost:3000/api/v1/auth/verify/${token}`;

        const mailOptions = {
            from: "Health Center",
            to: "jasmin.james.980@gmail.com",
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

    } catch (error) {
        console.error("❌ فشل إرسال الإيميل:");
        console.error("   الرسالة:", error.message);
        if (error.responseCode) {
            console.error("   كود الاستجابة:", error.responseCode);
        }
    }
}

// تشغيل الاختبار
testSendMail();