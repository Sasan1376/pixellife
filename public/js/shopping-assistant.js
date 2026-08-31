(() => {
  const add = (tag, attrs = {}, text = "") => { const el = document.createElement(tag); Object.assign(el, attrs); if (text) el.textContent = text; return el; };
  const start = () => {
    if (document.getElementById("plAssistant")) return;

    if (!document.getElementById("pl-assistant-toggle-style")) {
      const style = add("style", { id: "pl-assistant-toggle-style" });
      style.textContent = `
        #plAssistantToggle {
          position: fixed; right: 22px; bottom: 92px; z-index: 1750;
          width: 62px; height: 62px; padding: 0; border: 0; border-radius: 50%;
          display: grid; place-items: center; cursor: pointer; color: #fff;
          background: linear-gradient(145deg, #3b82f6, #2563eb);
          box-shadow: 0 10px 24px rgba(37, 99, 235, .32), 0 3px 8px rgba(15, 23, 42, .14);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        #plAssistantToggle:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 14px 28px rgba(37, 99, 235, .38), 0 4px 10px rgba(15, 23, 42, .14); }
        #plAssistantToggle:focus-visible { outline: 3px solid rgba(96, 165, 250, .42); outline-offset: 3px; }
        #plAssistantToggle svg { width: 37px; height: 37px; display: block; }
        @media (max-width: 768px) { #plAssistantToggle { right: 16px; bottom: 84px; width: 58px; height: 58px; } }
      `;
      document.head.appendChild(style);
    }

    const toggle = add("button", { id: "plAssistantToggle", type: "button", title: "دستیار خرید هوشمند", ariaLabel: "باز کردن دستیار خرید هوشمند" });
    toggle.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 15h30c6.1 0 11 4.9 11 11v17c0 6.1-4.9 11-11 11H35.5L30 60l-5.5-6H17c-6.1 0-11-4.9-11-11V26c0-6.1 4.9-11 11-11Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><circle cx="23" cy="34" r="3.2" fill="currentColor"/><circle cx="32" cy="34" r="3.2" fill="currentColor"/><circle cx="41" cy="34" r="3.2" fill="currentColor"/></svg>';
    const panel = add("section", { id: "plAssistant", ariaLabel: "دستیار خرید PixelLife" });
    panel.innerHTML = '<div class="pl-ai-head"><div class="pl-ai-title"><span>دستیار خرید PixelLife</span><small dir="rtl">قدرت گرفته از <bdi>OpenAI</bdi></small></div><button id="plAssistantClose" type="button" aria-label="بستن">×</button></div><div class="pl-ai-messages" id="plAssistantMessages"><div class="pl-ai-msg bot">سلام! برای انتخاب گوشی، تبلت یا کنسول مناسب راهنمایی‌تان می‌کنم. بودجه و کاربردتان را بنویسید.</div></div><form class="pl-ai-form" id="plAssistantForm"><input id="plAssistantInput" maxlength="800" autocomplete="off" placeholder="مثلاً گوشی مناسب بازی تا ۵۰ میلیون" /><button type="submit">ارسال</button></form>';
    document.body.append(toggle, panel);
    const input = document.getElementById("plAssistantInput"), messages = document.getElementById("plAssistantMessages");
    const addMessage = (text, kind) => { const el = add("div", { className: "pl-ai-msg " + kind }, text); messages.appendChild(el); messages.scrollTop = messages.scrollHeight; return el; };
    toggle.addEventListener("click", () => { panel.classList.add("open"); input.focus(); });
    document.getElementById("plAssistantClose").addEventListener("click", () => panel.classList.remove("open"));
    document.addEventListener("click", (event) => {
      if (panel.classList.contains("open") && !panel.contains(event.target) && !toggle.contains(event.target)) {
        panel.classList.remove("open");
      }
    });
    document.getElementById("plAssistantForm").addEventListener("submit", async (event) => {
      event.preventDefault(); const message = input.value.trim(); if (!message) return;
      addMessage(message, "user"); input.value = ""; input.disabled = true;
      const pending = addMessage("در حال بررسی محصولات سایت…", "bot");
      try {
        const response = await fetch("/api/ai/shopping-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
        const data = await response.json(); pending.remove();
        if (!response.ok || !data.success) throw new Error(data.message || "خطا");
        addMessage(data.answer, "bot");
        if (data.products?.length) addMessage("محصولات مرتبط: " + data.products.slice(0, 3).map((p) => p.name).join("، "), "bot");
      } catch (_) { pending.textContent = "متأسفانه در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید."; }
      input.disabled = false; input.focus();
    });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();