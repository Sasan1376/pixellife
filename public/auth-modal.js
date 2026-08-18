(function () {
  // Keep the profile menu above the sticky category/navbar only on the homepage.
  if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
    const profileLayerFix = document.createElement("style");
    profileLayerFix.id = "profile-layer-fix";
    profileLayerFix.textContent = `
      .header { z-index: 1200 !important; }
      .profile-dropdown { z-index: 1300 !important; }
    `;
    document.head.appendChild(profileLayerFix);
  }

  // Load the original authentication modal code unchanged.
  const authCore = document.createElement("script");
  authCore.src = "/auth-modal-core.js";
  authCore.async = false;
  document.head.appendChild(authCore);
})();
