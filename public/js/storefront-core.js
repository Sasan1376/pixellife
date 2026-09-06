(() => {
  if (window.PixelLifeStorefront) return;
  const CART_KEY = "digishop_cart";
  const toNumber = (value, fallback = 1) => Number.isFinite(Number(value)) ? Math.max(1, Math.floor(Number(value))) : fallback;
  const normalizeItem = (item) => {
    if (!item || typeof item !== "object") return null;
    const copy = { ...item };
    const quantity = toNumber(copy.quantity ?? copy.qty, 1);
    copy.quantity = quantity;
    copy.qty = quantity;
    return copy;
  };
  const normalizeCart = (cart) => Array.isArray(cart) ? cart.map(normalizeItem).filter(Boolean) : [];
  const readCart = () => {
    try { return normalizeCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]")); }
    catch (_) { return []; }
  };
  const emitCartChange = () => window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { cart: readCart() } }));
  const nativeSetItem = Storage.prototype.setItem;
  let writing = false;
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    if (this === localStorage && key === CART_KEY && !writing) {
      let normalized = value;
      try { normalized = JSON.stringify(normalizeCart(JSON.parse(value))); } catch (_) {}
      const result = nativeSetItem.call(this, key, normalized);
      queueMicrotask(emitCartChange);
      return result;
    }
    return nativeSetItem.call(this, key, value);
  };
  const writeCart = (cart) => {
    writing = true;
    try { nativeSetItem.call(localStorage, CART_KEY, JSON.stringify(normalizeCart(cart))); }
    finally { writing = false; }
    emitCartChange();
    return readCart();
  };
  const cartCount = () => readCart().reduce((sum, item) => sum + item.quantity, 0);
  const categories = [
    { id: "mobile", name: "موبایل", icon: "ti-device-mobile", seeAllHref: "/mobiles", groups: [
      { title: "انتخاب موبایل", links: [{ label: "خرید آیفون", href: "/iphone" }, { label: "خرید گوشی سامسونگ", href: "/samsung" }, { label: "خرید گوشی شیائومی", href: "/xiaomi" }, { label: "همه محصولات موبایل", href: "/mobiles" }] },
      { title: "لوازم جانبی موبایل", links: [{ label: "کابل، شارژر و آداپتور", href: "/accessories/chargers", children: [{ label: "اپل", href: "/accessories/chargers?brand=%D8%A7%D9%BE%D9%84" }, { label: "سامسونگ", href: "/accessories/chargers?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF" }, { label: "شیائومی", href: "/accessories/chargers?brand=%D8%B4%DB%8C%D8%A7%D8%A6%D9%88%D9%85%DB%8C" }] }, { label: "لوازم جانبی اپل", href: "/accessories/apple" }, { label: "لوازم جانبی سامسونگ", href: "/accessories/samsung" }, { label: "لوازم جانبی شیائومی", href: "/accessories/xiaomi" }, { label: "همه لوازم جانبی موبایل", href: "/accessories" }] }
    ] },
    { id: "tablet", name: "تبلت", icon: "ti-device-tablet", links: [{ label: "خرید تبلت اپل", href: "/ipad" }, { label: "خرید تبلت سامسونگ", href: "/samsungtab" }, { label: "خرید تبلت شیائومی", href: "/xiaomitab" }], seeAllHref: "/ipad" },
    { id: "headphone", name: "هدفون و هندزفری", icon: "ti-headphones", links: [{ label: "هدفون اپل", href: "/headphones?brand=%D8%A7%D9%BE%D9%84" }, { label: "هدفون سامسونگ", href: "/headphones?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF" }], seeAllHref: "/headphones" },
    { id: "watch", name: "ساعت هوشمند", icon: "ti-device-watch", links: [{ label: "ساعت اپل", href: "/smartwatches?brand=%D8%A7%D9%BE%D9%84" }, { label: "ساعت سامسونگ", href: "/smartwatches?brand=%D8%B3%D8%A7%D9%85%D8%B3%D9%88%D9%86%DA%AF" }], seeAllHref: "/smartwatches" },
    { id: "console", name: "کنسول بازی", icon: "ti-device-gamepad-2", links: [{ label: "خرید کنسول سونی", href: "/console" }], seeAllHref: "/console" },
  ];
  const mobileCategories = categories.map((category) => ({ ...category, sections: category.groups || undefined, links: category.links || category.groups.flatMap((group) => group.links) }));
  window.PixelLifeStorefront = { CART_KEY, categories, mobileCategories, readCart, writeCart, cartCount, normalizeCart, emitCartChange };

})();
