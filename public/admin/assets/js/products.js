(function () {
  "use strict";

  const state = {
    products: [],
    editingProduct: null,
  };

  const els = {};

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

  const slugify = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    const colors =
      type === "error"
        ? "border-rose/20 bg-rose/10 text-rose-100"
        : "border-brand-500/20 bg-brand-500/10 text-white";
    toast.className = `fixed left-4 top-4 z-[999] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${colors}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      toast.style.transition = "all .25s ease";
    }, 2200);
    setTimeout(() => toast.remove(), 2600);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

  function normalizeProduct(product) {
    return {
      ...product,
      images: Array.isArray(product.images) ? product.images : [],
      specs: product.specs || "",
      discount: Number(product.discount || 0),
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      featured: Boolean(product.featured),
      availability: product.availability || "in",
      category: product.category || "عمومی",
    };
  }

  function statusChip(product) {
    const available = product.availability === "in";
    return available
      ? '<span class="chip bg-brand-500/12 text-brand-300">موجود</span>'
      : '<span class="chip bg-rose/10 text-rose">ناموجود</span>';
  }

  function heroIcon(product) {
    const image = product.images?.[0];
    if (image) {
      return `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" class="h-full w-full object-cover" />`;
    }
    return '<span class="text-5xl">📦</span>';
  }

  function renderGrid(products) {
    if (!els.productGrid) return;
    els.productGrid.innerHTML = products.length
      ? products
          .map(
            (product) => `
          <div class="glass-card animate-fade-up overflow-hidden p-0">
            <div class="relative flex h-40 items-center justify-center bg-gradient-to-br from-brand-500/10 to-aqua-500/10">
              ${heroIcon(product)}
              <span class="absolute left-3 top-3 chip ${product.featured ? "bg-brand-500/12 text-brand-300" : "bg-slate-500/20 text-slate-400"}">${product.featured ? "پرفروش" : "عادی"}</span>
            </div>
            <div class="p-5">
              <p class="text-[11px] text-slate-500">${escapeHtml(product.category)}</p>
              <h3 class="mt-1 font-bold text-white">${escapeHtml(product.name)}</h3>
              <div class="mt-3 flex items-center justify-between">
                <p class="text-lg font-extrabold text-brand-300">${toFa(product.price)} <span class="text-[10px] font-normal text-slate-500">تومان</span></p>
                ${statusChip(product)}
              </div>
              <div class="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>موجودی: <span class="font-bold text-white">${toFa(product.stock)}</span> عدد</span>
                <span class="chip bg-slate-500/20 text-slate-400">${toFa(product.discount)}٪ تخفیف</span>
              </div>
              <div class="mt-4 flex gap-2">
                <button data-edit-product="${product._id}" class="flex-1 rounded-xl bg-brand-500/15 px-3 py-2 text-xs font-semibold text-brand-300">ویرایش</button>
                <button data-delete-product="${product._id}" class="flex-1 rounded-xl bg-rose/10 px-3 py-2 text-xs font-semibold text-rose">حذف</button>
              </div>
            </div>
          </div>`
          )
          .join("")
      : `<div class="glass-card col-span-full p-6 text-sm text-slate-400">هنوز محصولی ثبت نشده است.</div>`;
  }

  function renderTable(products) {
    const tbody = els.productTbody;
    if (!tbody) return;
    tbody.innerHTML = products.length
      ? products
          .map(
            (product) => `
              <tr class="order-row" data-product-id="${product._id}">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-brand-500/12 text-xl">${heroIcon(product)}</span>
                    <div>
                      <span class="font-semibold text-white">${escapeHtml(product.name)}</span>
                      <p class="mt-1 text-[11px] text-slate-500">${escapeHtml(product.slug || "")}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-slate-400">${escapeHtml(product.category)}</td>
                <td class="px-4 py-4 font-bold text-white">${toFa(product.price)} تومان</td>
                <td class="px-4 py-4 ${product.stock <= 5 ? "text-amberx" : "text-brand-300"} font-bold">${toFa(product.stock)}</td>
                <td class="px-4 py-4 text-slate-300">${toFa(product.discount)}٪</td>
                <td class="px-4 py-4">${statusChip(product)}</td>
                <td class="px-4 py-4">
                  <div class="flex gap-2">
                    <button data-edit-product="${product._id}" class="rounded-lg bg-brand-500/15 px-3 py-2 text-[11px] font-semibold text-brand-300">ویرایش</button>
                    <button data-upload-image="${product._id}" class="rounded-lg bg-aqua-500/15 px-3 py-2 text-[11px] font-semibold text-aqua-300">عکس</button>
                    <button data-delete-product="${product._id}" class="rounded-lg bg-rose/10 px-3 py-2 text-[11px] font-semibold text-rose">حذف</button>
                  </div>
                </td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">هنوز محصولی ثبت نشده است.</td></tr>`;
  }

  async function loadProducts() {
    const data = await api("/admin/products");
    state.products = (data.products || []).map(normalizeProduct);
    renderGrid(state.products);
    renderTable(state.products);
  }

  function buildModal() {
    const modal = document.createElement("div");
    modal.id = "productModal";
    modal.className = "fixed inset-0 z-[1000] hidden items-center justify-center bg-ink-950/80 px-4 backdrop-blur-sm";
    modal.innerHTML = `
      <div class="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 shadow-2xl">
        <div class="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h3 id="productModalTitle" class="text-sm font-bold text-white">افزودن محصول</h3>
            <p class="mt-1 text-[11px] text-slate-500">فیلدها مطابق مدل Product هستند.</p>
          </div>
          <button id="closeProductModal" class="icon-btn" aria-label="بستن">×</button>
        </div>
        <form id="productForm" class="grid gap-4 p-5 sm:grid-cols-2">
          <input type="hidden" name="id" />
          <label class="space-y-2"><span class="text-xs text-slate-400">نام</span><input name="name" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" required /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">برند</span><input name="brand" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" required /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">دسته‌بندی</span><input name="category" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">قیمت</span><input name="price" type="number" min="0" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" required /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">تخفیف</span><input name="discount" type="number" min="0" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">موجودی</span><input name="stock" type="number" min="0" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" /></label>
          <label class="space-y-2 sm:col-span-2"><span class="text-xs text-slate-400">توضیحات</span><textarea name="description" rows="3" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none"></textarea></label>
          <label class="space-y-2 sm:col-span-2"><span class="text-xs text-slate-400">مشخصات</span><textarea name="specs" rows="3" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" placeholder="متن specs مطابق مدل"></textarea></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">Slug</span><input name="slug" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none" /></label>
          <label class="space-y-2"><span class="text-xs text-slate-400">وضعیت</span>
            <select name="availability" class="w-full rounded-xl border border-white/[0.06] bg-ink-800/70 px-4 py-3 text-sm text-white outline-none">
              <option value="in">موجود</option>
              <option value="out">ناموجود</option>
            </select>
          </label>
          <label class="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink-800/50 px-4 py-3 sm:col-span-2">
            <input name="featured" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-ink-800" />
            <span class="text-sm text-slate-300">ویژه / پرفروش</span>
          </label>
          <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <div class="text-xs text-slate-500">برای آپلود عکس، بعد از ذخیره محصول از دکمه عکس استفاده کنید.</div>
            <div class="flex gap-2">
              <button type="button" id="cancelProductModal" class="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-slate-300">انصراف</button>
              <button type="submit" class="rounded-xl bg-gradient-to-l from-brand-500 to-aqua-500 px-5 py-2.5 text-sm font-bold text-ink-950">ذخیره</button>
            </div>
          </div>
        </form>
        <div id="productImagesPanel" class="hidden border-t border-white/[0.06] px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-bold text-white">تصاویر محصول</h4>
              <p class="mt-1 text-[11px] text-slate-500">برای حذف، روی دکمه کنار هر تصویر بزنید.</p>
            </div>
            <button id="uploadProductImageBtn" type="button" class="rounded-xl bg-aqua-500/15 px-4 py-2 text-xs font-semibold text-aqua-300">آپلود عکس</button>
          </div>
          <div id="productImagesList" class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(product = null) {
    if (!els.productModal) els.productModal = buildModal();
    const form = els.productForm || els.productModal.querySelector("#productForm");
    els.productForm = form;
    els.productModalTitle = els.productModal.querySelector("#productModalTitle");

    form.reset();
    form.elements.id.value = product?._id || "";
    form.elements.name.value = product?.name || "";
    form.elements.brand.value = product?.brand || "";
    form.elements.category.value = product?.category || "";
    form.elements.price.value = product?.price ?? "";
    form.elements.discount.value = product?.discount ?? 0;
    form.elements.stock.value = product?.stock ?? 0;
    form.elements.description.value = product?.description || "";
    form.elements.specs.value = product?.specs || "";
    form.elements.slug.value = product?.slug || "";
    form.elements.availability.value = product?.availability || "in";
    form.elements.featured.checked = Boolean(product?.featured);
    els.productModalTitle.textContent = product ? "ویرایش محصول" : "افزودن محصول";
    const imagesPanel = els.productModal.querySelector("#productImagesPanel");
    const imagesList = els.productModal.querySelector("#productImagesList");
    const uploadBtn = els.productModal.querySelector("#uploadProductImageBtn");
    if (product?._id) {
      imagesPanel.classList.remove("hidden");
      imagesList.innerHTML = product.images.length
        ? product.images
            .map(
              (image) => `
                <div class="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
                  <img src="${escapeHtml(image)}" alt="" class="h-14 w-14 rounded-xl object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs text-slate-300">${escapeHtml(image)}</p>
                  </div>
                  <button type="button" data-delete-image="${escapeHtml(image)}" class="rounded-lg bg-rose/10 px-3 py-2 text-[11px] font-semibold text-rose">حذف</button>
                </div>`
            )
            .join("")
        : '<p class="text-sm text-slate-400">این محصول هنوز تصویری ندارد.</p>';
      uploadBtn.dataset.productId = product._id;
    } else {
      imagesPanel.classList.add("hidden");
      imagesList.innerHTML = "";
      delete uploadBtn.dataset.productId;
    }
    els.productModal.classList.remove("hidden");
    els.productModal.classList.add("flex");
  }

  function closeModal() {
    els.productModal?.classList.add("hidden");
    els.productModal?.classList.remove("flex");
  }

  async function submitProduct(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const id = form.elements.id.value;
    const payload = {
      name: form.elements.name.value.trim(),
      brand: form.elements.brand.value.trim(),
      category: form.elements.category.value.trim() || "عمومی",
      price: Number(form.elements.price.value || 0),
      discount: Number(form.elements.discount.value || 0),
      stock: Number(form.elements.stock.value || 0),
      description: form.elements.description.value.trim(),
      specs: form.elements.specs.value.trim(),
      slug: form.elements.slug.value.trim() || slugify(form.elements.name.value),
      availability: form.elements.availability.value,
      featured: form.elements.featured.checked,
    };

    const data = await api(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    showToast(data.message || "ذخیره شد");
    closeModal();
    await loadProducts();
  }

  async function deleteProduct(id) {
    if (!confirm("این محصول حذف شود؟")) return;
    const data = await api(`/admin/products/${id}`, { method: "DELETE" });
    showToast(data.message || "حذف شد");
    await loadProducts();
  }

  async function uploadImage(id) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("image", file);
      const data = await api(`/admin/products/${id}/image`, {
        method: "POST",
        body: fd,
      });
      showToast(data.message || "تصویر بارگذاری شد");
      await loadProducts();
    };
    input.click();
  }

  async function deleteImage(productId, image) {
    const data = await api(`/admin/products/${productId}/images`, {
      method: "DELETE",
      body: JSON.stringify({ image }),
    });
    showToast(data.message || "تصویر حذف شد");
    await loadProducts();
    const updated = state.products.find((item) => item._id === productId);
    if (updated && els.productModal?.classList.contains("flex")) openModal(updated);
  }

  function bindEvents() {
    document.addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit-product]");
      const deleteBtn = e.target.closest("[data-delete-product]");
      const uploadBtn = e.target.closest("[data-upload-image]");
      const deleteImageBtn = e.target.closest("[data-delete-image]");
      if (editBtn) {
        const product = state.products.find((item) => item._id === editBtn.dataset.editProduct);
        if (product) openModal(product);
      }
      if (deleteBtn) deleteProduct(deleteBtn.dataset.deleteProduct).catch((err) => showToast(err.message, "error"));
      if (uploadBtn) uploadImage(uploadBtn.dataset.uploadImage).catch((err) => showToast(err.message, "error"));
      if (deleteImageBtn) {
        const productId = els.productModal?.querySelector("#uploadProductImageBtn")?.dataset.productId;
        if (productId && confirm("این تصویر حذف شود؟")) {
          deleteImage(productId, deleteImageBtn.dataset.deleteImage).catch((err) => showToast(err.message, "error"));
        }
      }
    });

    els.addProductBtn?.addEventListener("click", () => openModal());
    els.productForm?.addEventListener("submit", (e) => submitProduct(e).catch((err) => showToast(err.message, "error")));
    els.productModal?.addEventListener("click", (e) => {
      if (e.target === els.productModal) closeModal();
    });
    els.productModal?.querySelector("#closeProductModal")?.addEventListener("click", closeModal);
    els.productModal?.querySelector("#cancelProductModal")?.addEventListener("click", closeModal);
    els.productModal?.querySelector("#uploadProductImageBtn")?.addEventListener("click", () => {
      const productId = els.productModal?.querySelector("#uploadProductImageBtn")?.dataset.productId;
      if (productId) uploadImage(productId).catch((err) => showToast(err.message, "error"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  async function init() {
    els.productGrid = document.getElementById("productGrid");
    els.productTbody = document.querySelector("#productList tbody");
    els.addProductBtn = document.querySelector('[data-product-action="add"]') || [...document.querySelectorAll("button")].find((btn) => btn.textContent.includes("افزودن محصول"));

    if (els.addProductBtn) {
      els.addProductBtn.type = "button";
      els.addProductBtn.dataset.productAction = "add";
    }

    if (!document.getElementById("productModal")) buildModal();
    els.productModal = document.getElementById("productModal");
    els.productForm = document.getElementById("productForm");
    els.productModalTitle = document.getElementById("productModalTitle");

    bindEvents();
    await loadProducts();
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => showToast(err.message, "error"));
  });
})();
