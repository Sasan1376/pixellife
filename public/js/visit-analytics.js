(() => {
  if (window.__pixelLifeVisitTracked) return;
  window.__pixelLifeVisitTracked = true;

  fetch("/api/analytics/track", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: window.location.pathname || "/" }),
    keepalive: true,
  }).catch(() => {});
})();
