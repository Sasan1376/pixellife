const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).select("slug");
    if (!product) return res.status(404).send("محصول پیدا نشد");
    return res.redirect(302, `/product?id=${encodeURIComponent(product.slug)}`);
  } catch (_) {
    return res.status(500).send("خطا در بارگذاری محصول");
  }
});
module.exports = router;
