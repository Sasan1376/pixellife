(() => {
  const placeholder = [...document.querySelectorAll(".home-promo-placeholder")].find(
    (item) => item.textContent.trim() === "Banner placeholder 3",
  );

  if (!placeholder) return;

  placeholder.className = "home-promo-placeholder has-image ps5-pro-promo";
  placeholder.href = "/console";
  placeholder.setAttribute("aria-label", "مشاهده کنسول‌های بازی");
  placeholder.innerHTML = `
    <img src="/images/ps5-pro-blue-promo-banner.webp" alt="کنسول بازی PS5 Pro" />
    <span class="ps5-pro-promo__content">
      <strong>PS5 Pro</strong>
      <span>قدرت نسل بعد، آمادهٔ بازی</span>
      <em>مشاهده کنسول‌ها <i class="ti ti-arrow-left"></i></em>
    </span>`;

  if (document.getElementById("ps5-pro-promo-style")) return;

  const style = document.createElement("style");
  style.id = "ps5-pro-promo-style";
  style.textContent = `
    .ps5-pro-promo { position: relative; isolation: isolate; color: #fff; background: #050822; }
    .ps5-pro-promo img { object-position: right center; }
    .ps5-pro-promo::after { content: ""; position: absolute; inset: 0; z-index: 0; background: linear-gradient(90deg, rgba(3, 6, 25, .76), rgba(3, 6, 25, .04)); pointer-events: none; }
    .ps5-pro-promo__content { position: absolute; z-index: 1; inset: 0; padding: 24px 22px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; text-align: left; direction: rtl; gap: 3px; }
    .ps5-pro-promo__content strong { direction: ltr; font-family: Arial, sans-serif; font-size: clamp(24px, 2.4vw, 32px); letter-spacing: -.6px; line-height: 1.1; text-shadow: 0 2px 12px rgba(0, 0, 0, .55); }
    .ps5-pro-promo__content > span { font-size: 13px; font-weight: 600; }
    .ps5-pro-promo__content em { display: inline-flex; align-items: center; gap: 4px; margin-top: 9px; padding: 5px 10px; border-radius: 999px; background: #fff; color: #102a8c; font-size: 12px; font-style: normal; font-weight: 800; }
    .ps5-pro-promo:hover .ps5-pro-promo__content em { background: #dbeafe; }
  `;
  document.head.appendChild(style);
})();