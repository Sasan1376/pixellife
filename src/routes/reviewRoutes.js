const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/review");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const review = await Review.create(req.body);

    // آمار محصول تنها از نظرهای واقعی ثبت‌شده در دیتابیس محاسبه می‌شود.
    const stats = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: null, count: { $sum: 1 }, rating: { $avg: "$rating" } } },
    ]);
    if (stats[0] && mongoose.isValidObjectId(review.productId)) {
      await Product.findByIdAndUpdate(review.productId, {
        reviewCount: stats[0].count,
        rating: Number(stats[0].rating.toFixed(1)),
      });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
