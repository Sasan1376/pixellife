/* امتیازهای عمومی محصولات: خوانده‌شده از همان API که پس از تأیید نظر به‌روز می‌شود. */
(() => {
  const CARD_SELECTOR = ".product-card, .iphone-card, .samsung-card, .xiaomi-card, .xiaomitab-card, .console-card, .prod-card, .pl-catalog-card, .slider-card, .card";
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const getProductKey = (anchor) => {
    try {
      const url = new URL(anchor.getAttribute("href") || "", window.location.origin);
      const queryId = url.searchParams.get("id");
      if (queryId) return normalize(queryId);
      const match = url.pathname.match(/^\/product\/(.+)$/);
      return match ? normalize(decodeURIComponent(match[1])) : "";
    } catch (_) {
      return "";
    }
  };
  const injectStyles = () => {
    if (document.getElementById("plLiveRatingStyles")) return;
    const style = document.createElement("style");
    style.id = "plLiveRatingStyles";
    style.textContent = ".pl-live-rating{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:20px;margin:8px auto 0;color:#64748b;font-size:11px;font-weight:700;line-height:20px;direction:rtl}.pl-live-rating__star{color:#f59e0b;font-size:14px;line-height:1}.pl-live-rating__value{color:#334155}.pl-live-rating__count{color:#94a3b8;font-weight:500}.slider-card .pl-live-rating{display:flex;width:100%;min-height:20px;margin:0 0 6px;justify-content:flex-start}.slider-card .pl-live-rating.is-empty{color:#a8b0bc;font-weight:500}";
    document.head.appendChild(style);
  };
  const mountRatings = (products) => {
    const byKey = new Map();
    products.forEach((product) => {
      const keys = [product._id, product.slug, product.legacyId].map(normalize).filter(Boolean);
      keys.forEach((key) => byKey.set(key, product));
    });
    document.querySelectorAll("a[href*='product']").forEach((anchor) => {
      const product = byKey.get(getProductKey(anchor));
      if (!product) return;
      const card = anchor.closest(CARD_SELECTOR) || anchor;
      const count = Math.max(0, Number(product.reviewCount) || 0);
      const rating = Math.max(0, Number(product.rating) || 0);
      const sliderStars = card.matches(".slider-card") ? card.querySelector(".stars") : null;
      const existing = card.querySelector(".pl-live-rating");
      // محصولات مشابه از قبل یک ردیف ستاره دارند؛ همان ردیف را به‌روزرسانی می‌کنیم
      // تا با اضافه‌شدن امتیاز، ارتفاع کارت تغییر نکند.
      const badge = sliderStars || existing || document.createElement("span");
      badge.className = (sliderStars ? "stars " : "") + "pl-live-rating" + (!count ? " is-empty" : "");
      badge.setAttribute(
        "aria-label",
        count
          ? "امتیاز " + rating + " از ۵، بر اساس " + count + " نظر"
          : "هنوز نظری برای این محصول ثبت نشده است",
      );
      badge.innerHTML = "";
      if (count) {
        const star = document.createElement("span");
        star.className = "pl-live-rating__star";
        star.textContent = "★";
        const value = document.createElement("span");
        value.className = "pl-live-rating__value";
        value.textContent = rating.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
        const reviewCount = document.createElement("span");
        reviewCount.className = "pl-live-rating__count";
        reviewCount.textContent = "(" + count.toLocaleString("fa-IR") + " نظر)";
        badge.append(star, value, reviewCount);
      } else {
        badge.textContent = "بدون نظر";
      }
      if (!sliderStars && !existing) {
        const actions = card.querySelector(".slider-card-actions");
        if (actions) actions.before(badge);
        else card.appendChild(badge);
      }
    });
  };
  const boot = async () => {
    injectStyles();
    try {
      const response = await fetch("/api/products?limit=100", { cache: "no-store" });
      const data = await response.json();
      const products = Array.isArray(data.products) ? data.products : [];
      mountRatings(products);
      let queued = false;
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          mountRatings(products);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (_) {
      // نمایش کارت‌ها در صورت خطای موقتی API نباید مختل شود.
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();

