(function () {
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;
  if (window.__pixelLifeSharedCategoryNavV2) return;
  window.__pixelLifeSharedCategoryNavV2 = true;

  const navbar = document.querySelector('.navbar');
  const navbarInner = navbar && navbar.querySelector('.navbar-inner');
  if (!navbar || !navbarInner) return;

  let wrap = navbarInner.querySelector('.nav-cats-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'nav-cats-wrap';
    navbarInner.prepend(wrap);
  }

  // Rebuild the category area so old page-specific markup/listeners cannot conflict.
  wrap.replaceChildren();

  const toggle = document.createElement('button');
  toggle.className = 'nav-cats';
  toggle.id = 'catsToggle';
  toggle.type = 'button';
  toggle.innerHTML = '<i class="ti ti-menu-2"></i> همه دسته‌بندی‌ها <i class="ti ti-chevron-down"></i>';

  const panel = document.createElement('div');
  panel.className = 'megamenu-panel';
  panel.id = 'megamenuPanel';

  const cats = document.createElement('div');
  cats.className = 'megamenu-cats';
  cats.id = 'megamenuCats';

  const content = document.createElement('div');
  content.className = 'megamenu-content';
  content.id = 'megamenuContent';

  panel.append(cats, content);
  wrap.append(toggle, panel);

  let backdrop = document.getElementById('megamenuBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'megamenu-backdrop';
    backdrop.id = 'megamenuBackdrop';
    document.body.appendChild(backdrop);
  } else {
    backdrop.className = 'megamenu-backdrop';
  }

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
        { label: 'خرید هدفون اپل', href: '#' },
        { label: 'خرید هدفون سامسونگ', href: '#' },
      ],
      seeAllHref: '#',
    },
    {
      id: 'watch',
      name: 'ساعت هوشمند',
      icon: 'ti-device-watch',
      links: [
        { label: 'خرید ساعت اپل', href: '#' },
        { label: 'خرید ساعت سامسونگ', href: '#' },
      ],
      seeAllHref: '#',
    },
    {
      id: 'console',
      name: 'کنسول بازی',
      icon: 'ti-device-gamepad-2',
      links: [{ label: 'خرید کنسول سونی', href: '#' }],
      seeAllHref: '#',
    },
  ];

  const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.documentElement.classList.toggle('desktop-hover', hoverMedia.matches);

  function activateCat(catId) {
    cats.querySelectorAll('.megamenu-cat-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.cat === catId);
    });
    content.querySelectorAll('.megamenu-content-panel').forEach((p) => {
      p.classList.toggle('active', p.dataset.catPanel === catId);
    });
  }

  categoriesData.forEach((cat, idx) => {
    const catBtn = document.createElement('button');
    catBtn.type = 'button';
    catBtn.className = 'megamenu-cat-btn' + (idx === 0 ? ' active' : '');
    catBtn.dataset.cat = cat.id;
    catBtn.innerHTML = '<i class="ti ' + cat.icon + ' cat-ico"></i><span>' + cat.name + '</span><i class="ti ti-chevron-left cat-arrow"></i>';
    cats.appendChild(catBtn);

    const catPanel = document.createElement('div');
    catPanel.className = 'megamenu-content-panel' + (idx === 0 ? ' active' : '');
    catPanel.dataset.catPanel = cat.id;
    catPanel.innerHTML =
      '<div class="megamenu-content-title"><i class="ti ' + cat.icon + '"></i>' + cat.name + '</div>' +
      '<div class="megamenu-links">' +
      cat.links.map((l) => '<a href="' + l.href + '" class="megamenu-link">' + l.label + '<i class="ti ti-chevron-left"></i></a>').join('') +
      '<a href="' + cat.seeAllHref + '" class="megamenu-link see-all">مشاهده همه ' + cat.name + '<i class="ti ti-arrow-left"></i></a>' +
      '</div>';
    content.appendChild(catPanel);

    const activate = function (event) {
      if (event) event.stopPropagation();
      activateCat(cat.id);
    };
    catBtn.addEventListener('click', activate);
    catBtn.addEventListener('pointerup', function (event) {
      if (event.pointerType === 'touch') {
        event.preventDefault();
        activate(event);
      }
    });
    if (hoverMedia.matches) catBtn.addEventListener('mouseenter', activate);
  });

  let open = false;
  let closeTimer = null;

  function openMegamenu() {
    clearTimeout(closeTimer);
    open = true;
    panel.classList.add('open');
    backdrop.classList.add('open');
    toggle.classList.add('active');
  }

  function closeMegamenu() {
    open = false;
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

  let lastHeaderHeight = '';
  function updateHeaderHeight() {
    const header = document.querySelector('.header');
    if (!header) return;
    const height = Math.ceil(header.getBoundingClientRect().height) + 'px';
    if (height !== lastHeaderHeight) {
      lastHeaderHeight = height;
      document.documentElement.style.setProperty('--header-height', height);
    }
  }
  updateHeaderHeight();
  window.addEventListener('resize', updateHeaderHeight);
  window.addEventListener('orientationchange', updateHeaderHeight);

  toggle.addEventListener('click', function (event) {
    event.stopPropagation();
    if (toggle.dataset.touchHandled === '1') {
      delete toggle.dataset.touchHandled;
      return;
    }
    open ? closeMegamenu() : openMegamenu();
  });

  toggle.addEventListener('pointerup', function (event) {
    if (event.pointerType === 'touch') {
      event.preventDefault();
      event.stopPropagation();
      toggle.dataset.touchHandled = '1';
      open ? closeMegamenu() : openMegamenu();
    }
  });

  backdrop.addEventListener('click', closeMegamenu);
  document.addEventListener('click', function (event) {
    if (open && !panel.contains(event.target) && !toggle.contains(event.target)) closeMegamenu();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && open) closeMegamenu();
  });
})();
