(() => {
  document.addEventListener(
    "click",
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const anchor = event.target.closest("a[href^='#']");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") || "";
      const fragment = href.slice(1);
      // لینک‌های موقت # نباید حتی یک ورودی خالی به تاریخچه اضافه کنند.
      if (!fragment) {
        event.preventDefault();
        return;
      }
      let target;
      try {
        target = document.getElementById(decodeURIComponent(fragment));
      } catch (_) {
        target = document.getElementById(fragment);
      }
      // فقط لنگرهای واقعی صفحه را بدون تغییر hash اسکرول می‌دهیم؛ سایر
      // رفتارهای ویژهٔ برنامه دست‌نخورده باقی می‌مانند.
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    true,
  );
})();
