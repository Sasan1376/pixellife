const nodemailer = require("nodemailer");

// تنظیمات SMTP زoho — از متغیرهای محیطی خوانده می‌شود
const ZOHO_HOST = process.env.ZOHO_HOST || "smtp.zoho.com";
const ZOHO_PORT = parseInt(process.env.ZOHO_PORT, 10) || 587;
const ZOHO_EMAIL = process.env.ZOHO_EMAIL;
const ZOHO_APP_PASSWORD = process.env.ZOHO_APP_PASSWORD;

let transporter = null;

if (ZOHO_EMAIL && ZOHO_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: ZOHO_HOST,
    port: ZOHO_PORT,
    secure: false, // STARTTLS روی پورت 587
    auth: {
      user: ZOHO_EMAIL,
      pass: ZOHO_APP_PASSWORD,
    },
  });
} else {
  console.warn(
    "⚠️ ZOHO_EMAIL یا ZOHO_APP_PASSWORD تنظیم نشده — ارسال ایمیل غیرفعال است",
  );
}

/**
 * ارسال ایمیل با SMTP زoho
 * خطاها لاگ می‌شوند ولی به caller برمی‌گردند تا عملیات اصلی (مثل ثبت سفارش) کرش نکند.
 * @param {string} to آدرس گیرنده
 * @param {string} subject موضوع ایمیل
 * @param {string} htmlContent محتوای HTML ایمیل
 * @returns {Promise<{success: boolean, message?: string, error?: Error}>}
 */
async function sendEmail(to, subject, htmlContent) {
  if (!transporter) {
    console.error(
      "❌ Mailer: transporter آماده نیست (ZOHO_EMAIL / ZOHO_APP_PASSWORD تنظیم نشده)",
    );
    return { success: false, error: new Error("Mailer not configured") };
  }

  try {
    const info = await transporter.sendMail({
      from: `"PixelLife" <${ZOHO_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`✅ ایمیل به ${to} ارسال شد — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ خطا در ارسال ایمیل به ${to}:`, error.message);
    return { success: false, error };
  }
}

module.exports = { sendEmail };
