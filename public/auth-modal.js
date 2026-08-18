(function () {
  const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html";

  if (isHomePage) {
    // Keep the profile menu above the sticky category/navbar.
    const profileLayerFix = document.createElement("style");
    profileLayerFix.id = "profile-layer-fix";
    profileLayerFix.textContent = `
      .header { z-index: 1200 !important; }
      .profile-dropdown { z-index: 1300 !important; }
    `;
    document.head.appendChild(profileLayerFix);

    // Keep exactly one iPhone 17 Pro Max card in Featured Products,
    // force the correct product image, and link it to the real product page.
    const enforceSingleFeaturedIphone = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      const cards = Array.from(grid.querySelectorAll("a.product-card"));
      if (!cards.length) return;

      let iphoneCard = cards.find((card) => {
        const name = card.querySelector("h3")?.textContent || "";
        const href = card.getAttribute("href") || "";
        return /iphone\s*17/i.test(name) || /iphone-17/i.test(href);
      });

      if (!iphoneCard) return;

      const onlyCard = iphoneCard.cloneNode(true);
      onlyCard.setAttribute("href", "/product/iphone-17-pro-max");

      const image = onlyCard.querySelector("img");
      if (image) {
        image.setAttribute("src", "/images/apple/iphone-17.webp");
        image.setAttribute("alt", "iPhone 17 Pro Max");
      }

      const title = onlyCard.querySelector("h3");
      if (title) title.textContent = "iPhone 17 Pro Max";

      grid.replaceChildren(onlyCard);
    };

    const startFeaturedProductsFix = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      const observer = new MutationObserver(enforceSingleFeaturedIphone);
      observer.observe(grid, { childList: true, subtree: false });

      enforceSingleFeaturedIphone();
      setTimeout(enforceSingleFeaturedIphone, 250);
      setTimeout(enforceSingleFeaturedIphone, 1000);
      setTimeout(enforceSingleFeaturedIphone, 2500);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startFeaturedProductsFix, {
        once: true,
      });
    } else {
      startFeaturedProductsFix();
    }
  }

  // Load the original authentication modal code unchanged.
  const authCore = document.createElement("script");
  authCore.src = "/auth-modal-core.js";
  authCore.async = false;
  document.head.appendChild(authCore);
})();
