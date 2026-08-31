(() => {
  const add = (tag, attrs = {}, text = "") => { const el = document.createElement(tag); Object.assign(el, attrs); if (text) el.textContent = text; return el; };
  const start = () => {
    if (document.getElementById("plAssistant")) return;

    if (!document.getElementById("pl-assistant-toggle-style")) {
      const style = add("style", { id: "pl-assistant-toggle-style" });
      style.textContent = `
        #plAssistantToggle {
          position: fixed; right: 22px; bottom: 92px; z-index: 1750;
          width: 62px; height: 62px; padding: 0; border: 2px solid #bfdbfe; border-radius: 50%;
          display: grid; place-items: center; cursor: pointer; color: #fff;
          background: #75acf0;
          box-shadow: 0 8px 20px rgba(96, 165, 250, .28);
          transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
        }
        #plAssistantToggle:hover { transform: translateY(-2px) scale(1.02); background: #8bbcf7; box-shadow: 0 11px 24px rgba(96, 165, 250, .34); }
        #plAssistantToggle:focus-visible { outline: 3px solid rgba(147, 197, 253, .65); outline-offset: 3px; }
        #plAssistantToggle svg { width: 38px; height: 38px; display: block; }

        #plAssistant {
          position: fixed; right: 22px; bottom: 166px; z-index: 1749;
          width: min(360px, calc(100vw - 32px)); max-height: min(520px, calc(100vh - 190px));
          display: none; flex-direction: column; overflow: hidden;
          direction: rtl; background: #fff; border: 1px solid #cfe1fb; border-radius: 18px;
          box-shadow: 0 16px 38px rgba(59, 130, 246, .18);
          font-family: Vazirmatn, Tahoma, sans-serif;
        }
        #plAssistant.open { display: flex; animation: plAssistantPop .16s ease-out; }
        @keyframes plAssistantPop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .pl-ai-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:13px 15px; background:#eff6ff; border-bottom:1px solid #dbeafe; color:#2563eb; }
        .pl-ai-title { display:flex; flex-direction:column; gap:2px; font-weight:800; font-size:14px; }
        .pl-ai-title small { color:#64748b; font-size:10px; font-weight:600; }
        #plAssistantClose { width:30px; height:30px; border:0; border-radius:9px; background:#dbeafe; color:#4b89dd; font-size:22px; line-height:1; cursor:pointer; }
        .pl-ai-messages { flex:1; min-height:160px; overflow:auto; padding:13px; background:#fff; }
        .pl-ai-msg { width:fit-content; max-width:88%; margin:0 0 9px; padding:9px 11px; border-radius:12px; font-size:12px; line-height:1.8; }
        .pl-ai-msg.bot { background:#eff6ff; color:#334155; border:1px solid #dbeafe; }
        .pl-ai-msg.user { margin-right:auto; background:#75acf0; color:#fff; }
        .pl-ai-form { display:flex; gap:7px; padding:11px; background:#f8fbff; border-top:1px solid #e5efff; }
        #plAssistantInput { flex:1; min-width:0; height:38px; border:1px solid #cfe1fb; border-radius:10px; padding:0 10px; outline:none; font:12px Vazirmatn,Tahoma,sans-serif; }
        #plAssistantInput:focus { border-color:#93c5fd; box-shadow:0 0 0 3px rgba(147,197,253,.22); }
        .pl-ai-form button { border:0; border-radius:10px; padding:0 13px; background:#75acf0; color:#fff; font:700 12px Vazirmatn,Tahoma,sans-serif; cursor:pointer; }

        @media (max-width: 768px) {
          #plAssistantToggle { right: 16px; bottom: 84px; width: 58px; height: 58px; }
          #plAssistant { right: 16px; bottom: 154px; max-height: min(500px, calc(100vh - 176px)); }
        }
      `;
      document.head.appendChild(style);
    }

    const toggle = add("button", { id: "plAssistantToggle", type: "button", title: "دستیار خرید هوشمند", ariaLabel: "باز کردن دستیار خرید هوشمند" });
    toggle.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 16h28c6.6 0 12 5.4 12 12v14c0 6.6-5.4 12-12 12H36l-4 6-4-6H18C11.4 54 6 48.6 6 42V28c0-6.6 5.4-12 12-12Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/><circle cx="23" cy="35" r="3" fill="currentColor"/><circle cx="32" cy="35" r="3" fill="currentColor"/><circle cx="41" cy="35" r="3" fill="currentColor"/></svg>';
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