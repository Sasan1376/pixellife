const express = require("express");
const Review = require("../models/review");
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
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
