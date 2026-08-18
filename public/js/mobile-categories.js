(() => {
  const rail = document.getElementById("mobileCategoryRail");
  const content = document.getElementById("mobileCategoryContent");
  const search = document.getElementById("mobileCategorySearch");
  if (!rail || !content) return;

  const icons = {
    mobile: '<svg class="mobile-category-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 18.5h4"/></svg>',
    tablet: '<svg class="mobile-category-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M11 18h2"/></svg>',
    headphone: '<svg class="mobile-category-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1z"/><path d="M20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>',
    watch: '<svg class="mobile-category-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="10" height="12" rx="2"/><path d="M9 6 10 3h4l1 3M9 18l1 3h4l1-3"/></svg>',
    console: '<svg class="mobile-category-rail-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10a4 4 0 0 1 3.8 2.8l1 3.5A2 2 0 0 1 19.9 18h-2.3l-2-2H8.4l-2 2H4.1a2 2 0 0 1-1.9-2.7l1-3.5A4 4 0 0 1 7 9z"/><path d="M7 13v3M5.5 14.5h3M16 14h.01M18 15.5h.01"/></svg>'
  };
  const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

  const categories = [
    {
      id: "mobile",
      name: "موبایل",
      links: [
        { label: "خرید آیفون", href: "/iphone" },
        { label: "خرید گوشی سامسونگ", href: "/samsung" },
        { label: "خرید گوشی شیائومی", href: "/xiaomi" }
      ],
      allHref: "/mobiles"
    },
    {
      id: "tablet",
      name: "تبلت",
      links: [
        { label: "خرید تبلت اپل", href: "/ipad" },
        { label: "خرید تبلت سامسونگ", href: "/samsungtab" },
        { label: "خرید تبلت شیائومی", href: "/xiaomitab" }
      ],
      allHref: "/ipad"
    },
    {
      id: "headphone",
      name: "هدفون و هندزفری",
      links: [
        { label: "هدفون اپل", soon: true },
        { label: "هدفون سامسونگ", soon: true }
      ]
    },
    {
      id: "watch",
      name: "ساعت هوشمند",
      links: [
        { label: "ساعت اپل", soon: true },
        { label: "ساعت سامسونگ", soon: true }
      ]
    },
    {
      id: "console",
      name: "کنسول بازی",
      links: [
        { label: "خرید کنسول سونی", href: "/console" }
      ],
      allHref: "/console"
    }
  ];

  let activeId = categories[0].id;

  function renderContent(category) {
    const links = category.links
      .map((link) => link.soon
        ? '<div class="mobile-category-link is-soon"><span>' + link.label + '</span><small>به‌زودی</small></div>'
        : '<a class="mobile-category-link" href="' + link.href + '"><span>' + link.label + '</span>' + chevron + '</a>')
      .join("");

    content.innerHTML =
      '<div class="mobile-category-content-head">' + icons[category.id] + '<span>' + category.name + '</span></div>' +
      links +
      (category.allHref ? '<a class="mobile-category-all" href="' + category.allHref + '">مشاهده همه ' + category.name + chevron + '</a>' : '');
  }

  function activate(id) {
    activeId = id;
    rail.querySelectorAll(".mobile-category-rail-item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.category === id);
    });
    renderContent(categories.find((category) => category.id === id));
  }

  categories.forEach((category) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "mobile-category-rail-item";
    item.dataset.category = category.id;
    item.innerHTML = icons[category.id] + '<span>' + category.name + '</span>';
    item.addEventListener("click", () => activate(category.id));
    rail.appendChild(item);
  });

  search?.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("fa");
    if (!query) {
      activate(activeId);
      return;
    }

    const matched = categories.filter((category) =>
      category.name.toLocaleLowerCase("fa").includes(query) ||
      category.links.some((link) => link.label.toLocaleLowerCase("fa").includes(query))
    );

    rail.querySelectorAll(".mobile-category-rail-item").forEach((item) => {
      item.hidden = !matched.some((category) => category.id === item.dataset.category);
    });

    if (matched.length) {
      renderContent(matched[0]);
    } else {
      content.innerHTML = '<p class="mobile-category-empty">دسته‌بندی یا زیر‌دسته‌ای پیدا نشد.</p>';
    }
  });

  activate(activeId);
})();
