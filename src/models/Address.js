const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "آدرس",
    },
    province: {
      type: String,
      trim: true,
      required: [true, "استان الزامی است"],
    },
    city: {
      type: String,
      trim: true,
      required: [true, "شهر الزامی است"],
    },
    fullAddress: {
      type: String,
      trim: true,
      required: [true, "آدرس کامل الزامی است"],
    },
    postalCode: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"],
    },
    receiverName: {
      type: String,
      trim: true,
    },
    receiverMobile: {
      type: String,
      trim: true,
      match: [/^09\d{9}$/, "شماره موبایل گیرنده معتبر نیست"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Address", addressSchema);
