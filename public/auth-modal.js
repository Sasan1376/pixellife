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

    // Ensure Featured Products always shows exactly one correct iPhone 17 Pro Max card.
    // This also acts as a fallback if the homepage products API script gets stuck on "loading".
    const renderFeaturedIphone = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      let priceHtml = "";
      const existingIphone = Array.from(
        grid.querySelectorAll("a.product-card"),
      ).find((card) => {
        const name = card.querySelector("h3")?.textContent || "";
        const href = card.getAttribute("href") || "";
        return /iphone\s*17/i.test(name) || /iphone-17/i.test(href);
      });

      if (existingIphone) {
        const price = existingIphone.querySelector(".product-price");
        if (price) priceHtml = price.outerHTML;
      }

      grid.innerHTML = `
        <a href="/product/iphone-17-pro-max" class="product-card" aria-label="iPhone 17 Pro Max">
          <img src="/images/apple/iphone-17.webp" alt="iPhone 17 Pro Max">
          <h3>iPhone 17 Pro Max</h3>
          ${priceHtml}
        </a>
      `;
    };

    const startFeaturedProductsFix = () => {
      const grid = document.getElementById("featuredProductsGrid");
      if (!grid) return;

      // Give the normal API renderer a moment; then normalize/fallback to one correct card.
      setTimeout(renderFeaturedIphone, 700);
      setTimeout(renderFeaturedIphone, 1800);

      // If the API later replaces the grid with duplicate/wrong cards, normalize again once.
      const observer = new MutationObserver(() => {
        const cards = grid.querySelectorAll("a.product-card");
        if (cards.length !== 1) {
          renderFeaturedIphone();
          return;
        }

        const card = cards[0];
        const href = card.getAttribute("href");
        const img = card.querySelector("img")?.getAttribute("src");
        if (
          href !== "/product/iphone-17-pro-max" ||
          img !== "/images/apple/iphone-17.webp"
        ) {
          renderFeaturedIphone();
        }
      });

      observer.observe(grid, { childList: true });
      setTimeout(() => observer.disconnect(), 5000);
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
