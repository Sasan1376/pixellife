const User = require("../models/User");
const OTP = require("../models/OTP");
const tokenService = require("../services/tokenService");
const otpService = require("../services/otpService");
const ApiError = require("../utils/ApiError");

/**
 * کمک‌کننده: پیدا کردن کاربر بر اساس identifier (موبایل یا ایمیل)
 */
const findUserByIdentifier = async (identifier, selectPassword = false) => {
  const isMobile = /^09\d{9}$/.test(identifier);
  let query = isMobile
    ? User.findOne({ mobile: identifier })
    : User.findOne({ email: identifier });

  if (selectPassword) {
    query = query.select("+password");
  }

  return await query;
};

/**
 * کمک‌کننده: تشخیص کانال ارسال بر اساس identifier
 */
const getChannel = (identifier) => {
  return /^09\d{9}$/.test(identifier) ? "sms" : "email";
};

// ============================================================
// مرحله ۱: بررسی وجود کاربر (Check User)
// ============================================================
exports.checkUser = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    const user = await findUserByIdentifier(identifier);

    if (!user) {
      return res.json({
        success: true,
        data: {
          exists: false,
          hasPassword: false,
          channel: getChannel(identifier),
        },
      });
    }

    res.json({
      success: true,
      data: {
        exists: true,
        hasPassword: user.hasPassword(),
        channel: getChannel(identifier),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// مرحله ۲: ارسال کد تأیید OTP (Send OTP)
// ثبت‌نام خودکار برای کاربران جدید
// ============================================================
exports.sendOtp = async (req, res, next) => {
  try {
    const { identifier, type } = req.body;
    const channel = getChannel(identifier);

    // بررسی وجود کاربر
    const user = await findUserByIdentifier(identifier);

    if (!user) {
      // ثبت‌نام خودکار — کاربر جدید بدون رمز عبور
      const isMobile = /^09\d{9}$/.test(identifier);
      const userData = isMobile
        ? { mobile: identifier }
        : { email: identifier };
      await User.create(userData);
    }

    // ارسال کد تأیید
    await otpService.createAndSend(identifier, type, channel);

    res.json({
      success: true,
      message: "کد تأیید ارسال شد",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// مرحله ۳: تأیید OTP و ورود (Verify Login OTP)
// ============================================================
exports.verifyLoginOtp = async (req, res, next) => {
  try {
    const { identifier, code } = req.body;

    // بررسی وجود کاربر
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return next(new ApiError(404, "کاربر یافت نشد"));
    }

    // تأیید کد OTP (register یا login)
    let verified = false;
    for (const type of ["register", "login"]) {
      try {
        await otpService.verify(identifier, code, type);
        verified = true;
        break;
      } catch (e) {
        // ادامه با type بعدی
      }
    }
    if (!verified) {
      return next(new ApiError(400, "کد تأیید نادرست یا منقضی شده است"));
    }

    // فعال‌سازی حساب
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // ساخت توکن
    const token = tokenService.generateToken(user._id);

    res.json({
      success: true,
      message: "ورود موفق",
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ورود با رمز عبور (Login with Password)
// ============================================================
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // جستجوی کاربر
    const user = await findUserByIdentifier(identifier, true);
    if (!user) {
      return next(new ApiError(401, "نام کاربری یا رمز عبور اشتباه است"));
    }

    // مقایسه رمز عبور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, "نام کاربری یا رمز عبور اشتباه است"));
    }

    // بررسی فعال بودن حساب
    if (!user.isActive) {
      return next(new ApiError(403, "حساب کاربری شما غیرفعال شده است"));
    }

    // بروزرسانی آخرین ورود
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // ساخت توکن
    const token = tokenService.generateToken(user._id);

    res.json({
      success: true,
      message: "ورود موفق",
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// فراموشی رمز عبور (Forgot Password)
// ============================================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return next(new ApiError(404, "کاربری با این اطلاعات یافت نشد"));
    }

    const channel = getChannel(identifier);
    await otpService.createAndSend(identifier, "forgot", channel);

    res.json({
      success: true,
      message: "کد تأیید ارسال شد",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// تأیید OTP فراموشی رمز عبور (Verify Forgot Password OTP)
// ============================================================
exports.verifyForgotOtp = async (req, res, next) => {
  try {
    const { identifier, code } = req.body;

    // فقط بررسی صحت کد بدون isUsed کردن
    const otpRecord = await OTP.findOne({
      identifier,
      code,
      type: "forgot",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord || otpRecord.isUsed) {
      return next(new ApiError(400, "کد تأیید نادرست یا منقضی شده است"));
    }

    res.json({
      success: true,
      message: "کد تأیید صحیح است. اکنون می‌توانید رمز عبور جدید تعیین کنید",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// تعیین رمز عبور جدید (Reset Password)
// ============================================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { identifier, code, password } = req.body;

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return next(new ApiError(404, "کاربری با این اطلاعات یافت نشد"));
    }

    // بررسی کد OTP (استفاده از otpService برای تأیید و isUsed کردن)
    await otpService.verify(identifier, code, "forgot");

    // بروزرسانی رمز عبور
    user.password = password;
    await user.save();

    // ساخت توکن جدید
    const token = tokenService.generateToken(user._id);

    res.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ارسال مجدد OTP (Resend OTP)
// ============================================================
exports.resendOtp = async (req, res, next) => {
  try {
    const { identifier, type } = req.body;
    const channel = getChannel(identifier);

    // برای نوع register/login: کاربر باید وجود داشته باشد
    if (type === "register" || type === "login") {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return next(new ApiError(404, "کاربر یافت نشد"));
      }
    }

    // برای نوع forgot: کاربر باید وجود داشته باشد
    if (type === "forgot") {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        return next(new ApiError(404, "کاربری با این اطلاعات یافت نشد"));
      }
    }

    await otpService.createAndSend(identifier, type, channel);

    res.json({
      success: true,
      message: "کد تأیید جدید ارسال شد",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// خروج (Logout)
// ============================================================
exports.logout = (req, res, next) => {
  try {
    res.clearCookie("token");
    res.json({
      success: true,
      message: "خروج موفق",
    });
  } catch (error) {
    next(error);
  }
};
