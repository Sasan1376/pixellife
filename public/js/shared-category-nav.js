(function () {
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;
  if (window.__pixelLifeSharedCategoryNavV3) return;
  window.__pixelLifeSharedCategoryNavV3 = true;

  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Rebuild the ENTIRE navbar content to match index.html exactly.
  navbar.innerHTML = `
    <div class="navbar-inner">
      <div class="nav-cats-wrap">
        <button class="nav-cats" id="catsToggle" type="button">
          <i class="ti ti-menu-2"></i> همه دسته‌بندی‌ها
          <i class="ti ti-chevron-down"></i>
        </button>
        <div class="megamenu-panel" id="megamenuPanel">
          <div class="megamenu-cats" id="megamenuCats"></div>
          <div class="megamenu-content" id="megamenuContent"></div><aside class="megamenu-promo" id="megamenuPromo"></aside>
        </div>
      </div>
      <a href="/" class="nav-link"><i class="ti ti-home"></i> خانه</a>
      <a href="/offers" class="nav-link"><i class="ti ti-flame"></i> پیشنهاد ویژه</a>
      <a href="/new" class="nav-link"><i class="ti ti-sparkles"></i> تازه‌ها</a>
      <a href="/bestsellers" class="nav-link"><i class="ti ti-trending-up"></i> پرفروش‌ترین</a>
      <a href="/brands" class="nav-link"><i class="ti ti-building-store"></i> برندها</a>
      <a href="/blog" class="nav-link"><i class="ti ti-article"></i> مجله</a>
    </div>`;

  document.querySelectorAll('#megamenuBackdrop').forEach((el) => el.remove());
  const backdrop = document.createElement('div');
  backdrop.className = 'megamenu-backdrop';
  backdrop.id = 'megamenuBackdrop';
  document.body.appendChild(backdrop);

  const wrap = navbar.querySelector('.nav-cats-wrap');
  const toggle = navbar.querySelector('#catsToggle');
  const panel = navbar.querySelector('#megamenuPanel');
  const cats = navbar.querySelector('#megamenuCats');
  const content = navbar.querySelector('#megamenuContent');
  const promo = navbar.querySelector('#megamenuPromo');

  const categoriesData = [
    {
      id: 'mobile',
      name: 'موبایل',
      icon: 'ti-device-mobile',
      links: [
        { label: 'خرید آیفون', href: '/iphone' },
        { label: 'خرید گوشی سامسونگ', href: '/samsung' },
        { label: 'خرید گوشی شیائومی', href: '/xiaomi' },
      ],
      seeAllHref: '/mobiles',
    },
    {
      id: 'mobile-accessories',
      name: 'لوازم جانبی موبایل',
      icon: 'ti-headphones',
      links: [
        { label: 'لوازم جانبی اپل', href: '/accessories/apple' },
        { label: 'لوازم جانبی سامسونگ', href: '/accessories/samsung' },
        { label: 'لوازم جانبی شیائومی', href: '/accessories/xiaomi' },
      ],
      seeAllHref: '/mobiles?category=%D9%84%D9%88%D8%A7%D8%B2%D9%85%20%D8%AC%D8%A7%D9%86%D8%A8%DB%8C%20%D9%85%D9%88%D8%A8%D8%A7%DB%8C%D9%84',
    },
    {
      id: 'tablet',
      name: 'تبلت',
      icon: 'ti-device-tablet',
      links: [
        { label: 'خرید تبلت اپل', href: '/ipad' },
        { label: 'خرید تبلت سامسونگ', href: '/samsungtab' },
        { label: 'خرید تبلت شیائومی', href: '/xiaomitab' },
      ],
      seeAllHref: '/ipad',
    },
    {
      id: 'headphone',
      name: 'هدفون و هندزفری',
      icon: 'ti-headphones',
      links: [
        { label: 'خرید هدفون اپل', href: '/headphones?brand=%D8%A7%D9%BE%D9%84' },
        { label: 'خرید هدفون سامسونگ', href: '/headphones?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF' },
      ],
      seeAllHref: '/headphones',
    },
    {
      id: 'watch',
      name: 'ساعت هوشمند',
      icon: 'ti-device-watch',
      links: [
        { label: 'خرید ساعت اپل', href: '/smartwatches?brand=%D8%A7%D9%BE%D9%84' },
        { label: 'خرید ساعت سامسونگ', href: '/smartwatches?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF' },
      ],
      seeAllHref: '/smartwatches',
    },
    {
      id: 'console',
      name: 'کنسول بازی',
      icon: 'ti-device-gamepad-2',
      links: [{ label: 'خرید کنسول سونی', href: '/console' }],
      seeAllHref: '/console',
    },
  ];

  const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.documentElement.classList.toggle('desktop-hover', hoverMedia.matches);

  function activateCat(catId) {
    cats.querySelectorAll('.megamenu-cat-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cat === catId);
    });
    content.querySelectorAll('.megamenu-content-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.catPanel === catId);
    });
    const cat = categoriesData.find((item) => item.id === catId);
    if (promo && cat) promo.innerHTML = `<div class="promo-kicker"><i class="ti ti-sparkles"></i> منتخب PixelLife</div><strong>${cat.name}</strong><p>پرفروش‌ترین انتخاب‌های این دسته را ببینید.</p><a href="${cat.seeAllHref}">مشاهده محصولات <i class="ti ti-arrow-left"></i></a>`;
  }

  categoriesData.forEach((cat, idx) => {
    const catBtn = document.createElement('button');
    catBtn.type = 'button';
    catBtn.className = 'megamenu-cat-btn' + (idx === 0 ? ' active' : '');
    catBtn.dataset.cat = cat.id;
    catBtn.innerHTML = `
      <i class="ti ${cat.icon} cat-ico"></i>
      <span>${cat.name}</span>
      <i class="ti ti-chevron-left cat-arrow"></i>`;
    cats.appendChild(catBtn);

    const catPanel = document.createElement('div');
    catPanel.className = 'megamenu-content-panel' + (idx === 0 ? ' active' : '');
    catPanel.dataset.catPanel = cat.id;
    catPanel.innerHTML = `
      <div class="megamenu-content-title"><i class="ti ${cat.icon}"></i>${cat.name}</div>
      <div class="megamenu-links">
        ${cat.links.map((l) => `<a href="${l.href}" class="megamenu-link">${l.label}<i class="ti ti-chevron-left"></i></a>`).join('')}
        <a href="${cat.seeAllHref}" class="megamenu-link see-all">مشاهده همه ${cat.name}<i class="ti ti-arrow-left"></i></a>
      </div>`;
    content.appendChild(catPanel);
    if (idx === 0) activateCat(cat.id);

    const activate = (event) => {
      if (event) event.stopPropagation();
      activateCat(cat.id);
    };
    catBtn.addEventListener('click', activate);
    if (hoverMedia.matches) catBtn.addEventListener('mouseenter', activate);
  });

  let isOpen = false;
  let closeTimer = null;

  function openMegamenu() {
    clearTimeout(closeTimer);
    isOpen = true;
    panel.classList.add('open');
    backdrop.classList.add('open');
    toggle.classList.add('active');
  }

  function closeMegamenu() {
    isOpen = false;
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    toggle.classList.remove('active');
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMegamenu, 200);
  }

  if (hoverMedia.matches) {
    wrap.addEventListener('mouseenter', openMegamenu);
    wrap.addEventListener('mouseleave', scheduleClose);
  }

  function updateHeaderHeight() {
    const header = document.querySelector('.header');
    if (!header) return;
    document.documentElement.style.setProperty(
      '--header-height',
      Math.ceil(header.getBoundingClientRect().height) + 'px',
    );
  }
  updateHeaderHeight();
  window.addEventListener('resize', updateHeaderHeight);
  window.addEventListener('orientationchange', updateHeaderHeight);

  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    isOpen ? closeMegamenu() : openMegamenu();
  });

  backdrop.addEventListener('click', closeMegamenu);
  document.addEventListener('click', function (event) {
    if (isOpen && !panel.contains(event.target) && !toggle.contains(event.target)) {
      closeMegamenu();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) closeMegamenu();
  });
})();
