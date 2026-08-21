const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const AnalyticsDaily = require("../models/AnalyticsDaily");
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
function parseStock(value) {
  const normalized = toEnglishDigits(value).replace(/[\s,٬،]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
function normalizeAvailability(value, stock) {
  // محصول بدون تنوع فقط وقتی «موجود» است که تعداد واقعی آن مثبت باشد.
  return value === "out" ? "out" : parseStock(stock) > 0 ? "in" : "out";
}
function parseEnabled(value, fallback = true) {
  if (value === undefined) return fallback;
  return value === true || value === "true" || value === "on" || value === "1";
}

function parseVariantNumber(value, label, lineNumber) {
  const normalized = toEnglishDigits(value).replace(/[\s,٬،]/g, "");
  if (normalized === "" || !/^\d+(?:\.\d+)?$/.test(normalized)) {
    const error = new Error(`تعداد موجودی در ردیف ${lineNumber} معتبر نیست`);
    error.statusCode = 400;
    throw error;
  }
  return Math.max(0, Number(normalized));
}
function parseVariants(value) {
  if (value === undefined) return undefined;
  if (!String(value || "").trim()) return [];
  const seen = new Set();
  return String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [rawStorage, rawColor, rawHex, rawStock, rawPrice] = line.split("|").map((item) => item.trim());
    if (!rawStorage || !rawColor || rawStock === undefined) {
      const error = new Error(`ردیف ${index + 1} تنوع ناقص است؛ حافظه، رنگ و تعداد را کامل کنید`);
      error.statusCode = 400;
      throw error;
    }
    const stock = parseVariantNumber(rawStock, "موجودی", index + 1);
    const price = rawPrice === undefined || rawPrice === "" ? undefined : parseVariantNumber(rawPrice, "قیمت", index + 1);
    const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex || "") ? rawHex : "#334155";
    const key = rawStorage + "|" + rawColor;
    if (seen.has(key)) {
      const error = new Error(`ترکیب حافظه و رنگ در ردیف ${index + 1} تکراری است`);
      error.statusCode = 400;
      throw error;
    }
    seen.add(key);
    return { storage: rawStorage, color: { name: rawColor, hex }, stock, ...(price !== undefined ? { price } : {}) };
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
function uploadedFiles(req, field) {
  if (Array.isArray(req.files)) return field === "images" ? req.files : [];
  return Array.isArray(req.files?.[field]) ? req.files[field] : [];
}
function parseReviewSections(value, uploadedImages = []) {
  if (!value) return [];
  try {
    const sections = JSON.parse(value);
    if (!Array.isArray(sections)) return [];
    return sections.map((section) => {
      const imageSizes = Array.isArray(section?.imageSizes) ? section.imageSizes : [];
      const images = (Array.isArray(section?.images) ? section.images : []).map((image, index) => {
        const match = String(image || "").match(/^new:(\d+)$/);
        const src = match ? uploadedImages[Number(match[1])] || "" : normalizeImagePath(image);
        const size = ["small", "medium", "large", "full"].includes(imageSizes[index]) ? imageSizes[index] : "large";
        return src ? { src, size } : null;
      }).filter(Boolean);
      return {
        enabled: section?.enabled !== false,
        title: String(section?.title || "").trim(),
        content: String(section?.content || "").trim(),
        images: images.map((image) => image.src),
        imageSizes: images.map((image) => image.size),
      };
    }).filter((section) => section.title || section.content || section.images.length);
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
router.use((req, res, next) => { res.set("Cache-Control", "no-store, no-cache, must-revalidate, private"); next(); });

function analyticsDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
router.get("/analytics/overview", async (req, res) => {
  try {
    const today = analyticsDateKey(new Date());
    const from = analyticsDateKey(new Date(Date.now() - 29 * 86400000));
    const stats = async (start) => {
      const [row] = await AnalyticsDaily.aggregate([{ $match:{date:{$gte:start,$lte:today}} },{$group:{_id:null,views:{$sum:"$views"},sets:{$push:"$visitors"}}},{$project:{_id:0,views:1,uniqueVisitors:{$size:{$reduce:{input:"$sets",initialValue:[],in:{$setUnion:["$value","$this"]}}}}}}]);
      return row || { views:0, uniqueVisitors:0 };
    };
    const [todayStats,week,month,topPages] = await Promise.all([stats(today),stats(analyticsDateKey(new Date(Date.now()-6*86400000))),stats(from),AnalyticsDaily.aggregate([{$match:{date:{$gte:from,$lte:today}}},{$group:{_id:"$page",views:{$sum:"$views"}}},{$sort:{views:-1}},{$limit:8}])]);
    res.json({success:true,today:todayStats,week,month,topPages:topPages.map(x=>({page:x._id,views:x.views}))});
  } catch (_) { res.status(500).json({success:false,message:"دریافت آمار بازدید ناموفق بود"}); }
});

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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post("/products", upload.fields([{ name: "images", maxCount: 5 }, { name: "reviewImages", maxCount: 20 }]), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      discount,
      description,
      specs,
      showSpecs,
      featured,
      stock,
      availability,
      colors,
      storages,
      hasStorage,
      warranties,
      hasWarranty,
      variants,
      showReview,
      reviewSections,
      mainImage: mainImageSelection,
    } = req.body;

    if (!name || !brand || !price) {
      return res
        .status(400)
        .json({ success: false, message: "نام، برند و قیمت الزامی هستند" });
    }

    const uploadedImages = await Promise.all(
      uploadedFiles(req, "images").map(saveProductImage),
    );

    const storageEnabled = parseEnabled(hasStorage);
    const warrantyEnabled = parseEnabled(hasWarranty);
    const specsEnabled = parseEnabled(showSpecs);
    const uploadedReviewImages = await Promise.all(uploadedFiles(req, "reviewImages").map(saveProductImage));
    const variantInventory = storageEnabled ? parseVariants(variants) : [];
    const rootStock = parseStock(stock);
    const product = new Product(applyVariantInventory({
      name,
      brand,
      category: category || "عمومی",
      price: Number(price),
      discount: Number(discount) || 0,
      description,
      specs: specsEnabled ? specs : "",
      showSpecs: specsEnabled,
      featured: featured === "true" || featured === "on" || featured === true,
      stock: rootStock,
      availability: normalizeAvailability(availability, rootStock),
      images: uploadedImages,
      mainImage: resolveMainImage(mainImageSelection, [], uploadedImages),
      colors: parseColors(colors) || [],
      storages: storageEnabled ? parseList(storages) || [] : [],
      hasStorage: storageEnabled,
      showReview: parseEnabled(showReview, false),
      reviewSections: parseReviewSections(reviewSections, uploadedReviewImages),
      warranties: warrantyEnabled ? parseList(warranties) || [] : [],
      hasWarranty: warrantyEnabled,
    }, variantInventory));

    await product.save();
    res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.put("/products/:id", upload.fields([{ name: "images", maxCount: 5 }, { name: "reviewImages", maxCount: 20 }]), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      discount,
      description,
      specs,
      showSpecs,
      featured,
      stock,
      availability,
      colors,
      storages,
      hasStorage,
      warranties,
      hasWarranty,
      variants,
      showReview,
      reviewSections,
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
    if (showSpecs !== undefined) product.showSpecs = parseEnabled(showSpecs);
    if (specs !== undefined && product.showSpecs !== false) product.specs = specs;
    if (showReview !== undefined) product.showReview = parseEnabled(showReview, false);
    if (stock !== undefined) product.stock = parseStock(stock);
    if (stock !== undefined || availability !== undefined) {
      product.availability = normalizeAvailability(
        availability !== undefined ? availability : product.availability,
        product.stock,
      );
    }
    if (colors !== undefined) product.colors = parseColors(colors);
    if (hasStorage !== undefined) product.hasStorage = parseEnabled(hasStorage);
    if (storages !== undefined && product.hasStorage !== false) product.storages = parseList(storages);
    if (hasWarranty !== undefined) product.hasWarranty = parseEnabled(hasWarranty);
    if (warranties !== undefined && product.hasWarranty !== false) product.warranties = parseList(warranties);
    if (variants !== undefined && product.hasStorage !== false) {
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
    if (product.hasStorage === false) {
      product.storages = [];
      product.variants = [];
    }
    if (product.hasWarranty === false) product.warranties = [];
    if (product.showSpecs === false) product.specs = "";
    product.featured =
      featured === "true" || featured === "on" || featured === true;

    const existingImages = (Array.isArray(product.images) ? product.images : []).map(normalizeImagePath).filter(Boolean);
    const removed = new Set(parseRemovedImages(removeImages));
    const remainingImages = existingImages.filter((image) => !removed.has(image));
    const newImages = await Promise.all(uploadedFiles(req, "images").map(saveProductImage));
    const uploadedReviewImages = await Promise.all(uploadedFiles(req, "reviewImages").map(saveProductImage));
    if (reviewSections !== undefined) product.reviewSections = parseReviewSections(reviewSections, uploadedReviewImages);
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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// Customers: only non-admin accounts are returned. Passwords, national codes and
// saved addresses are deliberately never selected for the management table.
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim();
    const filter = { role: { $ne: "admin" } };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { mobile: { $regex: escaped } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("firstName lastName mobile email nationalCode birthDate isVerified isActive lastLogin createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "وضعیت حساب معتبر نیست" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $ne: "admin" } },
      { $set: { isActive: req.body.isActive } },
      { new: true },
    ).select("firstName lastName mobile email nationalCode birthDate isVerified isActive lastLogin createdAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "مشتری پیدا نشد" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.orderNumber = { $regex: String(req.query.search).trim(), $options: "i" };
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).populate("user", "firstName lastName mobile").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    res.json({ success: true, orders, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const allowed = ["awaiting_payment", "processing", "shipped", "delivered", "cancelled"];
    const status = String(req.body.status || "");
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "وضعیت سفارش معتبر نیست" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "سفارش پیدا نشد" });
    order.status = status; order.statusHistory.push({ status, note: "وضعیت توسط ادمین تغییر کرد" }); await order.save();
    res.json({ success: true, order });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
