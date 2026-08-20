const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const upload = require("../utils/upload");
const requireAdmin = require("../middleware/adminAuth");
const demoProducts = require("../data/demoProducts");
const { removeProductImage, saveProductImage } = require("../utils/productImages");

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

function toEnglishDigits(value) {
  return String(value ?? "").replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)).replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
}
function parseVariants(value) {
  if (value === undefined) return undefined;
  if (!String(value || "").trim()) return [];
  const seen = new Set();
  return String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [rawStorage, rawColor, rawHex, rawStock, rawPrice] = line.split("|").map((item) => item.trim());
    const stock = Math.max(0, Number(toEnglishDigits(rawStock)) || 0);
    const price = rawPrice === undefined || rawPrice === "" ? undefined : Math.max(0, Number(toEnglishDigits(rawPrice)) || 0);
    const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex || "") ? rawHex : "#334155";
    return { storage: rawStorage || "", color: { name: rawColor || "", hex }, stock, ...(price !== undefined ? { price } : {}) };
  }).filter((variant) => {
    if (!variant.storage || !variant.color.name) return false;
    const key = variant.storage + "|" + variant.color.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function applyVariantInventory(data, variants) {
  if (!Array.isArray(variants) || !variants.length) return data;
  const storages = [...new Set(variants.map((item) => item.storage).filter(Boolean))];
  const colors = [...new Map(variants.map((item) => [item.color.name, item.color])).values()];
  const stock = variants.reduce((total, item) => total + Math.max(0, Number(item.stock) || 0), 0);
  return { ...data, variants, storages, colors, stock, availability: stock > 0 ? "in" : "out" };
}

function normalizeImagePath(value) {
  const image = String(value || "").trim();
  if (!image) return "";
  if (/^https?:\/\//i.test(image) || image.startsWith("data:")) return image;
  return "/" + image.replace(/^\/?(?:public\/)?/, "");
}
function parseRemovedImages(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(normalizeImagePath).filter(Boolean) : [];
  } catch (_) { return []; }
}
function serializeProduct(product) {
  const data = product.toObject ? product.toObject() : product;
  const images = (Array.isArray(data.images) ? data.images : []).map(normalizeImagePath).filter(Boolean);
  const mainImage = normalizeImagePath(data.mainImage);
  return { ...data, images, mainImage: mainImage || images[0] || "" };
}
function resolveMainImage(selection, existingImages = [], uploadedImages = []) {
  const current = (Array.isArray(existingImages) ? existingImages : []).map(normalizeImagePath).filter(Boolean);
  const incoming = (Array.isArray(uploadedImages) ? uploadedImages : []).map(normalizeImagePath).filter(Boolean);
  if (typeof selection === "string" && selection.startsWith("new:")) {
    const index = Number.parseInt(selection.slice(4), 10);
    if (Number.isInteger(index) && incoming[index]) return incoming[index];
  }
  const selected = normalizeImagePath(selection);
  if (selected && current.includes(selected)) return selected;
  return current[0] || incoming[0] || "";
}

router.use(requireAdmin);

router.post("/products/import-demo", async (req, res) => {
  try {
    const operations = demoProducts.map((product) => {
      const seedProduct = {
        ...product,
        mainImage: product.mainImage || product.images?.[0] || "",
      };
      return {
        updateOne: {
          filter: {
            $or: [{ legacyId: seedProduct.legacyId }, { slug: seedProduct.slug }],
          },
          update: { $setOnInsert: seedProduct },
          upsert: true,
        },
      };
    });
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
    res.json({ success: true, products: products.map(serializeProduct) });
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
      variants,
      mainImage: mainImageSelection,
    } = req.body;

    if (!name || !brand || !price) {
      return res
        .status(400)
        .json({ success: false, message: "نام، برند و قیمت الزامی هستند" });
    }

    const uploadedImages = await Promise.all(
      (req.files || []).map(saveProductImage),
    );

    const variantInventory = parseVariants(variants);
    const product = new Product(applyVariantInventory({
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
      mainImage: resolveMainImage(mainImageSelection, [], uploadedImages),
      colors: parseColors(colors) || [],
      storages: parseList(storages) || [],
      warranties: parseList(warranties) || [],
    }, variantInventory));

    await product.save();
    res.json({ success: true, product: serializeProduct(product) });
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
      variants,
      mainImage: mainImageSelection,
      removeImages,
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
    if (variants !== undefined) {
      const variantInventory = parseVariants(variants);
      if (variantInventory.length) {
        const normalized = applyVariantInventory({}, variantInventory);
        product.variants = normalized.variants;
        product.storages = normalized.storages;
        product.colors = normalized.colors;
        product.stock = normalized.stock;
        product.availability = normalized.availability;
      } else {
        product.variants = [];
      }
    }
    product.featured =
      featured === "true" || featured === "on" || featured === true;

    const existingImages = (Array.isArray(product.images) ? product.images : []).map(normalizeImagePath).filter(Boolean);
    const removed = new Set(parseRemovedImages(removeImages));
    const remainingImages = existingImages.filter((image) => !removed.has(image));
    const newImages = await Promise.all((req.files || []).map(saveProductImage));
    product.images = [...remainingImages, ...newImages];
    await Promise.all([...removed].map(removeProductImage));

    if (mainImageSelection !== undefined) {
      product.mainImage = resolveMainImage(mainImageSelection, remainingImages, newImages);
    } else {
      const currentMain = normalizeImagePath(product.mainImage);
      product.mainImage = product.images.includes(currentMain) ? currentMain : product.images[0] || "";
    }

    await product.save();
    res.json({ success: true, product: serializeProduct(product) });
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
    await Promise.all((product.images || []).map(removeProductImage));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
