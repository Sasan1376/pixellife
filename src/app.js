const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");
const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Allow requests from the frontend.
app.use(cors());

// Serve product assets such as /images/iphone-17.webp from the public folder.
app.use(express.static(path.join(__dirname, "../public")));

// اتصال به دیتابیس
connectDB();

// Middleware
app.use(express.json());

// Routes
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/", homeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

// مسیر سلامت سرور
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "سرور در حال کار است",
    timestamp: new Date().toISOString(),
  });
});

// مدیریت مسیرهای ناموجود
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "مسیر مورد نظر یافت نشد",
  });
});

// میدلور سراسری مدیریت خطا
app.use(errorHandler);

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${env.nodeEnv} mode`);
});

module.exports = app;
