const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const postalCodeValidation = () =>
  body("postalCode")
    .optional({ checkFalsy: true })
    .trim()
    .isNumeric()
    .withMessage("کد پستی فقط باید شامل اعداد باشد")
    .isLength({ min: 10, max: 10 })
    .withMessage("کد پستی باید ۱۰ رقم باشد");

const receiverMobileValidation = () =>
  body("receiverMobile")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^09\d{9}$/)
    .withMessage("شماره موبایل گیرنده معتبر نیست");

// ایجاد آدرس: فیلدهای اصلی الزامی هستند
exports.createAddressValidator = [
  body("province").trim().notEmpty().withMessage("استان الزامی است"),
  body("city").trim().notEmpty().withMessage("شهر الزامی است"),
  body("fullAddress")
    .trim()
    .notEmpty()
    .withMessage("آدرس کامل الزامی است")
    .isLength({ min: 10 })
    .withMessage("آدرس کامل باید حداقل ۱۰ کاراکتر باشد"),
  postalCodeValidation(),
  receiverMobileValidation(),
];

// ویرایش آدرس: فیلدها اختیاری هستند، اما در صورت ارسال باید معتبر باشند
exports.updateAddressValidator = [
  body("province")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("استان نامعتبر است"),
  body("city")
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("شهر نامعتبر است"),
  body("fullAddress")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10 })
    .withMessage("آدرس کامل باید حداقل ۱۰ کاراکتر باشد"),
  postalCodeValidation(),
  receiverMobileValidation(),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg;
    return next(new ApiError(400, message));
  }
  next();
};
