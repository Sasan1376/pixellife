const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// =======================
// Middleware
// =======================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// فایل‌های استاتیک (تصاویر محصولات)
app.use(express.static(path.join(__dirname, "../public")));

// =======================
// اتصال MongoDB Atlas
// =======================

connectDB();

// =======================
// Routes
// =======================

const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/products");

// صفحه اصلی
app.use("/", homeRoutes);

// ثبت نام و ورود کاربران
app.use("/api/auth", authRoutes);

// نظرات محصولات
app.use("/api/reviews", reviewRoutes);

// پنل مدیریت ادمین
app.use("/admin", adminRoutes);

// محصولات فروشگاه
app.use("/api/products", productRoutes);

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

  console.log(`🌐 Admin Panel: http://localhost:${PORT}/admin`);

  console.log(`📱 Products API: http://localhost:${PORT}/api/products`);
});

module.exports = app;
