const express = require("express");
const router = express.Router();
const path = require("path");

const requireAdmin = require("../middleware/adminAuth");

router.get("/", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect("/admin/products");
  }
  return res.redirect("/admin/login");
});

router.get("/login", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect("/admin/products");
  }
  res.sendFile(path.join(__dirname, "../../views/admin-login.html"));
});

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!process.env.ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({
        success: false,
        message: "ADMIN_PASSWORD در .env تنظیم نشده است",
      });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  return res
    .status(401)
    .json({ success: false, message: "رمز عبور اشتباه است" });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/products", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/admin-products.html"));
});

router.get("/customers", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/admin-customers.html"));
});

module.exports = router;
