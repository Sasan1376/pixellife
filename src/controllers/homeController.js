const path = require("path");
const fs = require("fs");
const ContactMessage = require("../models/ContactMessage");

const homeController = {
  index: (req, res) => {
    const indexPath = path.join(__dirname, "../../views/index.html");

    try {
      let html = fs.readFileSync(indexPath, "utf8");

      // Remove the old dynamic Featured Products section from the homepage output.
      html = html.replace(
        /\s*<!-- ═══ PRODUCT GRID \(محصولات منتخب\) ═══ -->[\s\S]*?(?=\s*<!-- ═══ SIMPLE BANNER \(بنر ساده\) ═══ -->)/,
        "\n",
      );

      // Remove its old client-side loader so reloads stay stable.
      html = html.replace(
        /\s*\/\* ══ محصولات منتخب \(از دیتابیس واقعی\) ══ \*\/[\s\S]*?\s*loadFeaturedProducts\(\);/,
        "\n",
      );

      // Add one stable, static featured-products row. No extra JS, timers or observers.
      const featuredProductsSection = `
      <!-- ═══ FEATURED PRODUCTS (محصولات منتخب ثابت) ═══ -->
      <section class="product-section" aria-labelledby="featuredProductsTitle">
        <div class="section-header">
          <h2 id="featuredProductsTitle">محصولات منتخب</h2>
          <a href="/mobiles" class="see-all-btn">مشاهده همه</a>
        </div>

        <style>
          .featured-static-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 14px;
          }
          .featured-static-grid .product-card img {
            height: 150px;
          }
          @media (max-width: 1100px) {
            .featured-static-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (max-width: 640px) {
            .featured-static-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
        </style>

        <div class="featured-static-grid">
          <a href="/product.html?id=iphone-17" class="product-card">
            <img src="/images/apple/iphone 17-3.webp" alt="iPhone 17" loading="lazy" />
            <h3>iPhone 17</h3>
          </a>

          <a href="/product.html?id=iphone-17-pro" class="product-card">
            <img src="/images/apple/17pro.webp" alt="iPhone 17 Pro" loading="lazy" />
            <h3>iPhone 17 Pro</h3>
          </a>

          <a href="/product.html?id=iphone-17-pro-max" class="product-card">
            <img src="/images/apple/iphone-17.webp" alt="iPhone 17 Pro Max" loading="lazy" />
            <h3>iPhone 17 Pro Max</h3>
          </a>

          <a href="/product.html?id=samsung-galaxy-a56" class="product-card">
            <img src="/images/samsung/a56.webp" alt="Samsung Galaxy A56" loading="lazy" />
            <h3>Samsung Galaxy A56</h3>
          </a>

          <a href="/product.html?id=samsung-galaxy-s25-fe" class="product-card">
            <img src="/images/samsung/s25fe.webp" alt="Samsung Galaxy S25 FE" loading="lazy" />
            <h3>Samsung Galaxy S25 FE</h3>
          </a>

          <a href="/product.html?id=samsung-galaxy-a26" class="product-card">
            <img src="/images/samsung/a26.webp" alt="Samsung Galaxy A26" loading="lazy" />
            <h3>Samsung Galaxy A26</h3>
          </a>
        </div>
      </section>
`;

      html = html.replace(
        /\s*(<!-- ═══ SIMPLE BANNER \(بنر ساده\) ═══ -->)/,
        `\n${featuredProductsSection}\n      $1`,
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
