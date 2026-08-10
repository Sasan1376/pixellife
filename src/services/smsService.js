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
          console.log(
            `📱 [SMS Simulation] To: ${receptor} | Message: ${message}`,
          );
          return resolve({ success: true, simulated: true });
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
            if (status === 200) {
              console.log(`✅ پیامک ارسال شد به ${receptor}`, response);
              resolve({ success: true, data: response, status });
            } else {
              console.error("❌ خطا از کاوه‌نگار:", status, response);

              if (env.nodeEnv === "development") {
                console.log(
                  `📱 [SMS Fallback] To: ${receptor} | Message: ${message}`,
                );
                return resolve({
                  success: true,
                  simulated: true,
                  error: `Kavenegar status: ${status}`,
                });
              }

              reject(new Error("خطا در ارسال پیامک. لطفاً بعداً تلاش کنید"));
            }
          },
        );
      } catch (error) {
        console.error("❌ خطا در ارسال پیامک:", error.message);

        if (env.nodeEnv === "development") {
          console.log(
            `📱 [SMS Fallback] To: ${receptor} | Message: ${message}`,
          );
          return resolve({
            success: true,
            simulated: true,
            error: error.message,
          });
        }

        reject(new Error("خطا در ارسال پیامک. لطفاً بعداً تلاش کنید"));
      }
    });
  },

  /**
   * ارسال کد تأیید OTP
   * @param {string} receptor - شماره گیرنده
   * @param {string} code - کد تأیید
   */
  async sendOTP(receptor, code) {
    const message = `کد تأیید شما: ${code}\nاین کد ۲ دقیقه اعتبار دارد.\nپیکسل لایف`;
    return await this.sendSMS(receptor, message);
  },
};

module.exports = smsService;
