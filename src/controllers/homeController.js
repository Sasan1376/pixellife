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
<link rel="stylesheet" href="/css/mobile-bottom-nav.css?v=5" />`;
const MOBILE_BOTTOM_NAV_SCRIPT = `
<script src="/js/mobile-bottom-nav.js?v=8"></script>`;
function injectMobileBottomNav(html) {
  if (!html) return html;

  if (html.includes("</head>") && !html.includes("/css/mobile-bottom-nav.css")) {
    html = html.replace("</head>", `${MOBILE_BOTTOM_NAV_HEAD}\n</head>`);
  }

  if (html.includes("</body>") && !html.includes("/js/mobile-bottom-nav.js")) {
    html = html.replace("</body>", `${MOBILE_BOTTOM_NAV_SCRIPT}\n</body>`);
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

function injectDatabaseCatalog(html) {
  const catalogGrids = [
    'class="grid"', 'class="iphone-grid"', 'class="samsung-grid"',
    'class="xiaomi-grid"', 'class="prod-grid"', 'class="xiaomitab-grid"',
    'class="console-grid"',
  ];
  if (!html || !catalogGrids.some((marker) => html.includes(marker)) ||
      html.includes("/js/database-catalog.js")) return html;
  return html.replace("</body>", '<script src="/js/database-catalog.js?v=2"></script>\n</body>');
}

function sendViewWithEnamad(res, fileName) {
  const filePath = path.join(__dirname, `../../views/${fileName}`);

  try {
    let html = fs.readFileSync(filePath, "utf8");
    html = injectEnamad(html);
    html = injectSharedCategoryNav(html);
    html = injectMobileBottomNav(html);
    html = injectDatabaseCatalog(html);
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
