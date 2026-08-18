(function () {
  const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html";

  // Keep the profile menu above the sticky category/navbar only on the homepage.
  if (isHomePage) {
    const profileLayerFix = document.createElement("style");
    profileLayerFix.id = "profile-layer-fix";
    profileLayerFix.textContent = `
      .header { z-index: 1200 !important; }
      .profile-dropdown { z-index: 1300 !important; }
    `;
    document.head.appendChild(profileLayerFix);

    // In the featured-products section, keep only the real canonical iPhone 17 Pro Max card.
    // The card itself is still rendered from the real products API, so its image/name/price stay in sync with the database.
    const keepCanonicalFeaturedIphone = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return false;

      const canonicalCard = grid.querySelector(
        'a.product-card[href="/product/iphone-17-pro-max"]',
      );

      if (!canonicalCard) return false;

      const onlyCard = canonicalCard.cloneNode(true);
      grid.replaceChildren(onlyCard);
      return true;
    };

    const startFeaturedProductsFix = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      if (keepCanonicalFeaturedIphone()) return;

      const observer = new MutationObserver(() => {
        if (keepCanonicalFeaturedIphone()) observer.disconnect();
      });

      observer.observe(grid, { childList: true });
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
