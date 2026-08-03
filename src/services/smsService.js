const axios = require("axios");
const env = require("../config/env");

/**
 * سرویس ارسال پیامک از طریق API کاوه‌نگار
 * ساختار ماژولار: برای تغییر سرویس SMS کافی است این فایل جایگزین شود
 */
const smsService = {
  /**
   * ارسال پیامک به شماره موبایل
   * @param {string} receptor - شماره گیرنده (مثلاً 09123456789)
   * @param {string} message - متن پیام
   */
  async sendSMS(receptor, message) {
    try {
      if (!env.kavehNegarApiKey) {
        console.warn("⚠️ KAVEH_NEGAR_API_KEY تنظیم نشده — پیامک ارسال نمی‌شود");
        console.log(`📱 [SMS Simulation] To: ${receptor} | Message: ${message}`);
        return { success: true, simulated: true };
      }

      const response = await axios.post(
        `https://api.kavenegar.com/v1/${env.kavehNegarApiKey}/sms/send.json`,
        {
          receptor,
          message,
          sender: env.kavehNegarSender || "",
        },
        {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        },
      );

      const result = response.data;

      if (result.return?.status !== 200) {
        throw new Error(
          result.return?.message || "خطا در ارسال پیامک از کاوه‌نگار",
        );
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ خطا در ارسال پیامک:", error.message);

      // در محیط توسعه، خطای SMS جلوی ثبت‌نام را نمی‌گیرد
      if (env.nodeEnv === "development") {
        console.log(`📱 [SMS Fallback] To: ${receptor} | Message: ${message}`);
        return { success: true, simulated: true, error: error.message };
      }

      throw new Error("خطا در ارسال پیامک. لطفاً بعداً تلاش کنید");
    }
  },

  /**
   * ارسال کد تأیید OTP
   * @param {string} receptor - شماره گیرنده
   * @param {string} code - کد تأیید
   */
  async sendOTP(receptor, code) {
    const message = `کد تأیید شما: ${code}\nاین کد ۲ دقیقه اعتبار دارد.\nدیجی‌شاپ`;
    return await this.sendSMS(receptor, message);
  },
};

module.exports = smsService;
