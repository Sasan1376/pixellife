(() => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const configs = {
    "/mobiles": { grid: ".grid", card: "card product-card", name: "card-name", brand: "card-brand", price: "card-price", category: "موبایل" },
    "/iphone": { grid: ".iphone-grid", card: "iphone-card", name: "iphone-card-name", image: "iphone-card-image", body: "iphone-card-body", desc: "iphone-card-desc", brand: "اپل", category: "موبایل" },
    "/samsung": { grid: ".samsung-grid", card: "samsung-card", name: "samsung-card-name", image: "samsung-card-image", body: "samsung-card-body", desc: "samsung-card-desc", brand: "سامسونگ", category: "موبایل" },
    "/xiaomi": { grid: ".xiaomi-grid", card: "xiaomi-card", name: "xiaomi-card-name", image: "xiaomi-card-image", body: "xiaomi-card-body", desc: "xiaomi-card-desc", brand: "شیائومی", category: "موبایل" },
    "/ipad": { grid: ".prod-grid", card: "prod-card", name: "prod-card-name", image: "prod-card-image", body: "prod-card-body", desc: "prod-card-desc", brand: "اپل", category: "تبلت" },
    "/samsungtab": { grid: ".prod-grid", card: "prod-card", name: "prod-card-name", image: "prod-card-image", body: "prod-card-body", desc: "prod-card-desc", brand: "سامسونگ", category: "تبلت" },
    "/xiaomitab": { grid: ".xiaomitab-grid", card: "xiaomitab-card", name: "xiaomitab-card-name", image: "xiaomitab-card-image", body: "xiaomitab-card-body", desc: "xiaomitab-card-desc", brand: "شیائومی", category: "تبلت" },
    "/console": { grid: ".console-grid", card: "console-card", name: "console-card-name", image: "console-card-image", body: "console-card-body", desc: "console-card-desc", category: "کنسول" },
  };

  const config = configs[path];
  if (!config) return;
  const grid = document.querySelector(config.grid);
  if (!grid) return;

  if (!document.getElementById("database-catalog-image-style")) {
    const style = document.createElement("style");
    style.id = "database-catalog-image-style";
    style.textContent = ".pl-catalog-card{display:flex!important;flex-direction:column;min-width:0;min-height:430px;padding:14px!important;background:#fff;border:1px solid #e7edf5!important;border-radius:16px!important;box-shadow:0 4px 16px rgba(15,23,42,.045);overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease!important}.pl-catalog-card:hover{transform:translateY(-3px);border-color:#cbdcf7!important;box-shadow:0 12px 28px rgba(15,23,42,.11)}.pl-catalog-media,.pl-catalog-image,.pl-catalog-card .iphone-card-image,.pl-catalog-card .samsung-card-image,.pl-catalog-card .xiaomi-card-image,.pl-catalog-card .prod-card-image,.pl-catalog-card .xiaomitab-card-image,.pl-catalog-card .console-card-image{height:245px!important;min-height:245px!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 0 14px!important;padding:16px!important;background:#f8fafc!important;border-radius:12px!important;overflow:hidden}.pl-catalog-media img,.pl-catalog-image img,.pl-catalog-card .iphone-card-image img,.pl-catalog-card .samsung-card-image img,.pl-catalog-card .xiaomi-card-image img,.pl-catalog-card .prod-card-image img,.pl-catalog-card .xiaomitab-card-image img,.pl-catalog-card .console-card-image img{width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;display:block}.pl-catalog-body{display:flex;flex:1;min-width:0;flex-direction:column;padding:0 2px}.pl-catalog-brand{font-size:12px;color:#64748b;margin-bottom:5px}.pl-catalog-card .iphone-card-name,.pl-catalog-card .samsung-card-name,.pl-catalog-card .xiaomi-card-name,.pl-catalog-card .prod-card-name,.pl-catalog-card .xiaomitab-card-name,.pl-catalog-card .console-card-name,.pl-catalog-card .card-name{font-size:15px!important;font-weight:800!important;line-height:1.85!important;min-height:54px;color:#172033!important;overflow:hidden;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical}.pl-catalog-card .iphone-card-desc,.pl-catalog-card .samsung-card-desc,.pl-catalog-card .xiaomi-card-desc,.pl-catalog-card .prod-card-desc,.pl-catalog-card .xiaomitab-card-desc,.pl-catalog-card .console-card-desc{font-size:12px!important;line-height:1.8!important;color:#718096!important;min-height:42px;margin:6px 0 10px!important;overflow:hidden;display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical}.pl-catalog-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:10px;border-top:1px solid #f0f3f7}.pl-catalog-status{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;white-space:nowrap}.pl-catalog-status.in{color:#16803a}.pl-catalog-status.out{color:#c2413a}.pl-catalog-price{font-size:14px;font-weight:800;color:#172033;white-space:nowrap}.pl-catalog-loading{grid-column:1/-1;min-height:180px;display:grid;place-items:center;color:#64748b;font:600 14px Vazirmatn,Tahoma,sans-serif;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px}@media(max-width:640px){.pl-catalog-card{min-height:385px;padding:10px!important;border-radius:14px!important}.pl-catalog-media,.pl-catalog-image,.pl-catalog-card .iphone-card-image,.pl-catalog-card .samsung-card-image,.pl-catalog-card .xiaomi-card-image,.pl-catalog-card .prod-card-image,.pl-catalog-card .xiaomitab-card-image,.pl-catalog-card .console-card-image{height:190px!important;min-height:190px!important;padding:10px!important;margin-bottom:10px!important}.pl-catalog-card .iphone-card-name,.pl-catalog-card .samsung-card-name,.pl-catalog-card .xiaomi-card-name,.pl-catalog-card .prod-card-name,.pl-catalog-card .xiaomitab-card-name,.pl-catalog-card .console-card-name,.pl-catalog-card .card-name{font-size:13px!important;min-height:48px}.pl-catalog-price{font-size:13px}}";
    document.head.appendChild(style);
  }

  const escapeHtml = (value) => {
    const element = document.createElement("div");
    element.textContent = value == null ? "" : String(value);
    return element.innerHTML;
  };
  function isOutOfStock(product) {
    return product.availability === "out" || Number(product.stock) <= 0;
  }
  const price = (product) => Number(product.price).toLocaleString("fa-IR") + " تومان";

  function imageMarkup(product, name) {
    // mainImage اولویت دارد، ولی اگر یک فایل قدیمی/حذف‌شده باشد، تمام عکس‌های
    // همان محصول به‌ترتیب امتحان می‌شوند؛ نه این‌که فوراً placeholder نمایش داده شود.
    const rawCandidates = [
      product.mainImage,
      ...(Array.isArray(product.images) ? product.images : []),
    ].filter(Boolean);
    const version = product.updatedAt || product._id || "";
    const candidates = [...new Set(rawCandidates)].map((source) => {
      if (!version || String(source).startsWith("data:")) return source;
      return source + (String(source).includes("?") ? "&" : "?") +
        "v=" + encodeURIComponent(version);
    });
    const primary = candidates[0] || "/images/product-placeholder.svg";
    const fallbacks = candidates.slice(1).join("|");
    return `<img src="${escapeHtml(primary)}" data-fallbacks="${escapeHtml(fallbacks)}" alt="${name}" loading="lazy" decoding="async" onerror="var urls=(this.dataset.fallbacks||'').split('|').filter(Boolean);var next=urls.shift();this.dataset.fallbacks=urls.join('|');if(next){this.src=next;}else{this.onerror=null;this.src='/images/product-placeholder.svg';}">`;
  }

  function card(product) {
    const name = escapeHtml(product.name);
    const href = "/product?id=" + encodeURIComponent(product.slug);
    const outOfStock = isOutOfStock(product);
    const stock = Math.max(0, Number(product.stock) || 0);
    const status = outOfStock
      ? '<span class="pl-catalog-status out"><i class="ti ti-circle-x"></i> ناموجود</span>'
      : '<span class="pl-catalog-status in"><i class="ti ti-circle-check"></i> موجود' +
          (stock <= 5 ? ' · فقط ' + stock.toLocaleString("fa-IR") + ' عدد' : '') +
        '</span>';
    const priceHtml = outOfStock
      ? ""
      : '<span class="pl-catalog-price">' + price(product) + '</span>';
    const imageClass = path === "/mobiles" ? "pl-catalog-media" : config.image;
    const bodyClass = path === "/mobiles" ? "pl-catalog-body" : config.body + " pl-catalog-body";
    const description = escapeHtml(product.description || product.brand || "");
    return `<a href="${href}" class="${config.card} pl-catalog-card" data-stock="${stock}" style="color:inherit;text-decoration:none"><div class="${imageClass}">${imageMarkup(product, name)}</div><div class="${bodyClass}"><div class="pl-catalog-brand">${escapeHtml(product.brand || "")}</div><div class="${config.name}">${name}</div><div class="${config.desc || "pl-catalog-desc"}">${description}</div><div class="pl-catalog-footer">${status}${priceHtml}</div></div></a>`;
  }

  const params = new URLSearchParams({ category: config.category, limit: "24" });
  if (config.brand) params.set("brand", config.brand);

  // دادهٔ قدیمیِ داخل HTML فقط نقش پشتیبان دارد. قبل از اولین رنگ‌کردن
  // صفحه پنهان می‌شود تا کاربر هرگز جابه‌جایی بین کارت‌های قدیمی و دیتابیس را نبیند.
  const fallbackHtml = grid.innerHTML;
  grid.dataset.databaseCatalog = "loading";
  grid.setAttribute("aria-busy", "true");
  grid.innerHTML =
    '<div class="pl-catalog-loading" role="status">در حال بارگذاری محصولات…</div>';

  const catalogRequestController = new AbortController();
  const catalogRequestTimer = window.setTimeout(
    () => catalogRequestController.abort(),
    7000,
  );

  fetch("/api/products?" + params, { signal: catalogRequestController.signal })
    .then((response) => {
      if (!response.ok) throw new Error("catalog request failed");
      return response.json();
    })
    .then((data) => {
      if (!data.success || !Array.isArray(data.products) || !data.products.length) {
        throw new Error("catalog is empty");
      }

      // فقط همین مسیر اجازهٔ بازنویسی گرید را دارد؛ هیچ observer یا اسکریپت
      // موازی نباید دادهٔ قدیمی را دوباره برگرداند.
      grid.innerHTML = data.products.map(card).join("");
      grid.dataset.databaseCatalog = "ready";
    })
    .catch(() => {
      // اگر API واقعاً در دسترس نبود، صفحه همچنان قابل استفاده می‌ماند.
      grid.innerHTML = fallbackHtml;
      grid.dataset.databaseCatalog = "fallback";
    })
    .finally(() => {
      window.clearTimeout(catalogRequestTimer);
      grid.removeAttribute("aria-busy");
    });
})();
