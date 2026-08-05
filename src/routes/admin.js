// routes/admin.js

const express = require("express");
const router = express.Router();
console.log("ADMIN ROUTE LOADED");
const Product = require("../models/Product");
const upload = require("../utils/upload");
const fs = require("fs");
const path = require("path");
// داشبورد ادمین

router.get("/", (req, res) => {
  // مسیر پوشه public را مشخص می‌کنیم تا admin.html نمایش داده شود
  res.sendFile(path.join(__dirname, "../../public/admin.html"));
});

// نمایش فرم افزودن محصول
router.get("/add-product", (req, res) => {
  res.send("فرم افزودن محصول");
});

// ذخیره محصول جدید در MongoDB
router.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.json({
      success: true,
      message: "محصول با موفقیت اضافه شد",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// دریافت کاربران
router.get("/users", (req, res) => {
  res.json({
    users: ["علی", "رضا", "سارا"],
  });
});
// نمایش همه محصولات
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// ویرایش محصول
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    res.json({
      success: true,
      message: "محصول با موفقیت ویرایش شد",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// حذف محصول
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    res.json({
      success: true,
      message: "محصول با موفقیت حذف شد",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// آپلود تصویر محصول
router.post("/products/:id/image", upload.single("image"), async (req, res) => {
  console.log("FILE:", req.file);

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "هیچ فایلی ارسال نشده است",
    });
  }

  try {
    const product = await Product.findById(req.params.id);
    console.log("ID RECEIVED:", req.params.id);
    console.log("PRODUCT:", product);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    product.images.push("/uploads/products/" + req.file.filename);

    await product.save();

    res.json({
      success: true,
      message: "تصویر اضافه شد",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// دریافت تصاویر یک محصول
router.get("/products/:id/images", async (req, res) => {
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
      images: product.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// حذف تصویر محصول
router.delete("/products/:id/images", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    const image = req.body.image;

    product.images = product.images.filter((img) => img !== image);

    const imagePath = path.join(__dirname, "../../public", image);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await product.save();

    res.json({
      success: true,
      message: "تصویر حذف شد",
      images: product.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;
