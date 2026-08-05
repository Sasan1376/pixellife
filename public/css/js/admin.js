/* ==========================================================================
   PixelLife Admin — admin.js
   Vanilla JS, organized by module. Talks to the existing Express/MongoDB
   product APIs via fetch(); every other section (orders, users, reviews,
   categories, brands, discounts, coupons, banners) is wired the same way
   and will use its REST endpoint the moment it exists on the server —
   until then it runs on local demo data so the dashboard stays usable.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. CONFIG — adjust these paths to match your real Express routes.
   *    The four product endpoints are the ones described as already
   *    implemented; everything else is a best-guess REST convention.
   * ------------------------------------------------------------------ */
  const API = {
    products: "/admin/products", // تغییر کرد
    productImages: (id) => `/api/products/${id}/images`,
    orders: "/api/orders",
    users: "/api/users",
    categories: "/api/categories",
    brands: "/api/brands",
    reviews: "/api/reviews",
    discounts: "/api/discounts",
    coupons: "/api/coupons",
    banners: "/api/banners",
    settings: "/api/settings",
  };

  /* ------------------------------------------------------------------ *
   * 2. Generic request helper
   * ------------------------------------------------------------------ */
  async function request(url, options = {}) {
    const opts = { headers: {}, ...options };
    if (opts.body && !(opts.body instanceof FormData)) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, opts);
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      /* no body */
    }
    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `خطا در ارتباط با سرور (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  const api = {
    get: (url) => request(url, { method: "GET" }),
    post: (url, body) => request(url, { method: "POST", body }),
    put: (url, body) => request(url, { method: "PUT", body }),
    patch: (url, body) => request(url, { method: "PATCH", body }),
    del: (url) => request(url, { method: "DELETE" }),
  };

  /* Wraps a call: on network/API failure, fall back silently to demo data
     so every module remains explorable before its backend route exists. */
  async function withFallback(
    promiseFn,
    fallbackValue,
    { silent = true } = {},
  ) {
    try {
      return await promiseFn();
    } catch (err) {
      if (!silent) toast("error", "خطا", err.message);
      return fallbackValue;
    }
  }

  /* ------------------------------------------------------------------ *
   * 3. Utilities
   * ------------------------------------------------------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const fmtCurrency = (n) => Number(n || 0).toLocaleString("fa-IR") + " تومان";
  const fmtNumber = (n) => Number(n || 0).toLocaleString("fa-IR");
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  function escapeHtml(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  function debounce(fn, delay = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  function animateCounter(
    el,
    target,
    { prefix = "", suffix = "", duration = 900 } = {},
  ) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = prefix + fmtNumber(value) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function uid(prefix = "id") {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /* ------------------------------------------------------------------ *
   * 4. Theme + sidebar
   * ------------------------------------------------------------------ */
  const root = document.documentElement;
  function initTheme() {
    const saved = localStorageSafeGet("pl-theme") || "light";
    root.setAttribute("data-theme", saved);
    $("#themeSwitch").addEventListener("click", () => {
      const next =
        root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorageSafeSet("pl-theme", next);
    });
  }
  // Artifact-safe localStorage shim (falls back to in-memory if unavailable)
  const memStore = {};
  function localStorageSafeGet(k) {
    try {
      return localStorage.getItem(k);
    } catch (_) {
      return memStore[k];
    }
  }
  function localStorageSafeSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (_) {
      memStore[k] = v;
    }
  }

  function initSidebar() {
    const sidebar = $("#sidebar"),
      main = $("#main"),
      scrim = $("#sidebarScrim");
    $("#sidebarToggle").addEventListener("click", () => {
      if (window.innerWidth <= 980) {
        sidebar.classList.toggle("is-mobile-open");
        scrim.classList.toggle("is-visible");
      } else {
        sidebar.classList.toggle("is-collapsed");
        main.classList.toggle("is-collapsed");
      }
    });
    scrim.addEventListener("click", () => {
      sidebar.classList.remove("is-mobile-open");
      scrim.classList.remove("is-visible");
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. Toasts
   * ------------------------------------------------------------------ */
  const ICONS = {
    success:
      '<path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>',
    error:
      '<path d="M12 8V13M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>',
    warning:
      '<path d="M12 9V13M12 16.5H12.01M10.3 3.9L2.5 17.5C2 18.3 2.6 19.5 3.6 19.5H20.4C21.4 19.5 22 18.3 21.5 17.5L13.7 3.9C13.2 3 11.8 3 10.3 3.9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    info: '<path d="M12 11V16M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>',
  };
  const TITLES = {
    success: "انجام شد",
    error: "خطا",
    warning: "هشدار",
    info: "اطلاع‌رسانی",
  };

  function toast(type, title, message, duration = 4200) {
    const stack = $("#toastStack");
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <svg class="toast__icon" viewBox="0 0 24 24" fill="none">${ICONS[type] || ICONS.info}</svg>
      <div>
        <div class="toast__title">${escapeHtml(title || TITLES[type])}</div>
        <div class="toast__msg">${escapeHtml(message || "")}</div>
      </div>
      <button class="toast__close" aria-label="بستن">✕</button>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    const remove = () => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector(".toast__close").addEventListener("click", remove);
    setTimeout(remove, duration);
  }

  /* ------------------------------------------------------------------ *
   * 6. Modal system
   * ------------------------------------------------------------------ */
  function openModal(id) {
    $(`#${id}`).classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(id) {
    $(`#${id}`).classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function initModals() {
    $$(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });
    $$("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () =>
        closeModal(btn.closest(".modal-overlay").id),
      );
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape")
        $$(".modal-overlay.is-open").forEach((m) => closeModal(m.id));
    });
  }

  /* Reusable confirm dialog */
  function confirmAction({ title, message, onConfirm }) {
    $("#confirmTitle").textContent = title || "حذف این مورد؟";
    $("#confirmMessage").textContent =
      message || "این عملیات قابل بازگشت نیست.";
    const btn = $("#btnConfirmAction");
    const clone = btn.cloneNode(true); // strip old listeners
    btn.replaceWith(clone);
    clone.addEventListener("click", async () => {
      await onConfirm();
      closeModal("modalConfirm");
    });
    openModal("modalConfirm");
  }

  /* ------------------------------------------------------------------ *
   * 7. Router — hash based view switching
   * ------------------------------------------------------------------ */
  const CRUMBS = {
    dashboard: "داشبورد",
    products: "محصولات",
    orders: "سفارش‌ها",
    users: "کاربران",
    categories: "دسته‌بندی‌ها",
    brands: "برندها",
    reviews: "نظرات",
    discounts: "تخفیف‌ها",
    coupons: "کوپن‌ها",
    banners: "بنرها",
    settings: "تنظیمات",
    profile: "پروفایل",
  };

  function initRouter() {
    $$(".nav-link[data-view]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = link.dataset.view;
      });
    });
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  function renderRoute() {
    const view = (location.hash || "#dashboard").slice(1);
    $$(".view").forEach((v) => v.classList.remove("is-active"));
    const target = $(`#view-${view}`) || $("#view-dashboard");
    target.classList.add("is-active");
    $$(".nav-link[data-view]").forEach((l) =>
      l.classList.toggle("is-active", l.dataset.view === view),
    );
    $("#crumbCurrent").textContent = CRUMBS[view] || "داشبورد";
    $("#sidebar").classList.remove("is-mobile-open");
    $("#sidebarScrim").classList.remove("is-visible");
    // lazy-load each module the first time its view is visited
    moduleLoaders[view] && moduleLoaders[view]();
  }

  /* ------------------------------------------------------------------ *
   * 8. Demo data (used until each entity has a real backend route)
   * ------------------------------------------------------------------ */
  const demo = {
    categories: [
      {
        id: "c1",
        name: "موبایل",
        children: [
          { id: "c1-1", name: "اپل" },
          { id: "c1-2", name: "سامسونگ" },
          { id: "c1-3", name: "شیائومی" },
        ],
      },
      {
        id: "c2",
        name: "لپ‌تاپ",
        children: [
          { id: "c2-1", name: "اپل" },
          { id: "c2-2", name: "ایسوس" },
        ],
      },
      {
        id: "c3",
        name: "لوازم جانبی",
        children: [
          { id: "c3-1", name: "هدفون" },
          { id: "c3-2", name: "شارژر" },
        ],
      },
    ],
    brands: [
      {
        id: "b1",
        name: "اپل",
        count: 42,
        logo: "https://logo.clearbit.com/apple.com",
      },
      {
        id: "b2",
        name: "سامسونگ",
        count: 37,
        logo: "https://logo.clearbit.com/samsung.com",
      },
      {
        id: "b3",
        name: "شیائومی",
        count: 24,
        logo: "https://logo.clearbit.com/mi.com",
      },
      {
        id: "b4",
        name: "سونی",
        count: 15,
        logo: "https://logo.clearbit.com/sony.com",
      },
    ],
    users: Array.from({ length: 18 }).map((_, i) => ({
      id: uid("u"),
      name: `کاربر ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `091${(10000000 + i * 137).toString().slice(0, 8)}`,
      role: i === 0 ? "مدیر" : i % 5 === 0 ? "پشتیبان" : "مشتری",
      status: i % 6 === 0 ? "inactive" : "active",
      avatar: `https://i.pravatar.cc/80?img=${(i % 60) + 1}`,
    })),
    orders: Array.from({ length: 24 }).map((_, i) => ({
      id: `#PX-${1042 + i}`,
      customer: `مشتری ${i + 1}`,
      total: 850000 + i * 63000,
      payment: ["paid", "pending", "paid", "failed"][i % 4],
      shipping: ["pending", "shipped", "delivered", "pending"][i % 4],
      date: new Date(Date.now() - i * 86400000),
      items: [
        {
          name: "گوشی موبایل سامسونگ گلکسی",
          qty: 1,
          price: 850000 + i * 63000,
        },
      ],
    })),
    reviews: Array.from({ length: 10 }).map((_, i) => ({
      id: uid("r"),
      customer: `کاربر ${i + 1}`,
      product: "گلکسی A55",
      rating: (i % 5) + 1,
      text: "کیفیت محصول خیلی خوب بود و بسته‌بندی سالم به دستم رسید.",
      status: ["pending", "approved", "rejected"][i % 3],
    })),
    discounts: [
      {
        id: uid("d"),
        title: "حراج تابستانه موبایل",
        type: "percent",
        value: 15,
        start: "1404/04/01",
        end: "1404/04/15",
        active: true,
      },
      {
        id: uid("d"),
        title: "تخفیف لپ‌تاپ‌های ایسوس",
        type: "fixed",
        value: 500000,
        start: "1404/03/20",
        end: "1404/04/05",
        active: false,
      },
    ],
    coupons: [
      {
        id: uid("cp"),
        code: "PIXEL10",
        type: "percent",
        value: 10,
        used: 128,
        expires: "1404/05/01",
        active: true,
      },
      {
        id: uid("cp"),
        code: "WELCOME50",
        type: "fixed",
        value: 50000,
        used: 40,
        expires: "1404/04/20",
        active: true,
      },
    ],
    banners: [
      {
        id: uid("bn"),
        title: "بنر اصلی فروشگاه",
        image: "https://picsum.photos/seed/pixel1/480/240",
      },
      {
        id: uid("bn"),
        title: "بنر جشنواره موبایل",
        image: "https://picsum.photos/seed/pixel2/480/240",
      },
      {
        id: uid("bn"),
        title: "بنر لوازم جانبی",
        image: "https://picsum.photos/seed/pixel3/480/240",
      },
    ],
  };

  /* Local fallback product set — only used if GET /api/products fails,
     so the table/module is fully explorable without a live backend. */
  function demoProducts(n = 46) {
    const cats = ["موبایل", "لپ‌تاپ", "هدفون", "ساعت هوشمند", "تبلت"];
    const brands = ["اپل", "سامسونگ", "شیائومی", "سونی", "ایسوس"];
    return Array.from({ length: n }).map((_, i) => {
      const stock = [0, 3, 8, 25, 60][i % 5];
      return {
        _id: uid("p"),
        name: `${brands[i % brands.length]} مدل PX-${100 + i}`,
        brand: brands[i % brands.length],
        category: cats[i % cats.length],
        price: 1200000 + i * 45000,
        discount: i % 4 === 0 ? 10 : 0,
        stock,
        availability: stock === 0 ? "out" : stock < 10 ? "low" : "in",
        images: [`https://picsum.photos/seed/prod${i}/200/200`],
        createdAt: new Date(Date.now() - i * 43200000),
        description: "",
        specs: "",
        featured: i % 7 === 0,
      };
    });
  }

  /* ==================================================================== *
   * 9. DASHBOARD MODULE
   * ==================================================================== */
  let chartsInited = false;
  const STAT_DEFS = [
    { key: "products", label: "محصولات", accent: "--signal", icon: "box" },
    { key: "orders", label: "سفارش‌ها", accent: "--sky", icon: "cart" },
    { key: "users", label: "کاربران", accent: "--pulse", icon: "users" },
    { key: "revenue", label: "درآمد کل", accent: "--signal", icon: "coin" },
    { key: "lowStock", label: "موجودی کم", accent: "--amber", icon: "alert" },
    {
      key: "pending",
      label: "سفارش‌های در انتظار",
      accent: "--coral",
      icon: "clock",
    },
    { key: "reviews", label: "نظرات جدید", accent: "--sky", icon: "star" },
    { key: "today", label: "فروش امروز", accent: "--pulse", icon: "trend" },
  ];
  const STAT_ICONS = {
    box: '<path d="M20 8L12 3L4 8M20 8V16L12 21M20 8L12 13M12 21L4 16V8M12 21V13M4 8L12 13" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    cart: '<path d="M3 6H21L19 15H5L3 6ZM3 6L2.4 3H1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="19" r="1.3" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="19" r="1.3" stroke="currentColor" stroke-width="1.6"/>',
    users:
      '<circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M3 20C3 16.5 5.7 14 9 14C12.3 14 15 16.5 15 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    coin: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M9 12H15M12 9V15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    alert:
      '<path d="M12 8V13M12 16H12.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>',
    clock:
      '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7V12L15.5 14.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    star: '<path d="M12 2L14.5 8.5L21 9L16 13.5L17.5 20L12 16.5L6.5 20L8 13.5L3 9L9.5 8.5L12 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    trend:
      '<path d="M3 17L9 11L13 15L21 7M21 7H15M21 7V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  async function loadDashboard() {
    const products = await withFallback(
      () => api.get(API.products),
      demoProducts(),
    );
    const list = Array.isArray(products)
      ? products
      : products.items || products.products || demoProducts();
    const orders = demo.orders;
    const stats = {
      products: list.length,
      orders: orders.length,
      users: demo.users.length,
      revenue: orders.reduce((s, o) => s + o.total, 0),
      lowStock: list.filter(
        (p) => p.availability === "low" || (p.stock > 0 && p.stock < 10),
      ).length,
      pending: orders.filter((o) => o.shipping === "pending").length,
      reviews: demo.reviews.filter((r) => r.status === "pending").length,
      today:
        orders
          .filter(
            (o) =>
              new Date(o.date).toDateString() === new Date().toDateString(),
          )
          .reduce((s, o) => s + o.total, 0) || orders[0].total,
    };
    renderStatCards(stats);
    renderActivity();
    if (!chartsInited) {
      initCharts();
      chartsInited = true;
    }
  }

  function renderStatCards(stats) {
    const grid = $("#statGrid");
    grid.innerHTML = STAT_DEFS.map(
      (def) => `
      <div class="stat-card" style="--accent:var(${def.accent})">
        <div class="stat-card__top">
          <div class="stat-card__icon"><svg viewBox="0 0 24 24" fill="none">${STAT_ICONS[def.icon]}</svg></div>
          <span class="pixel-cluster"><span></span><span></span><span></span><span></span></span>
        </div>
        <div class="stat-card__value counting" data-target="${stats[def.key]}" data-key="${def.key}">۰</div>
        <div class="stat-card__label">${def.label}</div>
        <div class="stat-card__delta ${Math.random() > 0.35 ? "up" : "down"}">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 17L10 11L14 15L20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ${(Math.random() * 12 + 1).toFixed(1)}٪ نسبت به ماه قبل
        </div>
      </div>`,
    ).join("");
    $$(".stat-card__value", grid).forEach((el) => {
      const target = Number(el.dataset.target);
      const isMoney =
        el.dataset.key === "revenue" || el.dataset.key === "today";
      animateCounter(el, target, { suffix: isMoney ? " ت" : "" });
    });
  }

  function renderActivity() {
    const items = [
      { text: "سفارش جدید #PX-1066 ثبت شد", time: "۵ دقیقه پیش" },
      { text: "محصول «گلکسی A55» به‌روزرسانی شد", time: "۲۲ دقیقه پیش" },
      { text: "نظر جدید برای «ایرپاد پرو» ثبت شد", time: "۱ ساعت پیش" },
      { text: "کاربر جدید ثبت‌نام کرد", time: "۳ ساعت پیش" },
      { text: "کوپن WELCOME50 استفاده شد", time: "دیروز" },
    ];
    $("#activityList").innerHTML = items
      .map(
        (it) => `
      <div class="activity-item">
        <span class="activity-item__dot"></span>
        <div>
          <div class="activity-item__text">${it.text}</div>
          <div class="activity-item__time">${it.time}</div>
        </div>
      </div>`,
      )
      .join("");
  }

  function chartTheme() {
    const dark = root.getAttribute("data-theme") === "dark";
    return {
      grid: dark ? "rgba(255,255,255,.06)" : "rgba(20,22,40,.06)",
      text: dark ? "#9297AE" : "#6B7186",
      signal: "#6C5CE7",
      pulse: "#00C9B7",
      amber: "#FFB020",
      coral: "#FF5C72",
      sky: "#3E8BFF",
    };
  }

  function initCharts() {
    const t = chartTheme();
    Chart.defaults.font.family = "'Vazirmatn', sans-serif";
    Chart.defaults.color = t.text;

    new Chart($("#chartSales"), {
      type: "line",
      data: {
        labels: [
          "شنبه",
          "یک‌شنبه",
          "دوشنبه",
          "سه‌شنبه",
          "چهارشنبه",
          "پنج‌شنبه",
          "جمعه",
        ],
        datasets: [
          {
            label: "درآمد",
            data: [12, 19, 14, 22, 26, 31, 28].map((v) => v * 90000),
            borderColor: t.signal,
            backgroundColor: "rgba(108,92,231,.12)",
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: t.signal,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            grid: { color: t.grid },
            ticks: { callback: (v) => v / 1000 + "K" },
          },
          x: { grid: { display: false } },
        },
      },
    });

    new Chart($("#chartCategories"), {
      type: "doughnut",
      data: {
        labels: ["موبایل", "لپ‌تاپ", "هدفون", "ساعت هوشمند", "تبلت"],
        datasets: [
          {
            data: [38, 24, 16, 12, 10],
            backgroundColor: [t.signal, t.pulse, t.amber, t.sky, t.coral],
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10, padding: 14 } },
        },
        cutout: "68%",
      },
    });

    new Chart($("#chartMonthly"), {
      type: "bar",
      data: {
        labels: ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور"],
        datasets: [
          {
            label: "درآمد",
            data: [42, 55, 47, 63, 58, 71].map((v) => v * 210000),
            backgroundColor: t.signal,
            borderRadius: 8,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: {
            grid: { color: t.grid },
            ticks: { callback: (v) => v / 1000000 + "M" },
          },
          x: { grid: { display: false } },
        },
      },
    });

    new Chart($("#chartBrands"), {
      type: "bar",
      data: {
        labels: demo.brands.map((b) => b.name),
        datasets: [
          {
            label: "تعداد فروش",
            data: demo.brands.map((b) => b.count),
            backgroundColor: t.pulse,
            borderRadius: 8,
            maxBarThickness: 30,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: t.grid } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  /* ==================================================================== *
   * 10. PRODUCTS MODULE
   * ==================================================================== */
  const productsState = {
    all: [],
    filtered: [],
    page: 1,
    perPage: 8,
    sortKey: "createdAt",
    sortDir: "desc",
    selected: new Set(),
    loaded: false,
  };

  async function loadProducts(force = false) {
    if (productsState.loaded && !force) return renderProductsTable();
    renderProductsSkeleton();
    const data = await withFallback(
      () => api.get(API.products),
      demoProducts(),
      { silent: true },
    );
    productsState.all = Array.isArray(data)
      ? data
      : data.items || data.products || demoProducts();
    productsState.loaded = true;
    populateProductFilters();
    applyProductFilters();
  }

  function renderProductsSkeleton() {
    $("#productsBody").innerHTML = Array.from({ length: 6 })
      .map(
        () => `
      <tr><td colspan="9"><div class="skel-row"><div class="skeleton"></div><div class="skeleton"></div></div></td></tr>`,
      )
      .join("");
  }

  function populateProductFilters() {
    const cats = [...new Set(productsState.all.map((p) => p.category))].filter(
      Boolean,
    );
    const brands = [...new Set(productsState.all.map((p) => p.brand))].filter(
      Boolean,
    );
    $("#filterCategory").innerHTML =
      '<option value="">همه دسته‌ها</option>' +
      cats
        .map(
          (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`,
        )
        .join("");
    $("#filterBrand").innerHTML =
      '<option value="">همه برندها</option>' +
      brands
        .map(
          (b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`,
        )
        .join("");
    // also feed the product-form selects
    $("#pCategory").innerHTML =
      cats
        .map(
          (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`,
        )
        .join("") || '<option value="عمومی">عمومی</option>';
    $("#pBrand").innerHTML =
      brands
        .map(
          (b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`,
        )
        .join("") || '<option value="سایر">سایر</option>';
  }

  function applyProductFilters() {
    const q = ($("#productSearch").value || "").trim().toLowerCase();
    const cat = $("#filterCategory").value;
    const brand = $("#filterBrand").value;
    const avail = $("#filterAvailability").value;

    let rows = productsState.all.filter((p) => {
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
      if (cat && p.category !== cat) return false;
      if (brand && p.brand !== brand) return false;
      if (
        avail &&
        (p.availability ||
          (p.stock === 0 ? "out" : p.stock < 10 ? "low" : "in")) !== avail
      )
        return false;
      return true;
    });

    const { sortKey, sortDir } = productsState;
    rows.sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (sortKey === "createdAt") {
        av = new Date(av || 0).getTime();
        bv = new Date(bv || 0).getTime();
      }
      if (typeof av === "string") {
        av = av.localeCompare(bv, "fa");
        return sortDir === "asc" ? av : -av;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    productsState.filtered = rows;
    productsState.page = 1;
    renderProductsTable();
  }

  function availabilityBadge(p) {
    const state =
      p.availability || (p.stock === 0 ? "out" : p.stock < 10 ? "low" : "in");
    const map = {
      in: ["success", "موجود"],
      low: ["warning", "موجودی کم"],
      out: ["danger", "ناموجود"],
    };
    const [cls, label] = map[state] || map.in;
    return `<span class="badge badge--${cls}">${label}</span>`;
  }

  function renderProductsTable() {
    const { filtered, page, perPage } = productsState;
    const start = (page - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);
    const tbody = $("#productsBody");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none"><path d="M20 8L12 3L4 8M20 8V16L12 21M20 8L12 13M12 21L4 16V8M12 21V13M4 8L12 13" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        <div class="empty-state__title">محصولی یافت نشد</div><div>فیلترها را تغییر دهید یا محصول جدیدی اضافه کنید</div>
      </div></td></tr>`;
    } else {
      tbody.innerHTML = rows
        .map(
          (p) => `
        <tr data-id="${p._id}">
          <td><input type="checkbox" class="row-checkbox" data-id="${p._id}" ${productsState.selected.has(p._id) ? "checked" : ""}></td>
          <td>
            <div class="cell-product">
              <img src="${(p.images && p.images[0]) || "https://picsum.photos/seed/ph/100"}" alt="">
              <div><div class="cell-product__name">${escapeHtml(p.name)}</div><div class="cell-product__meta">#${String(p._id).slice(-6)}</div></div>
            </div>
          </td>
          <td>${escapeHtml(p.brand || "—")}</td>
          <td>${escapeHtml(p.category || "—")}</td>
          <td class="cell-price">${fmtCurrency(p.price)}</td>
          <td class="cell-price">${fmtNumber(p.stock)}</td>
          <td>${availabilityBadge(p)}</td>
          <td>${fmtDate(p.createdAt || Date.now())}</td>
          <td>
            <div class="cell-actions">
              <button class="icon-btn btn--sm" data-action="view" data-id="${p._id}" title="مشاهده" style="width:32px;height:32px;"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M2 12C4 7 8 4.5 12 4.5C16 4.5 20 7 22 12C20 17 16 19.5 12 19.5C8 19.5 4 17 2 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg></button>
              <button class="icon-btn btn--sm" data-action="edit" data-id="${p._id}" title="ویرایش" style="width:32px;height:32px;"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M4 20L4.8 16.4L16 5.2C16.8 4.4 18 4.4 18.8 5.2C19.6 6 19.6 7.2 18.8 8L7.6 19.2L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
              <button class="icon-btn btn--sm" data-action="images" data-id="${p._id}" title="مدیریت تصاویر" style="width:32px;height:32px;"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><rect x="3" y="4" width="18" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 15L8 10L12 14L16 10L21 15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
              <button class="icon-btn btn--sm" data-action="delete" data-id="${p._id}" title="حذف" style="width:32px;height:32px;color:var(--coral);"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M4 7H20M9 7V4H15V7M6 7L7 20H17L18 7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
            </div>
          </td>
        </tr>`,
        )
        .join("");
    }

    $("#productsPageInfo").textContent = filtered.length
      ? `نمایش ${start + 1}–${Math.min(start + perPage, filtered.length)} از ${fmtNumber(filtered.length)} محصول`
      : "هیچ محصولی برای نمایش نیست";
    renderPager("#productsPager", filtered.length, page, perPage, (p) => {
      productsState.page = p;
      renderProductsTable();
    });
    updateBulkBar();
  }

  function renderPager(sel, total, page, perPage, onGo) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const el = $(sel);
    let html = "";
    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && i !== 1 && i !== pages && Math.abs(i - page) > 1) {
        if (i === 2 || i === pages - 1)
          html += `<span style="padding:0 4px;color:var(--text-faint)">…</span>`;
        continue;
      }
      html += `<button class="${i === page ? "is-active" : ""}" data-page="${i}">${i.toLocaleString("fa-IR")}</button>`;
    }
    el.innerHTML = html;
    $$("button", el).forEach((b) =>
      b.addEventListener("click", () => onGo(Number(b.dataset.page))),
    );
  }

  function updateBulkBar() {
    const n = productsState.selected.size;
    $("#bulkBar").classList.toggle("is-visible", n > 0);
    $("#bulkCount").textContent = fmtNumber(n);
  }

  function initProductsEvents() {
    $("#productSearch").addEventListener(
      "input",
      debounce(applyProductFilters, 250),
    );
    ["filterCategory", "filterBrand", "filterAvailability"].forEach((id) =>
      $(`#${id}`).addEventListener("change", applyProductFilters),
    );

    $$(".data-table thead th[data-sort]", $("#view-products")).forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (productsState.sortKey === key)
          productsState.sortDir =
            productsState.sortDir === "asc" ? "desc" : "asc";
        else {
          productsState.sortKey = key;
          productsState.sortDir = "asc";
        }
        applyProductFilters();
      });
    });

    $("#headCheckbox").addEventListener("change", (e) => {
      const idsOnPage = $$(".row-checkbox").map((c) => c.dataset.id);
      idsOnPage.forEach((id) =>
        e.target.checked
          ? productsState.selected.add(id)
          : productsState.selected.delete(id),
      );
      renderProductsTable();
    });

    $("#productsBody").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      const chk = e.target.closest(".row-checkbox");
      if (chk) {
        chk.checked
          ? productsState.selected.add(chk.dataset.id)
          : productsState.selected.delete(chk.dataset.id);
        updateBulkBar();
        return;
      }
      if (!btn) return;
      const id = btn.dataset.id;
      const product = productsState.all.find(
        (p) => String(p._id) === String(id),
      );
      if (btn.dataset.action === "view") openProductView(product);
      if (btn.dataset.action === "edit") openProductForm(product);
      if (btn.dataset.action === "images")
        openProductForm(product, { focusImages: true });
      if (btn.dataset.action === "delete") {
        confirmAction({
          title: "حذف محصول؟",
          message: `آیا از حذف «${product.name}» مطمئن هستید؟`,
          onConfirm: () => deleteProduct(id),
        });
      }
    });

    $("#btnBulkDelete").addEventListener("click", () => {
      confirmAction({
        title: "حذف گروهی محصولات؟",
        message: `${productsState.selected.size} محصول انتخاب‌شده حذف خواهد شد.`,
        onConfirm: async () => {
          const ids = [...productsState.selected];
          await withFallback(
            () =>
              Promise.all(ids.map((id) => api.del(`${API.products}/${id}`))),
            null,
          );
          productsState.all = productsState.all.filter(
            (p) => !ids.includes(String(p._id)),
          );
          productsState.selected.clear();
          applyProductFilters();
          toast("success", "حذف شد", `${ids.length} محصول حذف شد`);
        },
      });
    });
    $("#btnBulkCancel").addEventListener("click", () => {
      productsState.selected.clear();
      renderProductsTable();
    });

    $("#btnExport").addEventListener("click", () => {
      const rows = productsState.filtered.map(
        (p) => `${p.name},${p.brand},${p.category},${p.price},${p.stock}`,
      );
      const csv = "نام,برند,دسته,قیمت,موجودی\n" + rows.join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "products.csv";
      a.click();
      toast("success", "خروجی گرفته شد", "فایل CSV محصولات دانلود شد");
    });

    $("#btnAddProduct").addEventListener("click", () => openProductForm(null));
  }

  async function deleteProduct(id) {
    await withFallback(() => api.del(`${API.products}/${id}`), null);
    productsState.all = productsState.all.filter(
      (p) => String(p._id) !== String(id),
    );
    productsState.selected.delete(id);
    applyProductFilters();
    toast("success", "محصول حذف شد", "");
  }

  /* ---- Product form (create / edit) ---- */
  let currentGallery = [];
  function openProductForm(product) {
    $("#productForm").reset();
    $$(".field", $("#productForm")).forEach((f) =>
      f.classList.remove("field--error"),
    );
    currentGallery = product ? [...(product.images || [])] : [];
    renderGallery();

    $("#productModalTitle").textContent = product
      ? "ویرایش محصول"
      : "افزودن محصول جدید";
    $("#productId").value = product ? product._id : "";
    $("#pName").value = product ? product.name : "";
    $("#pPrice").value = product ? product.price : "";
    $("#pDiscount").value = product ? product.discount || 0 : 0;
    $("#pStock").value = product ? product.stock : "";
    $("#pAvailability").value = product
      ? product.availability || (product.stock ? "in" : "out")
      : "in";
    $("#pDescription").value = product ? product.description || "" : "";
    $("#pSpecs").value = product ? product.specs || "" : "";
    $("#pFeatured").checked = !!(product && product.featured);
    if (product) {
      $("#pCategory").value = product.category;
      $("#pBrand").value = product.brand;
    }
    openModal("modalProduct");
  }

  function renderGallery() {
    const grid = $("#productGallery");
    grid.innerHTML = currentGallery
      .map(
        (src, i) => `
      <div class="gallery-item" data-idx="${i}">
        ${i === 0 ? '<span class="gallery-item__main-badge">اصلی</span>' : ""}
        <img src="${src}" alt="">
        <div class="gallery-item__actions">
          <button data-set-main="${i}" title="تعیین به‌عنوان اصلی"><svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M12 2L14.5 8.5L21 9L16 13.5L17.5 20L12 16.5L6.5 20L8 13.5L3 9L9.5 8.5L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>
          <button class="danger" data-remove="${i}" title="حذف تصویر"><svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </div>
      </div>`,
      )
      .join("");
  }

  function initGalleryEvents() {
    const dz = $("#productDropzone");
    const input = $("#productImageInput");
    dz.addEventListener("click", () => input.click());
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("is-dragover");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("is-dragover"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("is-dragover");
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener("change", () => handleFiles(input.files));

    $("#productGallery").addEventListener("click", (e) => {
      const setBtn = e.target.closest("[data-set-main]");
      const rmBtn = e.target.closest("[data-remove]");
      if (setBtn) {
        const i = Number(setBtn.dataset.setMain);
        const [main] = currentGallery.splice(i, 1);
        currentGallery.unshift(main);
        renderGallery();
      }
      if (rmBtn) {
        currentGallery.splice(Number(rmBtn.dataset.remove), 1);
        renderGallery();
      }
    });
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        currentGallery.push(e.target.result);
        renderGallery();
      };
      reader.readAsDataURL(file);
    });
  }

  function validateProductForm() {
    let valid = true;
    const required = [
      ["#pName", $("#pName").value.trim()],
      ["#pBrand", $("#pBrand").value],
      ["#pCategory", $("#pCategory").value],
      ["#pPrice", $("#pPrice").value !== "" && Number($("#pPrice").value) >= 0],
      ["#pStock", $("#pStock").value !== "" && Number($("#pStock").value) >= 0],
    ];
    required.forEach(([sel, ok]) => {
      const field = $(sel).closest(".field");
      field.classList.toggle("field--error", !ok);
      if (!ok) valid = false;
    });
    return valid;
  }

  async function saveProduct() {
    if (!validateProductForm()) {
      toast("warning", "اطلاعات ناقص", "لطفاً فیلدهای ستاره‌دار را تکمیل کنید");
      return;
    }
    const id = $("#productId").value;
    const payload = {
      name: $("#pName").value.trim(),
      brand: $("#pBrand").value,
      category: $("#pCategory").value,
      price: Number($("#pPrice").value),
      discount: Number($("#pDiscount").value || 0),
      stock: Number($("#pStock").value),
      availability: $("#pAvailability").value,
      description: $("#pDescription").value,
      specs: $("#pSpecs").value,
      featured: $("#pFeatured").checked,
      images: currentGallery,
    };

    const saveBtn = $("#btnSaveProduct");
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner"></span> در حال ذخیره…';
    try {
      let saved;
      if (id)
        saved = await withFallback(
          () => api.put(`${API.products}/${id}`, payload),
          { ...payload, _id: id },
        );
      else
        saved = await withFallback(() => api.post(API.products, payload), {
          ...payload,
          _id: uid("p"),
          createdAt: new Date(),
        });

      if (id) {
        const idx = productsState.all.findIndex(
          (p) => String(p._id) === String(id),
        );
        if (idx > -1)
          productsState.all[idx] = { ...productsState.all[idx], ...payload };
      } else {
        productsState.all.unshift(
          saved._id
            ? saved
            : { ...payload, _id: uid("p"), createdAt: new Date() },
        );
      }
      populateProductFilters();
      applyProductFilters();
      closeModal("modalProduct");
      toast(
        "success",
        id ? "محصول به‌روزرسانی شد" : "محصول اضافه شد",
        payload.name,
      );
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "ذخیره محصول";
    }
  }

  function openProductView(p) {
    if (!p) return;
    $("#productViewBody").innerHTML = `
      <div style="display:flex; gap:16px; margin-bottom:16px;">
        <img src="${(p.images && p.images[0]) || "https://picsum.photos/seed/ph/200"}" style="width:96px;height:96px;border-radius:14px;object-fit:cover;">
        <div>
          <div style="font-weight:800; font-size:16px;">${escapeHtml(p.name)}</div>
          <div style="color:var(--text-secondary); font-size:12.5px; margin-top:4px;">${escapeHtml(p.brand)} · ${escapeHtml(p.category)}</div>
          <div style="margin-top:8px;">${availabilityBadge(p)}</div>
        </div>
      </div>
      <div class="form-grid">
        <div class="field"><label>قیمت</label><div class="cell-price">${fmtCurrency(p.price)}</div></div>
        <div class="field"><label>موجودی</label><div>${fmtNumber(p.stock)} عدد</div></div>
        <div class="field field--full"><label>توضیحات</label><div style="color:var(--text-secondary);">${escapeHtml(p.description) || "بدون توضیحات"}</div></div>
      </div>
      <div class="gallery-grid">${(p.images || []).map((src) => `<div class="gallery-item"><img src="${src}"></div>`).join("") || ""}</div>`;
    openModal("modalProductView");
  }

  function initProductModalButtons() {
    $("#btnSaveProduct").addEventListener("click", saveProduct);
  }

  /* ==================================================================== *
   * 11. ORDERS MODULE
   * ==================================================================== */
  const ordersState = {
    all: [],
    filtered: [],
    page: 1,
    perPage: 8,
    loaded: false,
  };
  const ORDER_PAY = {
    paid: ["success", "پرداخت‌شده"],
    pending: ["warning", "در انتظار"],
    failed: ["danger", "ناموفق"],
  };
  const ORDER_SHIP = {
    pending: ["neutral", "در انتظار"],
    shipped: ["info", "ارسال‌شده"],
    delivered: ["success", "تحویل‌شده"],
  };

  async function loadOrders() {
    if (ordersState.loaded) return renderOrdersTable();
    ordersState.all = await withFallback(
      () => api.get(API.orders),
      demo.orders,
    );
    ordersState.loaded = true;
    applyOrderFilters();
  }

  function applyOrderFilters() {
    const q = ($("#orderSearch").value || "").toLowerCase();
    const status = $("#filterOrderStatus").value;
    ordersState.filtered = ordersState.all.filter((o) => {
      if (q && !`${o.id} ${o.customer}`.toLowerCase().includes(q)) return false;
      if (status && o.shipping !== status && o.payment !== status) return false;
      return true;
    });
    ordersState.page = 1;
    renderOrdersTable();
  }

  function renderOrdersTable() {
    const { filtered, page, perPage } = ordersState;
    const start = (page - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);
    $("#ordersBody").innerHTML =
      rows
        .map((o) => {
          const [payCls, payLabel] = ORDER_PAY[o.payment] || ORDER_PAY.pending;
          const [shipCls, shipLabel] =
            ORDER_SHIP[o.shipping] || ORDER_SHIP.pending;
          return `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:700;">${o.id}</td>
        <td>${escapeHtml(o.customer)}</td>
        <td class="cell-price">${fmtCurrency(o.total)}</td>
        <td><span class="badge badge--${payCls}">${payLabel}</span></td>
        <td><span class="badge badge--${shipCls}">${shipLabel}</span></td>
        <td>${fmtDate(o.date)}</td>
        <td class="cell-actions">
          <button class="icon-btn btn--sm" style="width:32px;height:32px;" data-order-view="${o.id}" title="مشاهده"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M2 12C4 7 8 4.5 12 4.5C16 4.5 20 7 22 12C20 17 16 19.5 12 19.5C8 19.5 4 17 2 12Z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/></svg></button>
        </td>
      </tr>`;
        })
        .join("") ||
      `<tr><td colspan="7"><div class="empty-state"><div class="empty-state__title">سفارشی یافت نشد</div></div></td></tr>`;
    $("#ordersPageInfo").textContent =
      `نمایش ${fmtNumber(rows.length)} از ${fmtNumber(filtered.length)} سفارش`;
    renderPager("#ordersPager", filtered.length, page, perPage, (p) => {
      ordersState.page = p;
      renderOrdersTable();
    });
  }

  function initOrdersEvents() {
    $("#orderSearch").addEventListener(
      "input",
      debounce(applyOrderFilters, 250),
    );
    $("#filterOrderStatus").addEventListener("change", applyOrderFilters);
    $("#ordersBody").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-order-view]");
      if (!btn) return;
      const order = ordersState.all.find((o) => o.id === btn.dataset.orderView);
      openOrderModal(order);
    });
  }

  function openOrderModal(o) {
    if (!o) return;
    $("#orderModalTitle").textContent = `سفارش ${o.id}`;
    const [payCls, payLabel] = ORDER_PAY[o.payment] || ORDER_PAY.pending;
    const [shipCls, shipLabel] = ORDER_SHIP[o.shipping] || ORDER_SHIP.pending;
    $("#orderModalBody").innerHTML = `
      <div class="form-grid" style="margin-bottom:16px;">
        <div class="field"><label>مشتری</label><div>${escapeHtml(o.customer)}</div></div>
        <div class="field"><label>تاریخ ثبت</label><div>${fmtDate(o.date)}</div></div>
        <div class="field"><label>وضعیت پرداخت</label><span class="badge badge--${payCls}">${payLabel}</span></div>
        <div class="field">
          <label>وضعیت ارسال</label>
          <select class="select" id="orderShipSelect">
            ${Object.entries(ORDER_SHIP)
              .map(
                ([k, v]) =>
                  `<option value="${k}" ${k === o.shipping ? "selected" : ""}>${v[1]}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table"><thead><tr><th>کالا</th><th>تعداد</th><th>قیمت</th></tr></thead>
        <tbody>${o.items.map((it) => `<tr><td>${escapeHtml(it.name)}</td><td>${fmtNumber(it.qty)}</td><td class="cell-price">${fmtCurrency(it.price)}</td></tr>`).join("")}</tbody></table>
      </div>
      <div style="text-align:end; margin-top:12px; font-weight:800;">مبلغ کل: ${fmtCurrency(o.total)}</div>`;
    $("#orderShipSelect").addEventListener("change", (e) => {
      o.shipping = e.target.value;
      renderOrdersTable();
      toast("success", "وضعیت به‌روزرسانی شد", `سفارش ${o.id}`);
    });
    $("#btnPrintInvoice").onclick = () => window.print();
    openModal("modalOrder");
  }

  /* ==================================================================== *
   * 12. USERS MODULE
   * ==================================================================== */
  const usersState = {
    all: [],
    filtered: [],
    page: 1,
    perPage: 8,
    loaded: false,
  };
  async function loadUsers() {
    if (usersState.loaded) return renderUsersTable();
    usersState.all = await withFallback(() => api.get(API.users), demo.users);
    usersState.loaded = true;
    usersState.filtered = usersState.all;
    renderUsersTable();
    $("#userSearch").addEventListener(
      "input",
      debounce(() => {
        const q = $("#userSearch").value.toLowerCase();
        usersState.filtered = usersState.all.filter((u) =>
          `${u.name} ${u.email}`.toLowerCase().includes(q),
        );
        usersState.page = 1;
        renderUsersTable();
      }, 250),
    );
  }
  function renderUsersTable() {
    const { filtered, page, perPage } = usersState;
    const start = (page - 1) * perPage;
    $("#usersBody").innerHTML = filtered
      .slice(start, start + perPage)
      .map(
        (u) => `
      <tr>
        <td><div class="cell-product"><img class="avatar" src="${u.avatar}"><div class="cell-product__name">${escapeHtml(u.name)}</div></div></td>
        <td>${escapeHtml(u.email)}</td>
        <td style="font-family:var(--font-mono);">${escapeHtml(u.phone)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td><span class="badge badge--${u.status === "active" ? "success" : "neutral"}">${u.status === "active" ? "فعال" : "غیرفعال"}</span></td>
        <td class="cell-actions">
          <button class="icon-btn btn--sm" style="width:32px;height:32px;" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M4 20L4.8 16.4L16 5.2C16.8 4.4 18 4.4 18.8 5.2C19.6 6 19.6 7.2 18.8 8L7.6 19.2L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
          <button class="icon-btn btn--sm" style="width:32px;height:32px;color:var(--coral);" title="حذف"><svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M4 7H20M9 7V4H15V7M6 7L7 20H17L18 7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
        </td>
      </tr>`,
      )
      .join("");
    $("#usersPageInfo").textContent = `${fmtNumber(filtered.length)} کاربر`;
    renderPager("#usersPager", filtered.length, page, perPage, (p) => {
      usersState.page = p;
      renderUsersTable();
    });
  }

  /* ==================================================================== *
   * 13. CATEGORIES / BRANDS / REVIEWS / DISCOUNTS / COUPONS / BANNERS
   * ==================================================================== */
  function loadCategories() {
    $("#categoryTree").innerHTML = demo.categories
      .map(
        (c) => `
      <div class="category-tree__item">
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style="color:var(--signal)"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>
        <b>${escapeHtml(c.name)}</b>
        <span style="color:var(--text-faint); font-size:12px;">(${c.children.length} زیرمجموعه)</span>
        <div class="cell-actions" style="margin-inline-start:auto;">
          <button class="btn btn--ghost btn--sm">ویرایش</button>
          <button class="btn btn--danger btn--sm">حذف</button>
        </div>
      </div>
      <div class="category-tree__children">
        ${c.children
          .map(
            (ch) => `
          <div class="category-tree__item">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style="color:var(--text-faint)"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            ${escapeHtml(ch.name)}
            <div class="cell-actions" style="margin-inline-start:auto;">
              <button class="btn btn--ghost btn--sm">ویرایش</button>
              <button class="btn btn--danger btn--sm">حذف</button>
            </div>
          </div>`,
          )
          .join("")}
      </div>`,
      )
      .join("");
  }

  function loadBrands() {
    $("#brandsGrid").innerHTML = demo.brands
      .map(
        (b) => `
      <div class="stat-card" style="--accent:var(--signal)">
        <div class="stat-card__top">
          <img src="${b.logo}" style="width:42px;height:42px;border-radius:12px;object-fit:contain;background:var(--bg-sunken);padding:6px;" onerror="this.style.display='none'">
          <div class="cell-actions">
            <button class="icon-btn btn--sm" style="width:32px;height:32px;" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 20L4.8 16.4L16 5.2C16.8 4.4 18 4.4 18.8 5.2C19.6 6 19.6 7.2 18.8 8L7.6 19.2L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
          </div>
        </div>
        <div class="stat-card__value" style="font-size:16px;">${escapeHtml(b.name)}</div>
        <div class="stat-card__label">${fmtNumber(b.count)} محصول</div>
      </div>`,
      )
      .join("");
  }

  function loadReviews() {
    const map = {
      pending: ["warning", "در انتظار"],
      approved: ["success", "تایید‌شده"],
      rejected: ["danger", "رد‌شده"],
    };
    $("#reviewsBody").innerHTML = demo.reviews
      .map((r) => {
        const [cls, label] = map[r.status];
        return `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.customer)}</td>
        <td>${escapeHtml(r.product)}</td>
        <td class="rating-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
        <td style="max-width:280px;">${escapeHtml(r.text)}</td>
        <td><span class="badge badge--${cls}">${label}</span></td>
        <td class="cell-actions">
          <button class="btn btn--sm btn--ghost" data-review="approved" data-id="${r.id}">تایید</button>
          <button class="btn btn--sm btn--danger" data-review="rejected" data-id="${r.id}">رد</button>
        </td>
      </tr>`;
      })
      .join("");
    $("#reviewsBody").onclick = (e) => {
      const btn = e.target.closest("[data-review]");
      if (!btn) return;
      const rev = demo.reviews.find((r) => r.id === btn.dataset.id);
      rev.status = btn.dataset.review;
      loadReviews();
      toast("success", "ثبت شد", "وضعیت نظر به‌روزرسانی شد");
    };
  }

  function loadDiscounts() {
    $("#discountsBody").innerHTML = demo.discounts
      .map(
        (d) => `
      <tr>
        <td>${escapeHtml(d.title)}</td>
        <td>${d.type === "percent" ? "درصدی" : "مبلغ ثابت"}</td>
        <td>${d.type === "percent" ? d.value + "٪" : fmtCurrency(d.value)}</td>
        <td>${d.start}</td><td>${d.end}</td>
        <td><span class="badge badge--${d.active ? "success" : "neutral"}">${d.active ? "فعال" : "غیرفعال"}</span></td>
        <td class="cell-actions">
          <button class="icon-btn btn--sm" style="width:32px;height:32px;" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 20L4.8 16.4L16 5.2C16.8 4.4 18 4.4 18.8 5.2C19.6 6 19.6 7.2 18.8 8L7.6 19.2L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
          <button class="icon-btn btn--sm" style="width:32px;height:32px;color:var(--coral);" title="حذف"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </td>
      </tr>`,
      )
      .join("");
  }

  function loadCoupons() {
    $("#couponsBody").innerHTML = demo.coupons
      .map(
        (c) => `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:700;">${c.code}</td>
        <td>${c.type === "percent" ? "درصدی" : "مبلغ ثابت"}</td>
        <td>${c.type === "percent" ? c.value + "٪" : fmtCurrency(c.value)}</td>
        <td>${fmtNumber(c.used)}</td>
        <td>${c.expires}</td>
        <td><span class="badge badge--${c.active ? "success" : "neutral"}">${c.active ? "فعال" : "منقضی"}</span></td>
        <td class="cell-actions">
          <button class="icon-btn btn--sm" style="width:32px;height:32px;" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 20L4.8 16.4L16 5.2C16.8 4.4 18 4.4 18.8 5.2C19.6 6 19.6 7.2 18.8 8L7.6 19.2L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>
          <button class="icon-btn btn--sm" style="width:32px;height:32px;color:var(--coral);" title="حذف"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </td>
      </tr>`,
      )
      .join("");
  }

  function loadBanners() {
    $("#bannerGrid").innerHTML = demo.banners
      .map(
        (b) => `
      <div class="gallery-item" style="aspect-ratio:2/1;">
        <img src="${b.image}" alt="${escapeHtml(b.title)}">
        <div class="gallery-item__actions">
          <button title="پیش‌نمایش"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M2 12C4 7 8 4.5 12 4.5C16 4.5 20 7 22 12C20 17 16 19.5 12 19.5C8 19.5 4 17 2 12Z" stroke="currentColor" stroke-width="1.6"/></svg></button>
          <button class="danger" data-remove-banner="${b.id}" title="حذف"><svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </div>
      </div>`,
      )
      .join("");
    $("#bannerGrid").onclick = (e) => {
      const btn = e.target.closest("[data-remove-banner]");
      if (!btn) return;
      confirmAction({
        title: "حذف بنر؟",
        message: "این بنر از صفحه اصلی حذف خواهد شد.",
        onConfirm: () => {
          demo.banners = demo.banners.filter(
            (b) => b.id !== btn.dataset.removeBanner,
          );
          loadBanners();
          toast("success", "حذف شد", "");
        },
      });
    };
  }

  /* ==================================================================== *
   * 14. Misc buttons (settings save, quick "add" buttons show a toast —
   *     hook these to a real modal/form the same way products is wired)
   * ==================================================================== */
  function initMiscButtons() {
    $("#btnSaveSettings").addEventListener("click", async () => {
      await withFallback(() => api.post(API.settings, {}), null);
      toast("success", "تنظیمات ذخیره شد", "تغییرات با موفقیت اعمال شد");
    });
    [
      ["btnAddCategory", "دسته‌بندی"],
      ["btnAddBrand", "برند"],
      ["btnAddDiscount", "تخفیف"],
      ["btnAddCoupon", "کوپن"],
      ["btnAddBanner", "بنر"],
    ].forEach(([id, label]) => {
      const el = $(`#${id}`);
      if (el)
        el.addEventListener("click", () =>
          toast(
            "info",
            `افزودن ${label}`,
            "فرم افزودن را به همین شکل فرم محصول متصل کنید",
          ),
        );
    });
    $("#logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      confirmAction({
        title: "خروج از حساب؟",
        message: "برای ادامه باید دوباره وارد شوید.",
        onConfirm: () => toast("info", "خروج انجام شد", ""),
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 15. Module loader map (lazy init per view)
   * ------------------------------------------------------------------ */
  const moduleLoaders = {
    dashboard: loadDashboard,
    products: () => loadProducts(),
    orders: loadOrders,
    users: loadUsers,
    categories: loadCategories,
    brands: loadBrands,
    reviews: loadReviews,
    discounts: loadDiscounts,
    coupons: loadCoupons,
    banners: loadBanners,
  };

  /* ------------------------------------------------------------------ *
   * 16. Init
   * ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initSidebar();
    initModals();
    initProductsEvents();
    initGalleryEvents();
    initProductModalButtons();
    initOrdersEvents();
    initMiscButtons();
    initRouter(); // triggers first module load based on current hash
  });
})();
