const path = require("path");
const fs = require("fs");
const ContactMessage = require("../models/ContactMessage");

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const viewCache = new Map();

// با هر انتشار، URL فایل‌های CSS و JS عوض می‌شود تا مرورگری که نسخهٔ
// قدیمی را با قانون کش قبلی نگه داشته نیز ناچار به دریافت نسخهٔ تازه باشد.
const ASSET_REVISION = "20260831-cache-fix-2";

function injectAssetRevision(html) {
  return html.replace(
    /((?:src|href)=["']\/(?:css|js)\/[^"']+)(["'])/gi,
    (match, url, quote) => {
      if (url.includes("pl_rev=")) return match;
      return url + (url.includes("?") ? "&" : "?") + "pl_rev=" + ASSET_REVISION + quote;
    },
  );
}

function readView(filePath) {
  if (IS_PRODUCTION && viewCache.has(filePath)) return viewCache.get(filePath);
  const html = fs.readFileSync(filePath, "utf8");
  if (IS_PRODUCTION) viewCache.set(filePath, html);
  return html;
}

function sendCachedHtml(res, cacheKey, render) {
  res.set("Cache-Control", "no-cache, max-age=0, must-revalidate");
  if (IS_PRODUCTION && viewCache.has(cacheKey)) {
    return res.type("html").send(viewCache.get(cacheKey));
  }
  const html = injectAssetRevision(render());
  if (IS_PRODUCTION) viewCache.set(cacheKey, html);
  return res.type("html").send(html);
}

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
      /* نسبت بلندتر برای موبایل؛ نزدیک به اسلایدر خانومی */
      aspect-ratio: 1.65 / 1;
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
<script src="/js/shared-category-nav.js?v=2"></script>`;

const MOBILE_BOTTOM_NAV_HEAD = `
<link rel="stylesheet" href="/css/mobile-bottom-nav.css?v=10" />`;
const MOBILE_BOTTOM_NAV_SCRIPT = `
<script src="/js/mobile-bottom-nav.js?v=12"></script>`;
const CATALOG_NO_FLASH_HEAD = `
<style id="database-catalog-no-flash">.grid,.iphone-grid,.samsung-grid,.xiaomi-grid,.prod-grid,.xiaomitab-grid,.console-grid{visibility:hidden}</style>`;
const LOCAL_FONT_HEAD = `\n<link rel="stylesheet" href="/css/local-fonts.css?v=1" />`;
const LOCAL_ICON_HEAD = `<link rel="stylesheet" href="/css/tabler-icons.min.css?v=perf-1" />`;

function injectLocalFonts(html) {
  if (!html) return html;
  html = html.replace(
    /<link[^>]+href=["\x27]https:\/\/fonts\.googleapis\.com\/css2[^"\x27]*["\x27][^>]*>/gi,
    "",
  );
  html = html.replace(
    /<link[^>]+href=["\x27]https:\/\/cdn\.jsdelivr\.net\/npm\/@tabler\/icons-webfont[^"\x27]*["\x27][^>]*>/gi,
    LOCAL_ICON_HEAD,
  );
  if (html.includes("</head>") && !html.includes("/css/local-fonts.css")) {
    html = html.replace("</head>", `${LOCAL_FONT_HEAD}\n</head>`);
  }
  if (html.includes("</head>") && html.includes("ti ti-") && !html.includes("/css/tabler-icons.min.css")) {
    html = html.replace("</head>", `${LOCAL_ICON_HEAD}\n</head>`);
  }
  return html;
}
function injectMobileBottomNav(html) {
  if (!html) return html;
  html = injectLocalFonts(html);

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
  if (!html || !catalogGrids.some((marker) => html.includes(marker))) return html;

  if (html.includes("</head>") && !html.includes("database-catalog-no-flash")) {
    html = html.replace("</head>", `${CATALOG_NO_FLASH_HEAD}\n</head>`);
  }

  // فقط یک رندرکنندهٔ کارت بارگذاری شود؛ نسخهٔ قدیمی بعد از نسخهٔ جدید
  // کارت‌ها را بازنویسی می‌کرد و تایمر/درصد پیشنهاد شگفت‌انگیز را حذف می‌کرد.
  html = html.replace(
    /<script[^>]+src=["']\/js\/database-catalog\.js(?:\?v=[^"'\s>]*)?["'][^>]*><\/script>\s*/g,
    "",
  );

  if (html.includes("/js/database-catalog-amazing-v1.js")) return html;
  return html.replace(
    "</body>",
    '<script src="/js/database-catalog-amazing-v1.js?v=2"></script>\n</body>',
  );
}

function sendViewWithEnamad(res, fileName) {
  const filePath = path.join(__dirname, `../../views/${fileName}`);

  try {
    sendCachedHtml(res, `rendered:${fileName}`, () => {
      let html = readView(filePath);
      html = injectEnamad(html);
      html = injectSharedCategoryNav(html);
      html = injectMobileBottomNav(html);
      return injectDatabaseCatalog(html);
    });
  } catch (error) {
    console.error(`View render error (${fileName}):`, error);
    res.status(500).send("خطا در بارگذاری صفحه");
  }
}

function sendSpecialCatalogView(res, options) {
  // صفحهٔ هدفون و ساعت با همان قالب کامل آیفون رندر می‌شود: هدر، ورود،
  // سبد خرید و کارت‌ها دقیقاً با صفحات اصلی فروشگاه هم‌ظاهر هستند.
  const filePath = path.join(__dirname, "../../views/iphone.html");
  const key = `special-catalog:${options.slug}`;

  try {
    res.set("Cache-Control", "no-cache, max-age=0, must-revalidate");
    if (IS_PRODUCTION && viewCache.has(key)) {
      return res.type("html").send(viewCache.get(key));
    }

    let html = readView(filePath);
    const gridStart = html.indexOf('<div class="iphone-grid">');
    const gridEnd = html.indexOf(
      "<!-- End of iphone-grid — nothing else follows -->",
    );
    if (gridStart !== -1 && gridEnd !== -1) {
      html =
        html.slice(0, gridStart) +
        '<div class="iphone-grid" aria-live="polite"></div>\n      ' +
        html.slice(gridEnd);
    }

    html = html
      .replace(
        /<title>[\s\S]*?<\/title>/,
        `<title>${options.title} | PixelLife</title>`,
      )
      .replace(
        /<div class="iphone-page-title">[\s\S]*?<\/div>/,
        `<div class="iphone-page-title">${options.heading}</div>`,
      )
      .replace(
        /<div class="iphone-page-subtitle">[\s\S]*?<\/div>/,
        `<div class="iphone-page-subtitle">${options.description}</div>`,
      )
      .replace(
        /<svg width="32" height="32" viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>\s*<div>/,
        `<i class="ti ${options.icon}" style="font-size:32px;color:var(--text-2)"></i><div>`,
      );

    html = injectEnamad(html);
    html = injectSharedCategoryNav(html);
    html = injectMobileBottomNav(html);
    html = injectAssetRevision(injectDatabaseCatalog(html));
    if (IS_PRODUCTION) viewCache.set(key, html);
    res.type("html").send(html);
  } catch (error) {
    console.error(`Special catalog view render error (${options.slug}):`, error);
    res.status(500).send("خطا در بارگذاری صفحه");
  }
}

function sendAccessoryBrandView(res, brand) {
  const filePath = path.join(__dirname, "../../views/iphone.html");
  const brandName = String(brand || "").trim();

  try {
    res.set("Cache-Control", "no-cache, max-age=0, must-revalidate");
    if (IS_PRODUCTION && viewCache.has(`accessory:${brandName}`)) {
      return res.type("html").send(viewCache.get(`accessory:${brandName}`));
    }
    let html = readView(filePath);
    const pageTitle = `لوازم جانبی ${brandName}`;

    // کارت‌های نمونهٔ آیفون فقط برای طراحی اولیهٔ قالب هستند. در صفحهٔ لوازم
    // جانبی نباید حتی برای یک لحظه نمایش داده شوند.
    const gridStart = html.indexOf('<div class="iphone-grid">');
    const gridEnd = html.indexOf('<!-- End of iphone-grid — nothing else follows -->');
    if (gridStart !== -1 && gridEnd !== -1) {
      html =
        html.slice(0, gridStart) +
        '<div class="iphone-grid" aria-live="polite"></div>\n      ' +
        html.slice(gridEnd);
    }

    // صفحهٔ فهرست آیفون، ساختار کارت و ریسپانسیو استاندارد فروشگاه را دارد؛
    // با تغییر عنوان و داده‌های کاتالوگ، برای هر برند لوازم جانبی بازاستفاده می‌شود.
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${pageTitle} | PixelLife</title>`)
      .replace(
        /<div class="iphone-page-title">[\s\S]*?<\/div>/,
        `<div class="iphone-page-title">${pageTitle}</div>`,
      )
      .replace(
        /<div class="iphone-page-subtitle">[\s\S]*?<\/div>/,
        `<div class="iphone-page-subtitle">جدیدترین لوازم جانبی موبایل ${brandName}</div>`,
      )
      .replace(
        /<svg width="32" height="32" viewBox="0 0 24 24" fill="none">[\s\S]*?<\/svg>\s*<div>/,
        '<i class="ti ti-headphones" style="font-size:32px;color:var(--text-2)"></i><div>',
      )
      .replace(
        "/js/database-catalog.js?v=20260820-card-design-10",
        "/js/database-catalog.js?v=20260821-accessories-4",
      );
    html = injectEnamad(html);
    html = injectSharedCategoryNav(html);
    html = injectMobileBottomNav(html);
    html = injectAssetRevision(injectDatabaseCatalog(html));
    if (IS_PRODUCTION) viewCache.set(`accessory:${brandName}`, html);
    res.type("html").send(html);
  } catch (error) {
    console.error(`Accessory view render error (${brandName}):`, error);
    res.status(500).send("خطا در بارگذاری صفحه");
  }
}

const homeController = {
  index: (req, res) => {
    const indexPath = path.join(__dirname, "../../views/index.html");

    try {
      res.set("Cache-Control", "no-cache, max-age=0, must-revalidate");
      if (IS_PRODUCTION && viewCache.has("rendered:index")) {
        return res.type("html").send(viewCache.get("rendered:index"));
      }
      let html = readView(indexPath);

      if (html.includes("</head>")) {
        html = html.replace(
          "</head>",
          `${MOBILE_HERO_FIX}\n${PROFILE_DROPDOWN_LAYER_FIX}\n${SHARED_CATEGORY_HEAD}\n</head>`,
        );
      }

      if (!html.includes("/js/shared-category-nav.js")) {
        html = html.replace("</body>", `${SHARED_CATEGORY_SCRIPT}\n</body>`);
      }

      html = injectAssetRevision(injectMobileBottomNav(html));
      if (IS_PRODUCTION) viewCache.set("rendered:index", html);
      res.type("html").send(html);
    } catch (error) {
      console.error("Homepage render error:", error);
      res.status(500).send("خطا در بارگذاری صفحه اصلی");
    }
  },
  contact: (req, res) => sendViewWithEnamad(res, "contact.html"),
  terms: (req, res) => sendViewWithEnamad(res, "terms.html"),
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
  accessoriesChargers: (req, res) =>
    sendSpecialCatalogView(res, {
      slug: "accessories-chargers",
      title: "کابل، شارژر و آداپتور",
      heading: "کابل، شارژر و آداپتور",
      description: "کابل، شارژر و آداپتورهای موبایل را یک‌جا بررسی و انتخاب کنید.",
      icon: "ti-charging-pile",
    }),
  accessoriesApple: (req, res) => sendAccessoryBrandView(res, "اپل"),
  accessoriesSamsung: (req, res) => sendAccessoryBrandView(res, "سامسونگ"),
  accessoriesXiaomi: (req, res) => sendAccessoryBrandView(res, "شیائومی"),
  samsungtab: (req, res) => sendViewWithEnamad(res, "samsungtab.html"),
  ipad: (req, res) => sendViewWithEnamad(res, "ipad.html"),
  xiaomitab: (req, res) => sendViewWithEnamad(res, "xiaomitab.html"),
  // این دو دسته از قالب فهرست مشترک استفاده می‌کنند، اما عنوان، فیلترها و
  // تصویر کارت مخصوص خودشان را دارند.
  headphones: (req, res) =>
    sendSpecialCatalogView(res, {
      slug: "headphones",
      title: "هدفون و هندزفری",
      heading: "خرید هدفون و هندزفری",
      description: "مدل‌های اپل و سامسونگ را یک‌جا مقایسه و انتخاب کنید.",
      icon: "ti-headphones",
      filters:
        '<div class="filters"><a class="filter active" href="/headphones">همه هدفون‌ها</a><a class="filter" href="/headphones?brand=%D8%A7%D9%BE%D9%84">اپل</a><a class="filter" href="/headphones?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF">سامسونگ</a></div>',
    }),
  smartwatches: (req, res) =>
    sendSpecialCatalogView(res, {
      slug: "smartwatches",
      title: "ساعت هوشمند",
      heading: "خرید ساعت هوشمند",
      description: "جدیدترین ساعت‌های هوشمند اپل و سامسونگ را بررسی کنید.",
      icon: "ti-device-watch",
      filters:
        '<div class="filters"><a class="filter active" href="/smartwatches">همه ساعت‌ها</a><a class="filter" href="/smartwatches?brand=%D8%A7%D9%BE%D9%84">اپل</a><a class="filter" href="/smartwatches?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF">سامسونگ</a></div>',
    }),
  console: (req, res) => sendViewWithEnamad(res, "console.html"),
  profile: (req, res) => sendViewWithEnamad(res, "profile.html"),
};

module.exports = homeController;
