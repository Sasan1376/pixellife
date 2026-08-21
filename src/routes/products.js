const express = require("express");
const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store, no-cache, must-revalidate, private"); next(); });
const Product = require("../models/Product");
const { streamProductImage } = require("../utils/productImages");

function toBoolean(value) {
  return value === true || value === "true" || value === "1";
}
function safeLimit(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return !Number.isFinite(parsed) || parsed <= 0 ? fallback : Math.min(parsed, 100);
}

function normalizeImagePath(value) {
  const image = String(value || "").trim();
  if (!image) return "";
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image;
  return "/" + image.replace(/^\/?(?:public\/)?/, "");
}
function serializeProduct(product) {
  const data = product.toObject ? product.toObject() : product;
  const images = (Array.isArray(data.images) ? data.images : []).map(normalizeImagePath).filter(Boolean);
  const mainImage = normalizeImagePath(data.mainImage);
  return { ...data, images, mainImage: mainImage || images[0] || "" };
}

router.get("/image/:id", (req, res) => {
  try {
    if (!streamProductImage(req.params.id, res)) return res.status(404).end();
  } catch (_) {
    if (!res.headersSent) res.status(404).end();
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = {};
    const { brand, category, featured, exclude, limit, sort } = req.query;
    if (brand) {
      const brandAliases = {
        "اپل": "اپل|apple",
        "apple": "اپل|apple",
        "سامسونگ": "سامسونگ|samsung",
        "samsung": "سامسونگ|samsung",
        "شیائومی": "شیائومی|xiaomi",
        "xiaomi": "شیائومی|xiaomi",
      };
      const requestedBrand = String(brand).trim().toLowerCase();
      filter.brand = {
        $regex: brandAliases[requestedBrand] || String(brand).trim(),
        $options: "i",
      };
    }
    // دسته باید دقیقاً برابر باشد؛ وگرنه فیلتر «موبایل» به اشتباه
    // «لوازم جانبی موبایل» را هم برمی‌گرداند.
    if (category) filter.category = String(category).trim();
    if (featured !== undefined) filter.featured = toBoolean(featured);
    if (exclude) filter._id = { $ne: exclude };
    const order = sort === "price-asc" ? { price: 1 } : sort === "price-desc" ? { price: -1 } : { featured: -1, createdAt: -1 };
    let query = Product.find(filter).sort(order).lean();
    const requestedLimit = safeLimit(limit);
    if (requestedLimit) query = query.limit(requestedLimit);
    const products = await query;
    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/id/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, message: "محصول پیدا نشد" });
    res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const requestedSlug = String(req.params.slug || "").trim();
    const alternatives = [{ slug: requestedSlug }, { legacyId: requestedSlug }];
    // iPhone 17 نخستین محصول نمایشی سایت بوده است. برخی نسخه‌های قدیمی آن
    // بدون legacyId/slug درست ذخیره شده‌اند؛ آخرین رکورد ویرایش‌شده ادمین مرجع است.
    if (requestedSlug === "iphone-17") {
      alternatives.push({ name: { $regex: "^iPhone\\s*17$", $options: "i" } });
    }
    const product = await Product.findOne({ $or: alternatives })
      .sort({ updatedAt: -1 })
      .lean();
    if (!product) return res.status(404).json({ success: false, message: "محصول پیدا نشد" });
    res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
