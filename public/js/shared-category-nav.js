(function () {
  if (window.__pixelLifeSharedCategoryNav) return;
  window.__pixelLifeSharedCategoryNav = true;

  const toggle = document.getElementById('catsToggle');
  const panel = document.getElementById('megamenuPanel');
  const cats = document.getElementById('megamenuCats');
  const content = document.getElementById('megamenuContent');
  const wrap = toggle && toggle.closest('.nav-cats-wrap');

  if (!toggle || !panel || !cats || !content || !wrap) return;

  const categoryData = [
    {
      id: 'mobile',
      title: 'موبایل',
      icon: 'ti-device-mobile',
      links: [
        ['همه موبایل‌ها', '/mobiles'],
        ['آیفون', '/iphone'],
        ['سامسونگ', '/samsung'],
        ['شیائومی', '/xiaomi'],
      ],
    },
    {
      id: 'tablet',
      title: 'تبلت',
      icon: 'ti-device-tablet',
      links: [
        ['آیپد', '/ipad'],
        ['تبلت سامسونگ', '/samsungtab'],
        ['تبلت شیائومی', '/xiaomitab'],
      ],
    },
    {
      id: 'console',
      title: 'کنسول بازی',
      icon: 'ti-device-gamepad-2',
      links: [
        ['همه کنسول‌ها', '/console'],
        ['PlayStation', '/console'],
      ],
    },
    {
      id: 'accessories',
      title: 'لوازم جانبی',
      icon: 'ti-headphones',
      links: [
        ['هدفون و هندزفری', '/mobiles'],
        ['شارژر و کابل', '/mobiles'],
        ['لوازم جانبی موبایل', '/mobiles'],
      ],
    },
  ];

  let activeId = categoryData[0].id;
  let closeTimer = null;

  function renderCategories() {
    cats.innerHTML = categoryData
      .map(
        (item) =>
          `<button type="button" class="megamenu-cat${item.id === activeId ? ' active' : ''}" data-cat="${item.id}"><i class="ti ${item.icon}"></i><span>${item.title}</span><i class="ti ti-chevron-left"></i></button>`,
      )
      .join('');
  }

  function renderContent(id) {
    const item = categoryData.find((entry) => entry.id === id) || categoryData[0];
    activeId = item.id;
    content.innerHTML = `
      <div class="megamenu-section-title">${item.title}</div>
      <div class="megamenu-links-grid">
        ${item.links
          .map(
            ([label, href], index) =>
              `<a class="megamenu-link${index === 0 ? ' see-all' : ''}" href="${href}"><span>${label}</span><i class="ti ti-chevron-left"></i></a>`,
          )
          .join('')}
      </div>`;
    renderCategories();
  }

  function openMenu() {
    clearTimeout(closeTimer);
    panel.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    panel.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMenu, 120);
  }

  renderContent(activeId);
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');

  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    panel.classList.contains('open') ? closeMenu() : openMenu();
  });

  cats.addEventListener('mouseover', function (event) {
    const item = event.target.closest('[data-cat]');
    if (!item) return;
    const id = item.getAttribute('data-cat');
    if (id && id !== activeId) renderContent(id);
  });

  cats.addEventListener('click', function (event) {
    const item = event.target.closest('[data-cat]');
    if (!item) return;
    event.preventDefault();
    renderContent(item.getAttribute('data-cat'));
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    wrap.addEventListener('mouseenter', openMenu);
    wrap.addEventListener('mouseleave', scheduleClose);
    panel.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
    panel.addEventListener('mouseleave', scheduleClose);
  }

  document.addEventListener('click', function (event) {
    if (!wrap.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenu();
  });
})();