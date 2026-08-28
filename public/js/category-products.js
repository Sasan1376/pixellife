(function () {
  "use strict";

  const CATEGORY_CONFIG = {
    iphone: {
      selectors: [".iphone-grid"],
      brand: ["apple"],
      category: ["iphone", "آیفون", "اپل"],
      title: "iPhone",
    },
    samsung: {
      selectors: [".samsung-grid"],
      brand: ["samsung"],
      category: ["samsung", "سامسونگ", "galaxy"],
      title: "Samsung",
    },
    samsungtab: {
      selectors: [".prod-grid"],
      brand: ["samsung"],
      category: ["samsung tablet", "samsung tab", "galaxy tab", "سامسونگ", "تبلت سامسونگ"],
      title: "Samsung Tablet",
    },
    xiaomi: {
      selectors: [".xiaomi-grid"],
      brand: ["xiaomi", "redmi"],
      category: ["xiaomi", "شیائومی", "redmi"],
      title: "Xiaomi",
    },
    xiaomitab: {
      selectors: [".xiaomitab-grid"],
      brand: ["xiaomi", "redmi"],
      category: ["xiaomi tablet", "xiaomi tab", "xiaomitab", "شیائومی پد", "تبلت شیائومی"],
      title: "Xiaomi Tablet",
    },
    ipad: {
      selectors: [".prod-grid"],
      brand: ["apple"],
      category: ["ipad", "آیپد", "apple tablet", "تبلت اپل"],
      title: "iPad",
    },
  };

  const toFa = (value) =>
    Number(value || 0).toLocaleString("fa-IR", {
      maximumFractionDigits: 0,
    });

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const pageKey = Object.keys(CATEGORY_CONFIG).find((key) =>
    location.pathname.toLowerCase().includes(key)
  );

  if (!pageKey) return;

  const config = CATEGORY_CONFIG[pageKey];
  const grid = config.selectors.map((selector) => document.querySelector(selector)).find(Boolean);
  if (!grid) return;

  const fallbackHtml = grid.innerHTML;
  const fallbackClassName = grid.className;
  if (!document.getElementById("category-amazing-offer-style")) {
    const style = document.createElement("style");
    style.id = "category-amazing-offer-style";
    style.textContent = ".category-amazing-ribbon{position:absolute;top:10px;right:10px;z-index:10;background:#dc2626;color:#fff;padding:5px 10px;border-radius:9px;font:800 11px Vazirmatn,Tahoma,sans-serif;box-shadow:0 3px 9px rgba(220,38,38,.22)}.category-amazing-discount{position:absolute;top:10px;left:10px;z-index:10;background:#dc2626;color:#fff;padding:4px 7px;border-radius:8px;font:800 11px Vazirmatn,Tahoma,sans-serif;direction:ltr}.category-amazing-timer{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:9px;padding:7px 8px;border-radius:9px;background:#fff1f2;color:#be123c;font:800 12px Vazirmatn,Tahoma,sans-serif;white-space:nowrap}.category-amazing-timer i{font-size:15px}";
    document.head.appendChild(style);
  }

  function getImage(product) {
    const image = Array.isArray(product.images) && product.images.length ? product.images[0] : "";
    return image || "/images/placeholder-product.webp";
  }

  function matchesProduct(product) {
    const brand = normalize(product.brand);
    const category = normalize(product.category);
    return (
      config.brand.some((item) => brand.includes(normalize(item))) ||
      config.category.some((item) => category.includes(normalize(item)))
    );
  }

  function renderSkeleton(count = 4) {
    grid.innerHTML = Array.from({ length: count })
      .map(
        () => `
        <div class="${fallbackClassName.split(" ").filter(Boolean).filter((cls) => !cls.startsWith("grid")).join(" ")}" style="opacity:.7;pointer-events:none">
          <div class="prod-badges">
            <span class="badge-coming-soon">در حال بارگذاری</span>
            <span class="badge-out-of-stock">...</span>
          </div>
          <div class="prod-card-image" style="display:grid;place-items:center;min-height:240px;background:rgba(148,163,184,.08);border-radius:inherit">
            <div style="width:64px;height:64px;border-radius:18px;background:rgba(59,130,246,.16);animation:pulse 1.3s ease-in-out infinite"></div>
          </div>
          <div class="prod-card-body">
            <div style="height:12px;width:70%;border-radius:999px;background:rgba(148,163,184,.14);margin-bottom:10px"></div>
            <div style="height:18px;width:86%;border-radius:999px;background:rgba(148,163,184,.10);margin-bottom:10px"></div>
            <div style="height:12px;width:55%;border-radius:999px;background:rgba(148,163,184,.10);"></div>
          </div>
        </div>`
      )
      .join("");
  }

  function renderCard(product) {
    const image = getImage(product);
    const href = `product.html?slug=${encodeURIComponent(product.slug || product._id)}`;
    const name = product.name || "";
    const brand = product.brand || config.title;
    const desc = product.description || "";
    const price = toFa(product.price);
    const discount = Number(product.discount || 0);
    const stock = Number(product.stock || 0);
    const inStock = product.availability === "in" && stock !== 0;
    const amazingActive = product.amazingOffer && (!product.amazingOfferEndsAt || new Date(product.amazingOfferEndsAt) > new Date());
    const amazingRibbon = amazingActive ? '<span class="category-amazing-ribbon">شگفت‌انگیز</span>' : "";
    const discountBadge = amazingActive && discount > 0 ? '<span class="category-amazing-discount">' + discount + '%</span>' : "";
    const amazingTimer = amazingActive && product.amazingOfferEndsAt ? '<div class="category-amazing-timer"><i class="ti ti-clock"></i><span data-amazing-end="' + product.amazingOfferEndsAt + '"></span></div>' : "";

    if (grid.classList.contains("iphone-grid")) {
      return `
        <a href="${href}" class="iphone-card" style="color: inherit">
          <div class="iphone-badges">
            ${amazingRibbon}
            ${product.comingSoon ? '<span class="badge-coming-soon"><i class="ti ti-clock"></i> به‌زودی</span>' : ""}
            <span class="${inStock ? "badge-in-stock" : "badge-out-of-stock"}"><i class="ti ti-${inStock ? "check" : "x"}-circle"></i> ${inStock ? "موجود" : "ناموجود"}</span>
          </div>
          <div class="iphone-card-image">
            <img src="${image}" alt="${name}" />
          </div>
          <div class="iphone-card-body">
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" style="margin-bottom: 10px; display: block">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="var(--text-3)" />
            </svg>
            <div class="iphone-card-name">${name}</div>
            <div class="iphone-card-desc">${desc}</div>${amazingTimer}
          </div>
        </a>`;
    }

    if (grid.classList.contains("samsung-grid")) {
      return `
        <a href="${href}" class="samsung-card" style="color: inherit">
          <div class="prod-badges">${amazingRibbon}${discountBadge}${product.comingSoon ? '<span class="badge-coming-soon"><i class="ti ti-clock"></i> به‌زودی</span>' : ""}</div>
          <div class="samsung-card-image"><img src="${image}" alt="${name}" /></div>
          <div class="samsung-card-body">
            <span class="samsung-brand-logo">${brand}</span>
            <div class="samsung-card-name">${name}</div>
            <div class="samsung-card-desc">${desc}</div>${amazingTimer}
            <div class="prod-option-group" style="margin-top:12px">
              <div class="prod-option-label"><i class="ti ti-cash"></i> قیمت</div>
              <div class="prod-storage-options"><span class="prod-storage-chip">${price} تومان</span></div>
            </div>
          </div>
        </a>`;
    }

    return `
      <a href="${href}" class="prod-card" style="color: inherit">
        <div class="prod-badges">
          ${product.comingSoon ? '<span class="badge-coming-soon"><i class="ti ti-clock"></i> به‌زودی</span>' : ""}
          <span class="${inStock ? "badge-in-stock" : "badge-out-of-stock"}"><i class="ti ti-${inStock ? "check" : "x"}-circle"></i> ${inStock ? "موجود" : "ناموجود"}</span>
        </div>
        <div class="prod-card-image"><img src="${image}" alt="${name}" /></div>
        <div class="prod-card-body">
          <span class="prod-brand-logo">${brand}</span>
          <div class="prod-card-name">${name}</div>
          <div class="prod-card-desc">${desc}</div>${amazingTimer}
          <div class="prod-option-group">
            <div class="prod-option-label"><i class="ti ti-cash"></i> قیمت</div>
            <div class="prod-storage-options"><span class="prod-storage-chip">${price} تومان</span></div>
          </div>
        </div>
      </a>`;
  }

  async function fetchProducts(category) {
    const response = await fetch("/api/products", { credentials: "include" });
    if (!response.ok) {
      throw new Error("Failed to load products");
    }
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    return products.filter((product) => matchesProduct(product, category));
  }

  async function init() {
    renderSkeleton();
    try {
      const products = await fetchProducts(pageKey);
      if (!products.length) {
        grid.innerHTML = fallbackHtml;
        return;
      }
      grid.innerHTML = products.map(renderCard).join("");
      const updateAmazingTimers = () => {
        grid.querySelectorAll("[data-amazing-end]").forEach((el) => {
          const diff = new Date(el.dataset.amazingEnd).getTime() - Date.now();
          if (diff <= 0) { window.location.reload(); return; }
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          el.textContent = h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + " باقی‌مانده";
        });
      };
      updateAmazingTimers();
      window.setInterval(updateAmazingTimers, 1000);
    } catch (error) {
      grid.innerHTML = fallbackHtml;
      console.warn("[category-products] falling back to static cards:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
