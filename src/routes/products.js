const express = require("express");
const router = express.Router();

const Product = require("../models/Product");

// =======================
// دریافت همه محصولات
// =======================

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

// =======================
// دریافت محصول با ID
// =======================

router.get("/id/:id", async (req, res) => {
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

// =======================
// دریافت محصول با Slug
// =======================

router.get("/:slug", async (req, res) => {
  console.log("SLUG ROUTE:", req.params.slug);

  try {
    const product = await Product.findOne({
      slug: req.params.slug,
    });

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

module.exports = router;
