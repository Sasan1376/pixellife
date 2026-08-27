const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: String, required: true, trim: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 2000 },
  pros: { type: [String], default: [] },
  cons: { type: [String], default: [] },
  verified: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  helpful: { type: Number, default: 0 },
  reply: { type: String, default: null },
});

reviewSchema.index({ productId: 1, date: -1 });
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
