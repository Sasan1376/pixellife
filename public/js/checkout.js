(() => {
  if (window.PixelLifeCheckout) return;
  const PENDING = 'pixellife_zarinpal_attempt';
  const CART = 'digishop_cart';
  const readCart = () => { try { const c = JSON.parse(localStorage.getItem(CART) || '[]'); return Array.isArray(c) ? c : []; } catch (_) { return []; } };
  const readAttempt = () => { try { return JSON.parse(sessionStorage.getItem(PENDING) || 'null'); } catch (_) { return null; } };
  const clean = value => String(value || '').trim().replace(/^—$/, '');
  const lineKey = item => JSON.stringify([String(item.id), clean(item.color), clean(item.variant ?? item.storage), clean(item.warranty)]);
  const quantity = item => Number(item.quantity ?? item.qty ?? 1);
  function saveCart(cart) {
    localStorage.setItem(CART, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }
  async function api(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
    const result = await response.json();
    if (!response.ok || !result.success) {
      const error = new Error(response.status === 401 ? 'ابتدا وارد حساب کاربری شوید' : result.message || 'ارتباط با سرور ناموفق بود');
      error.status = response.status;
      error.code = result.code;
      throw error;
    }
    return result;
  }
  let reconciliation;
  function reconcile() {
    if (!reconciliation) reconciliation = reconcilePaidCart().finally(() => { reconciliation = null; });
    return reconciliation;
  }
  async function reconcilePaidCart() {
    const pending = readAttempt();
    if (!pending?.orderId || !Array.isArray(pending.snapshot)) return;
    const result = await api(`/api/payments/zarinpal/orders/${encodeURIComponent(pending.orderId)}/status`);
    if (result.order?.paymentStatus !== 'paid' || String(result.order.id) !== pending.orderId) return;
    // Keep newly added products and quantities. A query string is never proof of payment.
    const purchased = new Map(pending.snapshot.map(item => [lineKey(item), quantity(item)]));
    const remaining = readCart().flatMap(item => {
      const key = lineKey(item), paidQty = purchased.get(key) || 0;
      purchased.delete(key);
      const qty = quantity(item) - paidQty;
      return qty > 0 ? [{ ...item, quantity: qty, qty }] : [];
    });
    saveCart(remaining);
    sessionStorage.removeItem(PENDING);
  }
  let busy = false;
  async function start() {
    if (busy) return;
    busy = true;
    const buttons = [...document.querySelectorAll('#checkoutBtn, #mobileCheckoutBtn')];
    buttons.forEach(b => { b.disabled = true; });
    try {
      await reconcile();
      const status = await api('/api/payments/zarinpal/status');
      if (!status.configured) throw new Error('درگاه پرداخت هنوز فعال نشده است');
      const snapshot = readCart().filter(item => item.available !== false);
      if (!snapshot.length) throw new Error('سبد خرید خالی است');
      const addresses = await api('/api/addresses');
      const address = addresses.data?.find(a => a.isDefault) || addresses.data?.[0];
      if (!address) { window.location.assign('/profile/addresses'); return; }
      const payload = { addressId: address._id, items: snapshot.map(item => ({ productId: String(item.id), quantity: quantity(item), color: clean(item.color), storage: clean(item.variant ?? item.storage), warranty: clean(item.warranty) })) };
      const signature = JSON.stringify(payload);
      let attempt = readAttempt();
      if (attempt && attempt.signature !== signature) throw new Error('یک پرداخت قبلی در انتظار بررسی است. ابتدا وضعیت آن را در سفارش‌ها بررسی کنید');
      if (!attempt) {
        const { quote } = await api('/api/payments/zarinpal/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        // Show exactly the server total the gateway will receive, including shipping.
        const number = n => new Intl.NumberFormat('fa-IR').format(n);
        if (!window.confirm(`جمع کالاها: ${number(quote.subtotal)} تومان\nارسال: ${number(quote.deliveryFee)} تومان\nمبلغ نهایی پرداخت: ${number(quote.total)} تومان\nادامه به درگاه؟`)) return;
        attempt = { key: crypto.randomUUID(), signature, payload: { ...payload, quoteHash: quote.hash }, snapshot };
        sessionStorage.setItem(PENDING, JSON.stringify(attempt));
      }
      const result = await api('/api/payments/zarinpal/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key }, body: JSON.stringify(attempt.payload) });
      attempt.orderId = String(result.order.id);
      sessionStorage.setItem(PENDING, JSON.stringify(attempt));
      if (result.order.paymentStatus === 'paid') { await reconcile(); window.location.assign('/profile/orders'); return; }
      const target = new URL(result.paymentUrl);
      if (target.protocol !== 'https:' || !['payment.zarinpal.com', 'sandbox.zarinpal.com'].includes(target.hostname)) throw new Error('آدرس درگاه نامعتبر است');
      window.location.assign(target.href);
    } catch (error) {
      if (error.code === 'QUOTE_CHANGED') sessionStorage.removeItem(PENDING);
      window.alert(error.message || 'پرداخت انجام نشد؛ وضعیت سفارش را بررسی کنید');
    } finally { busy = false; buttons.forEach(b => { b.disabled = false; }); }
  }
  window.PixelLifeCheckout = { start, reconcile };
  document.addEventListener('click', event => {
    if (!event.target.closest('#checkoutBtn, #mobileCheckoutBtn')) return;
    // Suppress legacy handlers synchronously, before any network request.
    event.preventDefault(); event.stopImmediatePropagation();
    void start();
  }, true);
  const init = () => { void reconcile().catch(() => {}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
