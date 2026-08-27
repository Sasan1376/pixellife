const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/review");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/upload");
const { saveProductImage } = require("../utils/productImages");

const router = express.Router();

function publicReview(review) {
  return {
    id: review._id,
    userName: review.userName,
    avatar: review.avatar || "",
    rating: review.rating,
    comment: review.comment,
    pros: review.pros || [],
    cons: review.cons || [],
    verified: review.verified,
    date: review.date,
    helpful: review.helpful || 0,
    reply: review.reply || null,
  };
}

router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: String(req.params.productId), status: "approved" })
      .sort({ date: -1 })
      .lean();
    res.json({ success: true, reviews: reviews.map(publicReview) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", protect, upload.single("avatar"), async (req, res) => {
  try {
    const { productId, rating, comment, pros, cons } = req.body || {};
    const normalizedProductId = String(productId || "").trim();
    const normalizedComment = String(comment || "").trim();
    const numericRating = Number(rating);

    if (!normalizedProductId || !normalizedComment || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, error: "اطلاعات نظر کامل و معتبر نیست" });
    }

    const userName = [req.user.firstName, req.user.lastName].filter(Boolean).join(" ").trim()
      || req.user.mobile
      || "کاربر پیکسل‌لایف";

    let avatar = req.user.avatar || "";
    if (req.file) {
      avatar = await saveProductImage(req.file);
      req.user.avatar = avatar;
      await req.user.save({ validateBeforeSave: false });
    }

    const review = await Review.create({
      productId: normalizedProductId,
      userId: req.user._id,
      userName,
      avatar,
      rating: numericRating,
      comment: normalizedComment,
      pros: Array.isArray(pros) ? pros.map((item) => String(item).trim()).filter(Boolean) : [],
      cons: Array.isArray(cons) ? cons.map((item) => String(item).trim()).filter(Boolean) : [],
      verified: false,
      status: "pending",
    });

    const stats = await Review.aggregate([
      { $match: { productId: normalizedProductId, status: "approved" } },
      { $group: { _id: null, count: { $sum: 1 }, rating: { $avg: "$rating" } } },
    ]);

    const productFilter = mongoose.isValidObjectId(normalizedProductId)
      ? { $or: [{ _id: normalizedProductId }, { slug: normalizedProductId }, { legacyId: normalizedProductId }] }
      : { $or: [{ slug: normalizedProductId }, { legacyId: normalizedProductId }] };

    if (stats[0]) {
      await Product.findOneAndUpdate(productFilter, {
        reviewCount: stats[0].count,
        rating: Number(stats[0].rating.toFixed(1)),
      });
    }

    res.status(201).json({ success: true, review: publicReview(review) });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, error: "شما قبلاً برای این محصول نظر ثبت کرده‌اید" });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
