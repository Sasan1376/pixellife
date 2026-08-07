const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// دریافت همه محصولات
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// دریافت یک محصول با id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
  });

  res.json({
    success: true,
    product,
  });
});

module.exports = router;
