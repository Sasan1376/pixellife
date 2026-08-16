const express = require("express");
const router = express.Router();
const { sendEmail } = require("../services/mailer");

// route تست موقت ارسال ایمیل — بعد از تایید کارکرد، حذف یا محافظت شود
// POST /api/test-email  { "to": "example@mail.com" }
router.post("/", async (req, res) => {
  const to = req.body.to || process.env.ZOHO_EMAIL;

  if (!to) {
    return res.status(400).json({
      success: false,
      message: "آدرس گیرنده (to) لازم است",
    });
  }

  const result = await sendEmail(
    to,
    "ایمیل تست پیکسل‌لایف 🎉",
    `
    <div style="font-family: Tahoma, sans-serif; direction: rtl; text-align: center; padding: 24px;">
      <h2 style="color: #3b82f6;">پیکسل‌لایف</h2>
      <p>این یک ایمیل تست برای بررسی تنظیمات SMTP زoho است.</p>
      <p style="color: #64748b;">اگر این ایمیل را دریافت کردید، تنظیمات به درستی کار می‌کند ✅</p>
    </div>
    `,
  );

  if (result.success) {
    return res.json({
      success: true,
      message: `ایمیل با موفقیت به ${to} ارسال شد`,
      messageId: result.messageId,
    });
  }

  return res.status(500).json({
    success: false,
    message: "ارسال ایمیل ناموفق بود (لاگ سرور را ببینید)",
    error: result.error ? result.error.message : undefined,
  });
});

module.exports = router;
