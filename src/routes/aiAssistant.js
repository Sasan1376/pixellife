const express = require("express");
const Product = require("../models/Product");
const env = require("../config/env");

const router = express.Router();
const MAX_MESSAGE_LENGTH = 800;
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeProduct(product) {
  return {
    id: String(product._id),
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    discount: product.discount || 0,
    availability: product.availability,
    stock: product.stock || 0,
    description: product.description || "",
    specifications: product.specs || "",
    colors: product.colors || [],
    storages: product.storages || [],
    slug: product.slug,
  };
}

function extractBudget(message) {
  const normalized = String(message).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  const match = normalized.match(/(?:تا|زیر|حدود)\s*([\d,\.]+)\s*(میلیون|m)?/i);
  if (!match) return null;
  const value = Number(match[1].replace(/[,.]/g, ""));
  return Number.isFinite(value) ? (match[2] ? value * 1000000 : value) : null;
}

async function findRelevantProducts(message) {
  const text = String(message).trim();
  const budget = extractBudget(text);
  const keywords = text.split(/\s+/).map(escapeRegex).filter((word) => word.length > 2).slice(0, 8);
  const conditions = keywords.map((word) => ({
    $or: [
      { name: { $regex: word, $options: "i" } },
      { brand: { $regex: word, $options: "i" } },
      { category: { $regex: word, $options: "i" } },
      { description: { $regex: word, $options: "i" } },
      { specs: { $regex: word, $options: "i" } },
    ],
  }));
  const filter = conditions.length ? { $or: conditions } : {};
  if (budget) filter.price = { $lte: budget };
  const products = await Product.find(filter).sort({ featured: -1, rating: -1, updatedAt: -1 }).limit(8).lean();
  if (products.length) return products;
  return Product.find(budget ? { price: { $lte: budget } } : {}).sort({ featured: -1, rating: -1 }).limit(8).lean();
}

function fallbackAnswer(products) {
  if (!products.length) return "در حال حاضر محصولی مطابق درخواست شما پیدا نکردم. لطفاً برند، دسته‌بندی یا بودجه را دقیق‌تر بنویسید.";
  const names = products.slice(0, 3).map((p) => p.name).join("، ");
  return `بر اساس اطلاعات فعلی سایت، این محصولات می‌توانند مناسب باشند: ${names}. برای پیشنهاد دقیق‌تر، کاربرد اصلی و بودجه خود را بنویسید.`;
}

router.post("/shopping-assistant", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "پیام خالی است" });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ success: false, message: "پیام بیش از حد طولانی است" });

    const products = await findRelevantProducts(message);
    const productContext = products.map(normalizeProduct);
    const apiKey = env.openaiApiKey;
    if (!apiKey) {
      return res.json({ success: true, answer: fallbackAnswer(products), products: productContext, aiEnabled: false });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          { role: "system", content: "تو دستیار خرید فارسی PixelLife هستی. فقط بر اساس فهرست محصولات داده‌شده پاسخ بده؛ قیمت، موجودی و مشخصات را حدس نزن. پاسخ کوتاه، صمیمی و کاربردی باشد. اگر اطلاعات کافی نیست سؤال تکمیلی بپرس." },
          { role: "user", content: `درخواست کاربر: ${message}\n\nمحصولات موجود سایت:\n${JSON.stringify(productContext)}` },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "خطا در ارتباط با OpenAI");
    res.json({ success: true, answer: data.choices?.[0]?.message?.content || fallbackAnswer(products), products: productContext, aiEnabled: true });
  } catch (error) {
    console.error("Shopping assistant error:", error.message);
    res.status(500).json({ success: false, message: "دستیار خرید موقتاً در دسترس نیست" });
  }
});

module.exports = router;
