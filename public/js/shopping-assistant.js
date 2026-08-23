(() => {
  const add = (tag, attrs = {}, text = "") => { const el = document.createElement(tag); Object.assign(el, attrs); if (text) el.textContent = text; return el; };
  const start = () => {
    if (document.getElementById("plAssistant")) return;
    const toggle = add("button", { id: "plAssistantToggle", type: "button" }, "دستیار خرید");
    const panel = add("section", { id: "plAssistant", ariaLabel: "دستیار خرید PixelLife" });
    panel.innerHTML = '<div class="pl-ai-head"><span>دستیار خرید PixelLife</span><button id="plAssistantClose" type="button" aria-label="بستن">×</button></div><div class="pl-ai-messages" id="plAssistantMessages"><div class="pl-ai-msg bot">سلام! برای انتخاب گوشی، تبلت یا کنسول مناسب راهنمایی‌تان می‌کنم. بودجه و کاربردتان را بنویسید.</div></div><form class="pl-ai-form" id="plAssistantForm"><input id="plAssistantInput" maxlength="800" autocomplete="off" placeholder="مثلاً گوشی مناسب بازی تا ۵۰ میلیون" /><button type="submit">ارسال</button></form>';
    document.body.append(toggle, panel);
    const input = document.getElementById("plAssistantInput"), messages = document.getElementById("plAssistantMessages");
    const addMessage = (text, kind) => { const el = add("div", { className: "pl-ai-msg " + kind }, text); messages.appendChild(el); messages.scrollTop = messages.scrollHeight; return el; };
    toggle.addEventListener("click", () => { panel.classList.add("open"); input.focus(); });
    document.getElementById("plAssistantClose").addEventListener("click", () => panel.classList.remove("open"));
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