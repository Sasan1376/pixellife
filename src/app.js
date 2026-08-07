const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const { SitemapStream, streamToPromise } = require("sitemap");
const Product = require("./models/product");
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

// =======================
// Static Files
// =======================

app.use(express.static(path.join(__dirname, "../public")));

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
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/products");

// Home
app.use("/", homeRoutes);

// Authentication
app.use("/api/auth", authRoutes);

// Reviews
app.use("/api/reviews", reviewRoutes);

// Admin Panel
app.use("/admin", adminRoutes);

// Products API
app.use("/api/products", productRoutes);

// Public
app.use(express.static("public"));

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
      console.log("Product:", product.name);

      sitemap.write({
        url: `/product/${product._id}`,
        changefreq: "weekly",
        priority: 0.8,
      });
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

  console.log(`🌐 Admin Panel: http://localhost:${PORT}/admin`);

  console.log(`📱 Products API: http://localhost:${PORT}/api/products`);
});
