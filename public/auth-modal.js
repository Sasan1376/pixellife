(function () {
  if (window.__sharedAuthModal) return;
  window.__sharedAuthModal = true;

  const style = document.createElement("style");
  style.textContent = `
    #sharedAuthModal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);padding:20px}
    #sharedAuthModal.open{display:flex}
    #sharedAuthModal .shared-auth-box{width:400px;max-width:100%;background:#fff;border-radius:28px;padding:28px;box-shadow:0 20px 60px rgba(15,23,42,.22);direction:rtl;font-family:inherit}
    #sharedAuthModal h2{margin:0 0 28px;color:#0f172a;font-size:25px}
    #sharedAuthModal p{color:#64748b;font-size:16px;line-height:1.8;margin:0 0 28px}
    #sharedAuthModal .shared-auth-close{float:left;border:0;border-radius:50%;width:52px;height:52px;background:#f8fafc;color:#64748b;font-size:25px;cursor:pointer}
    #sharedAuthModal label{display:block;color:#334155;font-weight:700;margin-bottom:8px}
    #sharedAuthModal input{box-sizing:border-box;width:100%;padding:14px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:right}
    #sharedAuthModal button[type=submit]{width:100%;margin-top:22px;border:0;border-radius:10px;padding:14px;background:#2563eb;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "sharedAuthModal";
  modal.innerHTML = `<div class="shared-auth-box">
    <button class="shared-auth-close" type="button" aria-label="بستن">×</button>
    <h2>ورود به حساب کاربری</h2>
    <p>شماره موبایل یا ایمیل خود را وارد کنید تا وارد حساب کاربری شوید.</p>
    <form><label for="sharedAuthIdentifier">شماره موبایل یا ایمیل</label>
      <input id="sharedAuthIdentifier" type="text" autocomplete="username" required>
      <button type="submit">ادامه</button>
    </form>
  </div>`;
  document.body.appendChild(modal);

  window.openLoginModal = function () {
    modal.classList.add("open");
    setTimeout(() => document.getElementById("sharedAuthIdentifier").focus(), 0);
  };
  window.closeLoginModal = function () { modal.classList.remove("open"); };
  modal.querySelector(".shared-auth-close").onclick = window.closeLoginModal;
  modal.onclick = (event) => { if (event.target === modal) window.closeLoginModal(); };
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") window.closeLoginModal(); });
  modal.querySelector("form").onsubmit = (event) => { event.preventDefault(); };
})();
