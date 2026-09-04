const mongoose = require("mongoose");
const Review = require("../models/review");
const Product = require("../models/Product");

/**
 * تنها منبع معتبر امتیاز عمومی محصول.
 * فقط نظرهای تأییدشده وارد محاسبه می‌شوند و مقدار صفر هم صریحاً ذخیره می‌شود.
 */
async function refreshProductReviewStats(productId) {
  const normalizedId = String(productId || "").trim();
  if (!normalizedId) return null;

  const stats = await Review.aggregate([
    { $match: { productId: normalizedId, status: "approved" } },
    { $group: { _id: null, count: { $sum: 1 }, rating: { $avg: "$rating" } } },
  ]);

  const filter = mongoose.isValidObjectId(normalizedId)
    ? { $or: [{ _id: normalizedId }, { slug: normalizedId }, { legacyId: normalizedId }] }
    : { $or: [{ slug: normalizedId }, { legacyId: normalizedId }] };

  return Product.findOneAndUpdate(
    filter,
    {
      $set: {
        reviewCount: stats[0]?.count || 0,
        rating: stats[0] ? Number(stats[0].rating.toFixed(1)) : 0,
      },
    },
    { new: true },
  );
}

async function refreshAllProductReviewStats() {
  const productIds = await Review.distinct("productId", { productId: { $exists: true, $ne: "" } });
  for (const productId of productIds) {
    await refreshProductReviewStats(productId);
  }
  return productIds.length;
}

module.exports = { refreshProductReviewStats, refreshAllProductReviewStats };
