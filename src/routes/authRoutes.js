const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  checkUserValidator,
  sendOtpValidator,
  verifyLoginOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyForgotOtpValidator,
  resetPasswordValidator,
  resendOtpValidator,
  completeProfileValidator,
  validate,
} = require("../validators/authValidator");

// ----- مرحله ۱: بررسی وجود کاربر -----
router.post(
  "/check-user",
  checkUserValidator,
  validate,
  authController.checkUser,
);

// ----- مرحله ۲: ارسال کد تأیید -----
router.post("/send-otp", sendOtpValidator, validate, authController.sendOtp);

// ----- مرحله ۳: تأیید OTP و ورود -----
router.post(
  "/verify-login-otp",
  verifyLoginOtpValidator,
  validate,
  authController.verifyLoginOtp,
);

// ----- ورود با رمز عبور -----
router.post("/login", loginValidator, validate, authController.login);

// ----- فراموشی رمز عبور -----
router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.post(
  "/verify-forgot-otp",
  verifyForgotOtpValidator,
  validate,
  authController.verifyForgotOtp,
);
router.post(
  "/reset-password",
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);

// ----- ارسال مجدد OTP -----
router.post(
  "/resend-otp",
  resendOtpValidator,
  validate,
  authController.resendOtp,
);

// ----- تکمیل اطلاعات کاربری (نام و نام خانوادگی) -----
router.post(
  "/complete-profile",
  protect,
  completeProfileValidator,
  validate,
  authController.completeProfile,
);

// ----- خروج -----
router.get("/logout", authController.logout);

module.exports = router;
