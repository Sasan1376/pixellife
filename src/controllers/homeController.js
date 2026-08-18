const path = require("path");
const fs = require("fs");
const ContactMessage = require("../models/ContactMessage");

const homeController = {
  index: (req, res) => {
    const indexPath = path.join(__dirname, "../../views/index.html");

    try {
      let html = fs.readFileSync(indexPath, "utf8");

      // Remove the entire Featured Products section from the homepage output.
      html = html.replace(
        /\s*<!-- ═══ PRODUCT GRID \(محصولات منتخب\) ═══ -->[\s\S]*?(?=\s*<!-- ═══ SIMPLE BANNER \(بنر ساده\) ═══ -->)/,
        "\n",
      );

      // Remove its client-side loader too, so reloads do not try to access a deleted grid.
      html = html.replace(
        /\s*\/\* ══ محصولات منتخب \(از دیتابیس واقعی\) ══ \*\/[\s\S]*?\s*loadFeaturedProducts\(\);/,
        "\n",
      );

      res.type("html").send(html);
    } catch (error) {
      console.error("Homepage render error:", error);
      res.status(500).send("خطا در بارگذاری صفحه اصلی");
    }
  },
  contact: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/contact.html"));
  },
  submitContact: async (req, res) => {
    const { name, phone, email, subject, message } = req.body || {};

    if (!name || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "لطفا همه فیلدهای ضروری را تکمیل کنید.",
      });
    }

    try {
      const savedMessage = await ContactMessage.create({
        name,
        phone,
        email: email || null,
        subject,
        message,
      });

      return res.status(201).json({
        success: true,
        message: "پیام شما با موفقیت ثبت شد.",
        data: {
          id: savedMessage._id,
        },
      });
    } catch (error) {
      console.error("Contact form save error:", error);

      return res.status(500).json({
        success: false,
        message: "خطا در ثبت پیام. دوباره تلاش کنید.",
      });
    }
  },
  mobiles: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/mobile.html"));
  },
  login: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/login.html"));
  },
  cart: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/cart.html"));
  },
  iphone: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/iphone.html"));
  },
  product: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/product.html"));
  },
  samsung: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/samsung.html"));
  },
  xiaomi: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/xiaomi.html"));
  },
  samsungtab: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/samsungtab.html"));
  },
  ipad: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/ipad.html"));
  },
  xiaomitab: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/xiaomitab.html"));
  },
  console: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/console.html"));
  },
  profile: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/profile.html"));
  },
};

module.exports = homeController;
