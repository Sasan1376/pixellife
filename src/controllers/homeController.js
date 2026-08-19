const path = require("path");
const fs = require("fs");
const ContactMessage = require("../models/ContactMessage");

const ENAMAD_URL =
  "https://trustseal.enamad.ir/?id=7320810&Code=NumFm2BnHAPz2uqVZohNfj7I6jfqOEE5";
const ENAMAD_LOGO =
  "https://trustseal.enamad.ir/logo.aspx?id=7320810&Code=NumFm2BnHAPz2uqVZohNfj7I6jfqOEE5";

const ENAMAD_STYLE = `
<style id="shared-enamad-style">
  .ftrust-enamad {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    min-width: 120px;
    padding: 6px;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius-sm, 8px);
    background: var(--bg, #f8fafc);
    box-sizing: border-box;
  }
  .ftrust-enamad img {
    max-width: 100%;
    max-height: 48px;
    height: auto;
    width: auto;
    object-fit: contain;
    display: block;
  }
  .standalone-enamad-wrap {
    display: flex;
    justify-content: center;
    max-width: 1200px;
    margin: 22px auto;
    padding: 0 20px;
  }
</style>`;

const ENAMAD_HTML = `
<a
  referrerpolicy="origin"
  target="_blank"
  rel="noopener"
  href="${ENAMAD_URL}"
  class="ftrust-enamad"
  title="نماد اعتماد الکترونیکی"
>
  <img
    referrerpolicy="origin"
    src="${ENAMAD_LOGO}"
    alt="نماد اعتماد الکترونیکی"
    width="120"
    height="50"
    style="cursor: pointer; display: block; max-height: 48px; width: auto;"
  />
</a>`;

const MOBILE_HERO_FIX = `
<style id="mobile-hero-fit-fix">
  @media (max-width: 768px) {
    .hero-section {
      margin-bottom: 22px !important;
    }

    .hero-slider-container {
      height: auto !important;
      aspect-ratio: 1136 / 400;
      min-height: 0 !important;
      border-radius: 14px !important;
    }

    .hero-slider-track {
      height: 100% !important;
    }

    .hero-slide {
      height: 100% !important;
      min-height: 0 !important;
      padding: 0 !important;
      align-items: stretch !important;
    }

    .hero-slide img {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      object-fit: cover !important;
      object-position: center !important;
    }

    .hero-nav-btn {
      width: 32px !important;
      height: 32px !important;
    }

    .hero-nav-btn.prev {
      right: 8px !important;
    }

    .hero-nav-btn.next {
      left: 8px !important;
    }

    .hero-dots {
      bottom: 8px !important;
    }

    .hero-dot {
      width: 7px !important;
      height: 7px !important;
    }

    .hero-dot.active {
      width: 20px !important;
    }
  }
</style>`;

const PROFILE_DROPDOWN_LAYER_FIX = `
<style id="profile-dropdown-layer-fix">
  .header {
    z-index: 1400 !important;
  }

  .profile-wrapper {
    z-index: 1500 !important;
  }

  .profile-dropdown {
    z-index: 1600 !important;
  }

  .navbar {
    z-index: 700 !important;
  }
</style>`;

const SHARED_CATEGORY_HEAD = `
<link rel="stylesheet" href="/css/shared-category-nav.css?v=1" />`;
const SHARED_CATEGORY_SCRIPT = `
<script src="/js/shared-category-nav.js?v=1"></script>`;

const MOBILE_BOTTOM_NAV_HEAD = `
<link rel="stylesheet" href="/css/mobile-bottom-nav.css?v=4" />`;
const MOBILE_BOTTOM_NAV_SCRIPT = `
<script src="/js/mobile-bottom-nav.js?v=6"></script>`;
const MOBILE_BOTTOM_NAV_HTML = `
<nav class="mobile-bottom-nav" aria-label="ناوبری اصلی موبایل">
  <a class="mobile-bottom-nav__item" data-nav="home" href="/" aria-label="خانه">
    <svg class="mobile-bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/></svg>
    <span>خانه</span>
  </a>
  <a class="mobile-bottom-nav__item" data-nav="categories" href="/categories" aria-label="دسته‌بندی‌ها">
    <svg class="mobile-bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>
    <span>دسته‌بندی‌ها</span>
  </a>
  <a class="mobile-bottom-nav__item" data-nav="cart" href="/cart" aria-label="سبد خرید">
    <svg class="mobile-bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
    <span class="mobile-bottom-nav__badge" data-mobile-cart-count>0</span>
    <span>سبد خرید</span>
  </a>
  <a class="mobile-bottom-nav__item" data-nav="account" href="/profile" aria-label="حساب کاربری">
    <svg class="mobile-bottom-nav__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.2-6 8-6s7.3 2 8 6"/></svg>
    <span>حساب کاربری</span>
  </a>
</nav>`;

function injectMobileBottomNav(html) {
  if (!html || html.includes('class="mobile-bottom-nav"')) return html;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${MOBILE_BOTTOM_NAV_HEAD}\n</head>`);
  }

  if (html.includes("</body>")) {
    html = html.replace(
      "</body>",
      `${MOBILE_BOTTOM_NAV_HTML}\n${MOBILE_BOTTOM_NAV_SCRIPT}\n</body>`,
    );
  }

  return html;
}

function injectEnamad(html) {
  if (!html || html.includes("trustseal.enamad.ir")) return html;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${ENAMAD_STYLE}\n</head>`);
  }

  const footerTrustPattern =
    /(<div[^>]*class=["'][^"']*\bfooter-trust\b[^"']*["'][^>]*>)/i;

  if (footerTrustPattern.test(html)) {
    return html.replace(footerTrustPattern, `$1\n${ENAMAD_HTML}`);
  }

  const wrappedBadge = `<div class="standalone-enamad-wrap">${ENAMAD_HTML}</div>`;

  if (html.includes("</footer>")) {
    return html.replace("</footer>", `${wrappedBadge}\n</footer>`);
  }

  if (html.includes("</body>")) {
    return html.replace("</body>", `${wrappedBadge}\n</body>`);
  }

  return `${html}\n${wrappedBadge}`;
}

function injectSharedCategoryNav(html) {
  if (!html || !html.includes('class="nav-cats-wrap"')) return html;

  if (!html.includes("/css/shared-category-nav.css")) {
    html = html.replace("</head>", `${SHARED_CATEGORY_HEAD}\n</head>`);
  }

  if (!html.includes("/js/shared-category-nav.js")) {
    html = html.replace("</body>", `${SHARED_CATEGORY_SCRIPT}\n</body>`);
  }

  return html;
}

function sendViewWithEnamad(res, fileName) {
  const filePath = path.join(__dirname, `../../views/${fileName}`);

  try {
    let html = fs.readFileSync(filePath, "utf8");
    html = injectEnamad(html);
    html = injectSharedCategoryNav(html);
    html = injectMobileBottomNav(html);
    res.type("html").send(html);
  } catch (error) {
    console.error(`View render error (${fileName}):`, error);
    res.status(500).send("خطا در بارگذاری صفحه");
  }
}

const homeController = {
  index: (req, res) => {
    const indexPath = path.join(__dirname, "../../views/index.html");

    try {
      let html = fs.readFileSync(indexPath, "utf8");

      if (html.includes("</head>")) {
        html = html.replace(
          "</head>",
          `${MOBILE_HERO_FIX}\n${PROFILE_DROPDOWN_LAYER_FIX}\n${SHARED_CATEGORY_HEAD}\n</head>`,
        );
      }

      html = html.replace(
        /\s*<!-- ═══ PRODUCT GRID \(محصولات منتخب\) ═══ -->[\s\S]*?(?=\s*<!-- ═══ SIMPLE BANNER \(بنر ساده\) ═══ -->)/,
        "\n",
      );

      html = html.replace(
        /\s*\/\* ══ محصولات منتخب \(از دیتابیس واقعی\) ══ \*\/[\s\S]*?\s*loadFeaturedProducts\(\);/,
        "\n",
      );

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

      html = html.replace(
        /\s*<section class="simple-banner">[\s\S]*?<\/section>/,
        "\n",
      );

      if (!html.includes("/js/shared-category-nav.js")) {
        html = html.replace("</body>", `${SHARED_CATEGORY_SCRIPT}\n</body>`);
      }

      html = injectMobileBottomNav(html);
      res.type("html").send(html);
    } catch (error) {
      console.error("Homepage render error:", error);
      res.status(500).send("خطا در بارگذاری صفحه اصلی");
    }
  },
  contact: (req, res) => sendViewWithEnamad(res, "contact.html"),
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
  mobiles: (req, res) => sendViewWithEnamad(res, "mobile.html"),
  categories: (req, res) => sendViewWithEnamad(res, "categories.html"),
  login: (req, res) => sendViewWithEnamad(res, "login.html"),
  cart: (req, res) => sendViewWithEnamad(res, "cart.html"),
  iphone: (req, res) => sendViewWithEnamad(res, "iphone.html"),
  product: (req, res) => sendViewWithEnamad(res, "product.html"),
  samsung: (req, res) => sendViewWithEnamad(res, "samsung.html"),
  xiaomi: (req, res) => sendViewWithEnamad(res, "xiaomi.html"),
  samsungtab: (req, res) => sendViewWithEnamad(res, "samsungtab.html"),
  ipad: (req, res) => sendViewWithEnamad(res, "ipad.html"),
  xiaomitab: (req, res) => sendViewWithEnamad(res, "xiaomitab.html"),
  console: (req, res) => sendViewWithEnamad(res, "console.html"),
  profile: (req, res) => sendViewWithEnamad(res, "profile.html"),
};

module.exports = homeController;
