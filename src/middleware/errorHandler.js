const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/**
 * میدلور سراسری مدیریت خطا
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // خطاهای Mongoose Validation
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)[0].message;
    error = new ApiError(400, message);
  }

  // خطای تکراری بودن (duplicate key)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message =
      field === "mobile"
        ? "این شماره موبایل قبلاً ثبت شده است"
        : "این مقدار قبلاً ثبت شده است";
    error = new ApiError(400, message);
  }

  // خطای CastError (مثلاً ObjectId نامعتبر)
  if (err.name === "CastError") {
    error = new ApiError(400, "شناسه نامعتبر است");
  }

  // خطای JSON Web Token
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "توکن نامعتبر است");
  }

  // خطای انقضای توکن
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "توکن منقضی شده است. لطفاً دوباره وارد شوید");
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "خطای سرور",
    // فقط در محیط توسعه جزئیات خطا ارسال می‌شود
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
