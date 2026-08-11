const OTP = require("../models/OTP");
const env = require("../config/env");
const smsService = require("./smsService");
const ApiError = require("../utils/ApiError");

/**
 * سرویس مدیریت کدهای تأیید OTP
 */
const otpService = {
  /**
   * تولید یک کد تصادفی
   */
  generateCode(length = null) {
    const len = length || env.otpLength;
    const min = Math.pow(10, len - 1);
    const max = Math.pow(10, len) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  },

  /**
   * ایجاد و ارسال کد OTP
   * @param {string} identifier - شماره موبایل یا ایمیل
   * @param {string} type - نوع کد ("register", "login", "forgot")
   * @param {string} channel - کانال ارسال ("sms" یا "email")
   */
  async createAndSend(identifier, type, channel = "sms") {
    const expiryMinutes = env.otpExpiryMinutes;

    const recentOtp = await OTP.findOne({ identifier, type, createdAt: { $gte: new Date(Date.now() - 60 * 1000) } });
    if (recentOtp) throw new ApiError(429, "لطفاً کمی صبر کنید");

    // حذف کدهای قبلی برای این شناسه و نوع
    await OTP.deleteMany({ identifier, type, isUsed: false });

    // تولید کد جدید
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // ذخیره کد در دیتابیس
    const otpRecord = await OTP.create({
      identifier,
      code,
      type,
      channel,
      expiresAt,
    });

    // ارسال بر اساس کانال
    if (channel === "sms") {
      await smsService.sendOTP(identifier, code);
    }
    // TODO: در آینده ارسال از طریق ایمیل اضافه شود
    // if (channel === "email") {
    //   await emailService.sendOTPEmail(identifier, code);
    // }

    return otpRecord;
  },

  /**
   * تأیید کد OTP
   */
  async verify(identifier, code, type) {
    const otpRecord = await OTP.findOne({
      identifier,
      code,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw new ApiError(400, "کد تأیید نادرست یا منقضی شده است");
    }

    // علامت‌گذاری کد به‌عنوان استفاده شده
    otpRecord.isUsed = true;
    await otpRecord.save();

    return otpRecord;
  },

  /**
   * بررسی وجود کد فعال
   */
  async hasActiveOTP(identifier, type) {
    const count = await OTP.countDocuments({
      identifier,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    return count > 0;
  },
};

module.exports = otpService;
