const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const session = require("express-session");
const connectDB = require("./db");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const { SitemapStream, streamToPromise } = require("sitemap");

const Product = require("./models/Product");

const app = express();

// =======================
// Middleware
// =======================

app.use(cors());

app.use(express.json());
app.use(cookieParser());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// فایل‌های استاتیک (تصاویر محصولات و لوگو)
app.use(express.static(path.join(__dirname, "../public")));
// فایل‌های استاتیک قالب AdminLTE (فقط برای پنل ادمین)
app.use(
  "/vendor/adminlte",
  express.static(path.join(__dirname, "../node_modules/admin-lte/dist")),
);

// سشن برای ورود ادمین
app.use(
  session({
    secret: process.env.SESSION_SECRET || "pixellife-admin-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      httpOnly: true,
    },
  }),
);
// =======================
// Maintenance Mode (حالت بروزرسانی هوشمند)
// =======================

app.use((req, res, next) => {
  // ۱. اجازه دسترسی به پنل ادمین، API ها و فایل‌های استاتیک (عکس، CSS، JS)
  if (
    req.path.startsWith("/admin") ||
    req.path.startsWith("/api") ||
    req.path === "/contact" ||
    req.path === "/support" ||
    /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$/.test(req.path)
  ) {
    return next();
  }

  // ۲. آدرس مخفی برای شما: اگر وارد آدرس pixellife.ir/?bypass=sasan1376 شدید
  if (req.query.bypass === "sasan1376") {
    // یک کوکی برای ۷ روز در مرورگر شما ذخیره می‌شود
    res.cookie("maintenance_bypass", "sasan1376", {
      maxAge: 604800000, // ۷ روز به میلی‌ثانیه
      httpOnly: true,
    });
    return next(); // اجازه دیدن سایت
  }

  // ۳. اگر کوکی در مرورگر وجود داشت (یعنی قبلا آدرس مخفی را زده‌اید)
  if (req.cookies && req.cookies.maintenance_bypass === "sasan1376") {
    return next(); // اجازه دیدن سایت
  }

  // ۴. برای بقیه مردم، صفحه بروزرسانی را نشان بده
  return res.send(`
    <!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>در حال بروزرسانی | پیکسل لایف</title>
        <style>body { overflow: hidden !important; height: 100vh !important; margin: 0; }</style>
      </head>
      <body>
        <div style="position: fixed; inset: 0; background: #f8fafc; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: Tahoma, sans-serif; text-align: center; padding: 20px;">
          <div style="background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 450px; border: 1px solid #e2e8f0;">
            <img src="/images/maintenance.png?v=4" alt="PixelLife" style="width: 120px; height: 120px; margin-bottom: 24px; object-fit: contain;">
            <h1 style="color: #3b82f6; font-size: 24px; font-weight: 800; margin-bottom: 16px;">سایت در حال بروزرسانی است</h1>
            <p style="color: #334155; font-size: 15px; line-height: 1.8; margin-bottom: 0;">
              تیم پیکسل‌لایف در حال بهبود و تکمیل فروشگاه است.<br>
              خیلی زود با تجربه‌ای بهتر برمی‌گردیم!
            </p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// =======================
// MongoDB Connection
// =======================

connectDB();

// =======================
// Routes
// =======================

const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const adminApiRoutes = require("./routes/adminApi");
const productRoutes = require("./routes/products");
const productPageRoutes = require("./routes/productPage");
const testEmailRoutes = require("./routes/testEmail");

// Home Page
app.use("/", homeRoutes);
// Contact Page (تماس با ما)
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/contact.html"));
});
// Authentication
app.use("/api/auth", authRoutes);

// Reviews
app.use("/api/reviews", reviewRoutes);

// Addresses (آدرس‌های کاربر)
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);

// Admin Panel
app.use("/admin/api", adminApiRoutes);
app.use("/admin", adminRoutes);
// Products API
app.use("/api/products", productRoutes);

// Product SEO Pages
app.use("/product", productPageRoutes);

// Test Email (موقت — بعد از تایید کارکرد حذف شود)
app.use("/api/test-email", testEmailRoutes);

// =======================
// Sitemap
// =======================

app.get("/sitemap.xml", async (req, res) => {
  try {
    const sitemap = new SitemapStream({
      hostname: "https://pixellife.ir",
    });

    // صفحه اصلی
    sitemap.write({
      url: "/",
      changefreq: "daily",
      priority: 1,
    });

    // محصولات MongoDB
    const products = await Product.find({});

    console.log("Sitemap Products:", products.length);

    products.forEach((product) => {
      if (product.slug) {
        sitemap.write({
          url: `/product/${product.slug}`,
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    });

    sitemap.end();

    const xml = await streamToPromise(sitemap);

    res.header("Content-Type", "application/xml");

    res.send(xml.toString());
  } catch (error) {
    console.error("Sitemap Error:", error);

    res.status(500).send("Sitemap generation failed");
  }
});

// =======================
// Health Check
// =======================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "سرور PixelLife فعال است",
    timestamp: new Date().toISOString(),
  });
});

// =======================
// 404 Handler
// =======================

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "مسیر مورد نظر پیدا نشد",
  });
});

// =======================
// Error Handler
// =======================

app.use(errorHandler);

// =======================
// Start Server
// =======================

const PORT = env.port || 3000;

app.listen(PORT, () => {
  console.log(`✅ PixelLife Server running on port ${PORT}`);
  console.log(`📱 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🛒 Product Pages: http://localhost:${PORT}/product/:slug`);
});
