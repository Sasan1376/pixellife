const path = require("path");
const ContactMessage = require("../models/ContactMessage");

const homeController = {
  index: (req, res) => {
    res.sendFile(path.join(__dirname, "../../views/index.html"));
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
};

module.exports = homeController;
