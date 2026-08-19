(() => {
  const nav = document.querySelector(".mobile-bottom-nav");
  if (!nav) return;

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isCategoryPath = ["/categories", "/mobiles", "/iphone", "/samsung", "/xiaomi", "/ipad", "/samsungtab", "/xiaomitab", "/console"].includes(path);

  nav.querySelectorAll(".mobile-bottom-nav__item").forEach((item) => {
    const key = item.dataset.nav;
    const active =
      (key === "home" && path === "/") ||
      (key === "categories" && isCategoryPath) ||
      (key === "cart" && path === "/cart") ||
      (key === "account" && path.startsWith("/profile"));

    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });

  const accountItem = nav.querySelector('[data-nav="account"]');
  accountItem?.addEventListener("click", (event) => {
    let hasAuthHint = false;
    try {
      hasAuthHint = Boolean(
        localStorage.getItem("user") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token")
      );
    } catch (_) {}

    if (!hasAuthHint) {
      event.preventDefault();
      if (typeof window.openLoginModal === "function") {
        window.openLoginModal();
      } else {
        window.location.href = "/?openLogin=1";
      }
    }
  });

  const categoryItem = nav.querySelector('[data-nav="categories"]');
  let categorySheet;
  let categoryBackdrop;

  const closeCategorySheet = () => {
    categorySheet?.classList.remove("is-open", "is-dragging");
    categorySheet?.style.removeProperty("transform");
    categoryBackdrop?.classList.remove("is-open");
    categoryItem?.classList.remove("is-expanded");
    categoryItem?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-category-sheet-open");
  };

  const openCategorySheet = () => {
    if (!categorySheet || !categoryBackdrop) return;
    categorySheet.classList.add("is-open");
    categoryBackdrop.classList.add("is-open");
    categoryItem?.classList.add("is-expanded");
    categoryItem?.setAttribute("aria-expanded", "true");
    document.body.classList.add("mobile-category-sheet-open");
  };

  if (categoryItem) {
    categoryItem.setAttribute("aria-expanded", "false");

    const sheet = document.createElement("section");
    sheet.className = "mobile-category-sheet";
    sheet.id = "mobileCategorySheet";
    sheet.setAttribute("aria-label", "دسته‌بندی‌ها");
    sheet.innerHTML = `
      <div class="mobile-category-sheet__handle"></div>
      <div class="mobile-category-sheet__header">
        <h2 class="mobile-category-sheet__title">دسته‌بندی کالاها</h2>
        <button class="mobile-category-sheet__close" type="button" aria-label="بستن">×</button>
      </div>
      <div class="mobile-category-sheet__tabs"><span class="mobile-category-sheet__tab">دسته‌بندی‌ها</span></div>
      <div class="mobile-category-sheet__layout">
        <aside class="mobile-category-sheet__rail" aria-label="دسته‌های اصلی"></aside>
        <section class="mobile-category-sheet__content" aria-live="polite"></section>
      </div>`;;
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-category-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const icons = {
      mobile: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg>',
      tablet: '<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18.5h2"/></svg>',
      headphone: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1z"/><path d="M20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>',
      watch: '<svg viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="2"/><path d="M9 6 10 3h4l1 3M9 18l1 3h4l1-3"/></svg>',
      console: '<svg viewBox="0 0 24 24"><path d="M7 9h10a4 4 0 0 1 3.8 2.8l1 3.5A2 2 0 0 1 19.9 18h-2.3l-2-2H8.4l-2 2H4.1a2 2 0 0 1-1.9-2.7l1-3.5A4 4 0 0 1 7 9z"/><path d="M7 13v3M5.5 14.5h3M16 14h.01M18 15.5h.01"/></svg>'
    };
    const categories = [
      { id: "mobile", name: "موبایل", links: [{ label: "خرید آیفون", href: "/iphone" }, { label: "گوشی سامسونگ", href: "/samsung" }, { label: "گوشی شیائومی", href: "/xiaomi" }, { label: "همه موبایل‌ها", href: "/mobiles" }] },
      { id: "tablet", name: "تبلت", links: [{ label: "تبلت اپل", href: "/ipad" }, { label: "تبلت سامسونگ", href: "/samsungtab" }, { label: "تبلت شیائومی", href: "/xiaomitab" }] },
      { id: "headphone", name: "هدفون و هندزفری", links: [{ label: "هدفون اپل", soon: true }, { label: "هدفون سامسونگ", soon: true }] },
      { id: "watch", name: "ساعت هوشمند", links: [{ label: "اپل واچ", soon: true }, { label: "گلکسی واچ", soon: true }] },
      { id: "console", name: "کنسول بازی", links: [{ label: "PS5 Pro", href: "/console" }, { label: "PlayStation 5", href: "/console" }, { label: "لوازم جانبی گیمینگ", href: "/console" }] }
    ];
    const rail = sheet.querySelector(".mobile-category-sheet__rail");
    const categoryContent = sheet.querySelector(".mobile-category-sheet__content");
    const chevron = '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';

    const renderCategory = (id) => {
      const category = categories.find((item) => item.id === id) || categories[0];
      rail.querySelectorAll(".mobile-category-sheet__rail-item").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.category === category.id);
      });
      categoryContent.innerHTML = `
        <div class="mobile-category-sheet__content-head">${icons[category.id]}<span>${category.name}</span></div>
        <p class="mobile-category-sheet__content-desc">محصولات و زیر‌دسته‌های ${category.name}</p>
        ${category.links.map((link) => link.soon
          ? `<div class="mobile-category-sheet__soon"><span>${link.label}</span><small>به‌زودی</small></div>`
          : `<a class="mobile-category-sheet__link" href="${link.href}"><span>${link.label}</span>${chevron}</a>`
        ).join("")}`;
    };

    categories.forEach((category) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "mobile-category-sheet__rail-item";
      item.dataset.category = category.id;
      item.innerHTML = `${icons[category.id]}<span>${category.name}</span>`;
      item.addEventListener("click", () => renderCategory(category.id));
      rail.appendChild(item);
    });
    renderCategory(categories[0].id);

    document.body.append(backdrop, sheet);
    categorySheet = sheet;
    categoryBackdrop = backdrop;

    categoryItem.addEventListener("click", (event) => {
      if (!window.matchMedia("(max-width: 768px)").matches) return;
      event.preventDefault();
      categorySheet.classList.contains("is-open")
        ? closeCategorySheet()
        : openCategorySheet();
    });

    let dragStartY = null;
    let dragDistance = 0;
    const handle = sheet.querySelector(".mobile-category-sheet__handle");

    handle?.addEventListener("pointerdown", (event) => {
      if (!sheet.classList.contains("is-open")) return;
      dragStartY = event.clientY;
      dragDistance = 0;
      sheet.classList.add("is-dragging");
      handle.setPointerCapture?.(event.pointerId);
    });

    handle?.addEventListener("pointermove", (event) => {
      if (dragStartY === null) return;
      dragDistance = Math.max(0, event.clientY - dragStartY);
      sheet.style.transform = `translate3d(0, ${dragDistance}px, 0)`;
    });

    const finishDrag = () => {
      if (dragStartY === null) return;
      const shouldClose = dragDistance > 85;
      dragStartY = null;
      dragDistance = 0;
      sheet.classList.remove("is-dragging");
      sheet.style.removeProperty("transform");
      if (shouldClose) closeCategorySheet();
    };

    handle?.addEventListener("pointerup", finishDrag);
    handle?.addEventListener("pointercancel", finishDrag);

    sheet.querySelector(".mobile-category-sheet__close")?.addEventListener("click", closeCategorySheet);
    backdrop.addEventListener("click", closeCategorySheet);
    sheet.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeCategorySheet();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCategorySheet();
    });
  }

  const badge = nav.querySelector("[data-mobile-cart-count]");
  if (!badge) return;

  const updateCartBadge = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const count = Array.isArray(cart)
        ? cart.reduce((sum, item) => sum + Number(item.qty || 1), 0)
        : 0;
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.style.display = count > 0 ? "block" : "none";
    } catch (_) {
      badge.style.display = "none";
    }
  };

  updateCartBadge();
  window.addEventListener("storage", updateCartBadge);
  window.addEventListener("cartUpdated", updateCartBadge);
})();
