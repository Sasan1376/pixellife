const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  kavehNegarApiKey: process.env.KAVEH_NEGAR_API_KEY,
  kavehNegarSender: process.env.KAVEH_NEGAR_SENDER || "2000660110",
  kavehNegarOtpTemplate: process.env.KAVEH_NEGAR_OTP_TEMPLATE,

  otpLength: parseInt(process.env.OTP_LENGTH, 10) || 5,
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 2,
};

const requiredVars = ["mongoUri", "jwtSecret"];

requiredVars.forEach((key) => {
  if (!env[key]) {
    console.error(`❌ متغیر محیطی ${key} الزامی است`);
    process.exit(1);
  }
});

if (!env.kavehNegarApiKey) {
  console.warn(
    "⚠️ KAVEH_NEGAR_API_KEY تنظیم نشده — ارسال پیامک کاوه‌نگار غیرفعال است",
  );
}

module.exports = env;
