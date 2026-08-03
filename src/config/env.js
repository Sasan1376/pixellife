const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  // Kaveh Negar SMS
  kavehNegarApiKey: process.env.KAVEH_NEGAR_API_KEY,
  kavehNegarSender: process.env.KAVEH_NEGAR_SENDER || "",

  // OTP
  otpLength: parseInt(process.env.OTP_LENGTH, 10) || 5,
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 2,
};

// بررسی متغیرهای الزامی
const requiredVars = ["mongoUri", "jwtSecret"];
requiredVars.forEach((key) => {
  if (!env[key]) {
    console.error(`❌ متغیر محیطی ${key} الزامی است`);
    process.exit(1);
  }
});

module.exports = env;
