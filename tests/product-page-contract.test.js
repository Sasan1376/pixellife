const fs = require("fs");
const path = require("path");

const productPage = fs.readFileSync(path.join(__dirname, "..", "views", "product.html"), "utf8");
const requiredMarkers = [
  "product-gallery-size-override",
  "product-options-layout-order",
  "limit-product-highlights-to-five",
  "lock-main-product-gallery-behavior",
  "reliable-desktop-discount-card",
  "addFromMobilePurchaseBar",
  "getLiveProducts = async",
  'category: String(doc.category || "").trim()',
  "async function loadRecentlyViewedProducts",
  'id="storageVal" hidden',
  "breadcrumb-product-name",
  "reviewPros:",
  "reviewCons:",
  "reviewVerdict:",
  "id=\"rev-sec-pros-cons\"",
  "id=\"rev-sec-verdict\"",
  "hideColorsWhenOutOfStock",
  "محصول خارج از دستهٔ فعلی",
  "URLSearchParams({",
  "ناموجودبودن دلیل حذفِ کالای مشابه نیست",
  "پاسخ سرور با شناسهٔ نهایی یکتا می‌شود",
];

const missing = requiredMarkers.filter((marker) => !productPage.includes(marker));
if (missing.length) {
  console.error("Product-page customization contract failed. Missing:", missing.join(", "));
  process.exit(1);
}
console.log("Product-page customization contract passed.");
