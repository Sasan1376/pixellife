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

    // Render one stable iPhone 17 Pro Max card without MutationObserver.
    // This avoids repeated DOM mutations that can make the homepage unstable on reload.
    const renderFeaturedIphone = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      let priceHtml = "";
      const existingPrice = grid.querySelector(".product-card .product-price");
      if (existingPrice) priceHtml = existingPrice.outerHTML;

      grid.innerHTML = `
        <a href="/product/iphone-17-pro-max" class="product-card" aria-label="iPhone 17 Pro Max">
          <img src="/images/apple/iphone-17.webp" alt="iPhone 17 Pro Max">
          <h3>iPhone 17 Pro Max</h3>
          ${priceHtml}
        </a>
      `;
    };

    const startFeaturedProductsFix = () => {
      // Show the card immediately instead of leaving "در حال بارگذاری محصولات" on screen.
      renderFeaturedIphone();

      // The original homepage API may finish a little later and overwrite the grid.
      // Re-apply only a couple of times; no observer and no infinite DOM loop.
      setTimeout(renderFeaturedIphone, 1000);
      setTimeout(renderFeaturedIphone, 3000);
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
