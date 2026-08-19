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
      <p class="mobile-category-sheet__intro">دستهٔ موردنظرت را انتخاب کن و محصولات مرتبط را ببین.</p>
      <div class="mobile-category-featured" aria-label="محصولات منتخب">
        <a class="mobile-category-featured__item" href="/product.html?id=iphone-17-pro-max"><strong>iPhone 17 Pro Max</strong><span>مشاهده محصول</span></a>
        <a class="mobile-category-featured__item" href="/product.html?id=samsung-galaxy-a56"><strong>Galaxy A56</strong><span>مشاهده محصول</span></a>
        <a class="mobile-category-featured__item" href="/console"><strong>PS5 Pro</strong><span>کنسول‌های بازی</span></a>
      </div>
      <div class="mobile-category-sheet__grid">
        <a class="mobile-category-sheet__item" href="/mobiles">
          <span class="mobile-category-sheet__item-head"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg>موبایل</span>
          <span class="mobile-category-sheet__links"><span>آیفون</span><span>گوشی سامسونگ</span><span>گوشی شیائومی</span></span>
        </a>
        <a class="mobile-category-sheet__item" href="/ipad">
          <span class="mobile-category-sheet__item-head"><svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18.5h2"/></svg>تبلت</span>
          <span class="mobile-category-sheet__links"><span>iPad اپل</span><span>تبلت سامسونگ</span><span>تبلت شیائومی</span></span>
        </a>
        <div class="mobile-category-sheet__item" aria-label="هدفون و هندزفری">
          <span class="mobile-category-sheet__item-head"><svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1z"/><path d="M20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>هدفون و هندزفری</span>
          <span class="mobile-category-sheet__links mobile-category-sheet__soon"><span>ایرپاد اپل — به‌زودی</span><span>هندزفری سامسونگ — به‌زودی</span></span>
        </div>
        <div class="mobile-category-sheet__item" aria-label="ساعت هوشمند">
          <span class="mobile-category-sheet__item-head"><svg viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="2"/><path d="M9 6 10 3h4l1 3M9 18l1 3h4l1-3"/></svg>ساعت هوشمند</span>
          <span class="mobile-category-sheet__links mobile-category-sheet__soon"><span>اپل واچ — به‌زودی</span><span>گلکسی واچ — به‌زودی</span></span>
        </div>
        <a class="mobile-category-sheet__item" href="/console">
          <span class="mobile-category-sheet__item-head"><svg viewBox="0 0 24 24"><path d="M7 9h10a4 4 0 0 1 3.8 2.8l1 3.5A2 2 0 0 1 19.9 18h-2.3l-2-2H8.4l-2 2H4.1a2 2 0 0 1-1.9-2.7l1-3.5A4 4 0 0 1 7 9z"/><path d="M7 13v3M5.5 14.5h3M16 14h.01M18 15.5h.01"/></svg>کنسول بازی</span>
          <span class="mobile-category-sheet__links"><span>PS5 Pro</span><span>PlayStation 5</span><span>لوازم جانبی گیمینگ</span></span>
        </a>
      </div>`;;
    const backdrop = document.createElement("div");
    backdrop.className = "mobile-category-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

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
    sheet.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeCategorySheet));
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
