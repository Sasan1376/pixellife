const Kavenegar = require("kavenegar");
const env = require("../config/env");

/**
 * سرویس ارسال پیامک با پکیج رسمی کاوه‌نگار
 */
const smsService = {
  /**
   * ارسال پیامک به شماره موبایل
   * @param {string} receptor - شماره گیرنده (مثلاً 09123456789)
   * @param {string} message - متن پیام
   */
  sendSMS(receptor, message) {
    return new Promise((resolve, reject) => {
      try {
        if (!env.kavehNegarApiKey) {
          console.warn(
            "⚠️ KAVEH_NEGAR_API_KEY تنظیم نشده — پیامک ارسال نمی‌شود",
          );
          return reject(new Error("کلید API کاوه‌نگار تنظیم نشده است"));
        }

        const api = Kavenegar.KavenegarApi({
          apikey: env.kavehNegarApiKey,
        });

        api.Send(
          {
            message: message,
            sender: env.kavehNegarSender || "",
            receptor: receptor,
          },
          function (response, status) {
            // status در SDK کاوه‌نگار همان return.status است
            if (Number(status) === 200) {
              console.log(`✅ پیامک ارسال شد به ${receptor}`, response);
              resolve({ success: true, data: response, status });
            } else {
              console.error("❌ خطا از کاوه‌نگار:", status, response);

              const detail = response?.message || response?.return?.message || `status: ${status}`;
              reject(new Error(`خطا در ارسال پیامک (${detail})`));
            }
          },
        );
      } catch (error) {
        console.error("❌ خطا در ارسال پیامک:", error.message);

        reject(new Error(`خطا در ارسال پیامک (${error.message})`));
      }
    });
  },

  /**
   * ارسال کد تأیید OTP
   * @param {string} receptor - شماره گیرنده
   * @param {string} code - کد تأیید
   */
  async sendOTP(receptor, code) {
    if (!env.kavehNegarOtpTemplate) {
      return Promise.reject(
        new Error("قالب پیامک OTP کاوه‌نگار تنظیم نشده است"),
      );
    }

    return new Promise((resolve, reject) => {
      try {
        if (!env.kavehNegarApiKey) {
          console.warn(
            "⚠️ KAVEH_NEGAR_API_KEY تنظیم نشده — پیامک ارسال نمی‌شود",
          );
          return reject(new Error("کلید API کاوه‌نگار تنظیم نشده است"));
        }

        const api = Kavenegar.KavenegarApi({
          apikey: env.kavehNegarApiKey,
        });

        api.VerifyLookup(
          {
            receptor,
            token: code,
            template: env.kavehNegarOtpTemplate,
          },
          function (response, status) {
            if (Number(status) === 200 || Number(response?.return?.status) === 200) {
              console.log(`✅ OTP پیامک شد به ${receptor}`, response);
              resolve({ success: true, data: response, status });
            } else {
              console.error("❌ خطا از کاوه‌نگار:", status, response);
              const detail =
                response?.message ||
                response?.return?.message ||
                `status: ${status}`;
              reject(new Error(`خطا در ارسال پیامک (${detail})`));
            }
          },
        );
      } catch (error) {
        console.error("❌ خطا در ارسال پیامک:", error.message);
        reject(new Error(`خطا در ارسال پیامک (${error.message})`));
      }
    });
  },
};

module.exports = smsService;
