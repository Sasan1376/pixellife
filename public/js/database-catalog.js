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
    style.textContent = ".pl-catalog-image{height:150px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}.pl-catalog-image img{max-width:100%;max-height:100%;object-fit:contain}.pl-catalog-loading{grid-column:1/-1;min-height:180px;display:grid;place-items:center;color:#64748b;font:600 14px Vazirmatn,Tahoma,sans-serif;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px}";
    document.head.appendChild(style);
  }

  const escapeHtml = (value) => {
    const element = document.createElement("div");
    element.textContent = value == null ? "" : String(value);
    return element.innerHTML;
  };
  const price = (product) =>
    product.availability === "out" || Number(product.price) <= 0
      ? "ناموجود"
      : Number(product.price).toLocaleString("fa-IR") + " تومان";

  function imageMarkup(product, name) {
    const primary = product.mainImage || (product.images && product.images[0]) || "";
    const fallback = (product.images || []).find(
      (image) => image && image !== primary,
    ) || "";
    const image = escapeHtml(primary || "/images/product-placeholder.svg");
    return `<img src="${image}" data-fallback="${escapeHtml(fallback)}" alt="${name}" loading="lazy" decoding="async" onerror="if(this.dataset.fallback && this.src !== new URL(this.dataset.fallback, location.origin).href){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.onerror=null;this.src='/images/product-placeholder.svg';}">`;
  }

  function card(product) {
    const name = escapeHtml(product.name);
    const href = "/product?id=" + encodeURIComponent(product.slug);
    if (path === "/mobiles") {
      return `<a href="${href}" class="${config.card}" style="color:inherit;text-decoration:none"><div class="pl-catalog-image">${imageMarkup(product, name)}</div><div class="${config.name}">${name}</div><div class="${config.brand}">${escapeHtml(product.brand)}</div><div class="${config.price}">${price(product)}</div></a>`;
    }
    return `<a href="${href}" class="${config.card}" style="color:inherit"><div class="${config.image}">${imageMarkup(product, name)}</div><div class="${config.body}"><div class="${config.name}">${name}</div><div class="${config.desc}">${escapeHtml(product.description || product.brand || "")}</div><div class="mt-2 small ${product.availability === "out" ? "text-danger" : "text-success"}">${product.availability === "out" ? "ناموجود" : "موجود"} · ${price(product)}</div></div></a>`;
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
