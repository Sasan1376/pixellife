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
  const escapeHtml = (value) => { const el = document.createElement("div"); el.textContent = value == null ? "" : String(value); return el.innerHTML; };
  const price = (p) => p.availability === "out" || Number(p.price) <= 0 ? "ناموجود" : Number(p.price).toLocaleString("fa-IR") + " تومان";
  const card = (p) => {
    const name = escapeHtml(p.name), href = "/product?id=" + encodeURIComponent(p.slug);
    if (path === "/mobiles") return `<a href="${href}" class="${config.card}" style="color:inherit;text-decoration:none"><div class="${config.name}">${name}</div><div class="${config.brand}">${escapeHtml(p.brand)}</div><div class="${config.price}">${price(p)}</div></a>`;
    const image = escapeHtml(p.mainImage || (p.images && p.images[0]) || "https://placehold.co/600x600/f8fafc/94a3b8?text=PixelLife");
    return `<a href="${href}" class="${config.card}" style="color:inherit"><div class="${config.image}"><img src="${image}" alt="${name}" loading="lazy"></div><div class="${config.body}"><div class="${config.name}">${name}</div><div class="${config.desc}">${escapeHtml(p.description || p.brand || "")}</div><div class="mt-2 small ${p.availability === "out" ? "text-danger" : "text-success"}">${p.availability === "out" ? "ناموجود" : "موجود"} · ${price(p)}</div></div></a>`;
  };
  const params = new URLSearchParams({ category: config.category, limit: "24" });
  if (config.brand) params.set("brand", config.brand);
  fetch("/api/products?" + params).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => {
    if (data.success && Array.isArray(data.products) && data.products.length) grid.innerHTML = data.products.map(card).join("");
  }).catch(() => {});
})();
