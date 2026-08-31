(() => {
  const currentPath = location.pathname;
  const productOpen = currentPath === "/admin/products";
  const links = [
    { href: "/admin/products", icon: "ti-package", text: "همهٔ محصولات", match: "/admin/products" },
    { href: "/admin/products?category=mobile", icon: "ti-device-mobile", text: "موبایل" },
    { href: "/admin/products?category=tablet", icon: "ti-tablet", text: "تبلت" },
    { href: "/admin/products?category=headphones", icon: "ti-headphones", text: "هدفون و هندزفری" },
    { href: "/admin/products?category=watch", icon: "ti-watch", text: "ساعت هوشمند" },
    { href: "/admin/products?category=console", icon: "ti-device-gamepad-2", text: "کنسول بازی" }
  ];
  const active = (path) => currentPath === path ? " active" : "";
  const categoryLinks = links.map(link =>
    '<li><a class="admin-submenu-link' + (link.match && currentPath === link.match ? " active" : "") +
    '" href="' + link.href + '"><i class="ti ' + link.icon + '"></i><span>' + link.text + '</span></a></li>'
  ).join("");

  const sidebar = '<div class="admin-sidebar-brand"><a href="/admin/products"><span class="admin-brand-mark">P</span><span>Pixel<span>Life</span></span></a></div>' +
    '<nav class="admin-sidebar-nav" aria-label="منوی مدیریت">' +
      '<a href="/admin/products" class="admin-nav-link' + active("/admin/products") + '"><i class="ti ti-layout-dashboard"></i><span>داشبورد محصولات</span></a>' +
      '<section class="admin-nav-group' + (productOpen ? " open" : "") + '">' +
        '<button type="button" class="admin-nav-toggle" aria-expanded="' + productOpen + '"><span><i class="ti ti-category-2"></i> دسته‌بندی محصولات</span><i class="ti ti-chevron-down admin-chevron"></i></button>' +
        '<ul class="admin-submenu">' + categoryLinks + '</ul>' +
      '</section>' +
      '<div class="admin-nav-divider">مدیریت فروشگاه</div>' +
      '<a href="/admin/orders" class="admin-nav-link' + active("/admin/orders") + '"><i class="ti ti-shopping-bag"></i><span>سفارش‌ها</span></a>' +
      '<a href="/admin/customers" class="admin-nav-link' + active("/admin/customers") + '"><i class="ti ti-users"></i><span>مشتریان</span></a>' +
      '<a href="/admin/reviews" class="admin-nav-link' + active("/admin/reviews") + '"><i class="ti ti-message-star"></i><span>مدیریت نظرات</span></a>' +
      '<div class="admin-nav-divider">ابزارها</div>' +
      '<a href="/admin/ai-products" class="admin-nav-link' + active("/admin/ai-products") + '"><i class="ti ti-sparkles"></i><span>دستیار هوشمند محصولات</span></a>' +
      '<a href="/admin/analytics" class="admin-nav-link' + active("/admin/analytics") + '"><i class="ti ti-chart-bar"></i><span>آمار بازدید</span></a>' +
      '<a href="/" class="admin-nav-link admin-site-link" target="_blank"><i class="ti ti-external-link"></i><span>مشاهدهٔ سایت</span></a>' +
    '</nav>';

  let aside = document.querySelector(".app-sidebar");
  if (!aside) {
    aside = document.createElement("aside");
    aside.className = "app-sidebar admin-injected-sidebar";
    document.body.prepend(aside);
    document.body.classList.add("admin-standalone-page");
  }
  aside.innerHTML = sidebar;
  aside.classList.add("admin-unified-sidebar");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "admin-mobile-toggle";
  toggle.setAttribute("aria-label", "باز و بسته کردن منوی مدیریت");
  toggle.innerHTML = '<i class="ti ti-menu-2"></i>';
  document.body.append(toggle);

  const close = () => document.body.classList.remove("admin-sidebar-visible");
  toggle.addEventListener("click", () => document.body.classList.toggle("admin-sidebar-visible"));
  document.addEventListener("click", (event) => {
    if (document.body.classList.contains("admin-sidebar-visible") && !aside.contains(event.target) && !toggle.contains(event.target)) close();
  });

  aside.querySelector(".admin-nav-toggle").addEventListener("click", (event) => {
    const group = event.currentTarget.closest(".admin-nav-group");
    const open = group.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
})();