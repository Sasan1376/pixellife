const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const upload = require("../utils/upload");
const requireAdmin = require("../middleware/adminAuth");
const demoProducts = require("../data/demoProducts");

function parseList(value) {
  if (value === undefined) return undefined;
  return String(value || "")
    .split(/\r?\n|،|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseColors(value) {
  if (value === undefined) return undefined;
  if (!value || !String(value).trim()) return [];

  return String(value)
    .split(/\r?\n|،|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, rawHex] = line.split("|").map((item) => item.trim());
      const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex || "")
        ? rawHex
        : "#334155";
      return { name: rawName || "رنگ", hex };
    });
}

router.use(requireAdmin);

router.post("/products/import-demo", async (req, res) => {
  try {
    const operations = demoProducts.map((product) => ({
      updateOne: {
        filter: { $or: [{ legacyId: product.legacyId }, { slug: product.slug }] },
        update: { $setOnInsert: product },
        upsert: true,
      },
    }));
    const result = await Product.bulkWrite(operations, { ordered: false });
    res.json({
      success: true,
      inserted: result.upsertedCount || 0,
      existing: demoProducts.length - (result.upsertedCount || 0),
      total: demoProducts.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      discount,
      description,
      specs,
      featured,
      stock,
      availability,
      colors,
      storages,
      warranties,
    } = req.body;

    if (!name || !brand || !price) {
      return res
        .status(400)
        .json({ success: false, message: "نام، برند و قیمت الزامی هستند" });
    }

    const uploadedImages = (req.files || []).map(
      (f) => "/uploads/products/" + f.filename,
    );

    const product = new Product({
      name,
      brand,
      category: category || "عمومی",
      price: Number(price),
      discount: Number(discount) || 0,
      description,
      specs,
      featured: featured === "true" || featured === "on" || featured === true,
      stock: Number(stock) || 0,
      availability: availability || "in",
      images: uploadedImages,
      colors: parseColors(colors) || [],
      storages: parseList(storages) || [],
      warranties: parseList(warranties) || [],
    });

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      discount,
      description,
      specs,
      featured,
      stock,
      availability,
      colors,
      storages,
      warranties,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "محصول پیدا نشد" });
    }

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (price) product.price = Number(price);
    if (discount !== undefined) product.discount = Number(discount) || 0;
    if (description !== undefined) product.description = description;
    if (specs !== undefined) product.specs = specs;
    if (stock !== undefined) product.stock = Number(stock) || 0;
    if (availability) product.availability = availability;
    if (colors !== undefined) product.colors = parseColors(colors);
    if (storages !== undefined) product.storages = parseList(storages);
    if (warranties !== undefined) product.warranties = parseList(warranties);
    product.featured =
      featured === "true" || featured === "on" || featured === true;

    const newImages = (req.files || []).map(
      (f) => "/uploads/products/" + f.filename,
    );
    if (newImages.length > 0) {
      product.images = [...(product.images || []), ...newImages];
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "محصول پیدا نشد" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
