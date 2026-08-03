const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  pros: { type: [String], default: [] },
  cons: { type: [String], default: [] },
  verified: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  helpful: { type: Number, default: 0 },
  reply: { type: String, default: null },
});

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
