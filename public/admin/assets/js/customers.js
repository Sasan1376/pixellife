/* ============================================================
   هُما — اتصال صفحه مشتریان به API واقعی (/admin/users)
   ============================================================ */
(function () {
  "use strict";

  const toFa = (num, decimals = 0) =>
    Number(num || 0).toLocaleString("fa-IR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    let payload = null;
    const text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { message: text };
    }
    if (!response.ok) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }
    return payload;
  }

  function displayName(user) {
    if (user.mobile) return user.mobile;
    if (user.email) return user.email;
    return "کاربر";
  }

  function initial(user) {
    const name = displayName(user);
    return name.replace(/\D/g, "").slice(0, 1) || name.slice(0, 1) || "ک";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  }

  function renderRow(user) {
    const name = escapeHtml(displayName(user));
    const email = user.email ? escapeHtml(user.email) : "—";
    const badgeChar = escapeHtml(initial(user));
    const statusChip =
      user.role === "admin"
        ? '<span class="chip bg-brand-500/10 text-brand-300">ادمین</span>'
        : user.isActive
          ? '<span class="chip bg-brand-500/10 text-brand-300">فعال</span>'
          : '<span class="chip bg-rose/10 text-rose">غیرفعال</span>';

    return `
      <tr class="order-row">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-aqua-500 text-xs font-extrabold text-ink-950">${badgeChar}</span>
            <div>
              <p class="font-semibold text-white">${name}</p>
              <p class="text-[11px] text-slate-500">عضویت: ${formatDate(user.createdAt)}</p>
            </div>
          </div>
        </td>
        <td class="px-4 py-4 text-slate-400" dir="ltr">${email}</td>
        <td class="px-4 py-4 font-bold text-white">—</td>
        <td class="px-4 py-4 font-bold text-brand-300">—</td>
        <td class="px-4 py-4">${statusChip}</td>
      </tr>`;
    // ستون‌های «سفارش‌ها» و «مجموع خرید» به مدل Order وابسته‌اند که هنوز
    // پیاده‌سازی نشده؛ فعلاً «—» نمایش داده می‌شود.
  }

  async function loadCustomers() {
    const tbody = document.getElementById("customersTableBody");
    if (!tbody) return;

    try {
      const data = await api("/admin/users?limit=50");
      const users = data.users || [];

      const counterEl = document.getElementById("totalCustomersCounter");
      if (counterEl) {
        counterEl.removeAttribute("data-counter");
        counterEl.textContent = toFa(data.count ?? users.length);
      }

      if (!users.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-10 text-center text-sm text-slate-500">
              هنوز کاربری ثبت نشده است
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = users.map(renderRow).join("");
    } catch (error) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-10 text-center text-sm text-rose">
            خطا در دریافت لیست مشتریان: ${escapeHtml(error.message)}
          </td>
        </tr>`;
    }
  }

  document.addEventListener("DOMContentLoaded", loadCustomers);
})();
