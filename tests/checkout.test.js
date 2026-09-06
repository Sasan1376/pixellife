const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public/js/checkout.js'), 'utf8');
const pendingKey = 'pixellife_zarinpal_attempt';
const cartKey = 'digishop_cart';
function storage() { const values = new Map(); return { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) }; }
function setup(handler) {
  const events = {}, calls = [], alerts = [], confirms = [], redirects = [], buttons = [{ disabled: false }, { disabled: false }];
  const context = { sessionStorage: storage(), localStorage: storage(), URL, Intl, Map, JSON, Event, crypto: require('node:crypto').webcrypto,
    document: { readyState: 'loading', querySelectorAll: () => buttons, addEventListener: (name, fn) => { events[name] = fn; } },
    window: { dispatchEvent() {}, alert: text => alerts.push(text), confirm: text => { confirms.push(text); return true; }, location: { assign: url => redirects.push(url) } },
    fetch: async (url, options) => { calls.push({ url, options }); const data = await handler(url, options); return { ok: data.http !== 401, status: data.http || 200, json: async () => data }; },
  };
  vm.runInNewContext(source, context);
  return { ...context, events, calls, alerts, confirms, redirects, buttons };
}
const item = { id: 'phone', quantity: 2, qty: 2, color: 'blue', variant: '256', available: true };
const tick = () => new Promise(resolve => setImmediate(resolve));
test('both click targets are suppressed before first await and double click makes one checkout', async () => {
  let release; const status = new Promise(resolve => { release = resolve; });
  const ctx = setup(async url => {
    if (url.endsWith('/status')) return status;
    if (url === '/api/addresses') return { success: true, data: [{ _id: 'address' }] };
    if (url.endsWith('/quote')) return { success: true, quote: { hash: 'quote', subtotal: 360000, deliveryFee: 150000, total: 510000 } };
    return { success: true, order: { id: 'order', paymentStatus: 'unpaid' }, paymentUrl: 'https://payment.zarinpal.com/pg/StartPay/A123' };
  });
  ctx.localStorage.setItem(cartKey, JSON.stringify([item]));
  let stopped = 0;
  const click = { target: { closest: () => ({}) }, preventDefault() { stopped++; }, stopImmediatePropagation() { stopped++; } };
  ctx.events.click(click); ctx.events.click(click);
  assert.equal(stopped, 4); assert.equal(ctx.buttons[0].disabled, true);
  release({ success: true, configured: true }); await tick(); await tick();
  assert.equal(ctx.calls.filter(c => c.url.endsWith('/checkout')).length, 1);
  assert.ok(ctx.calls.every(c => c.url !== '/api/orders'));
  assert.equal(ctx.redirects.length, 1); assert.equal(JSON.parse(ctx.localStorage.getItem(cartKey))[0].quantity, 2);
  assert.ok(ctx.confirms[0].includes(new Intl.NumberFormat('fa-IR').format(510000)));
});
test('forged success URL and unpaid server response do not clear cart', async () => {
  const ctx = setup(async () => ({ success: true, order: { id: 'order', paymentStatus: 'unpaid' } }));
  ctx.window.location.search = '?payment=success';
  ctx.localStorage.setItem(cartKey, JSON.stringify([item])); ctx.sessionStorage.setItem(pendingKey, JSON.stringify({ orderId: 'order', snapshot: [item] }));
  await ctx.window.PixelLifeCheckout.reconcile(); assert.equal(JSON.parse(ctx.localStorage.getItem(cartKey)).length, 1);
});
test('owner-confirmed payment subtracts only purchased quantities, once under concurrent reconciliation', async () => {
  const ctx = setup(async () => ({ success: true, order: { id: 'order', paymentStatus: 'paid' } }));
  ctx.localStorage.setItem(cartKey, JSON.stringify([{ ...item, quantity: 5 }, { id: 'new', quantity: 1 }]));
  ctx.sessionStorage.setItem(pendingKey, JSON.stringify({ orderId: 'order', snapshot: [item] }));
  await Promise.all([ctx.window.PixelLifeCheckout.reconcile(), ctx.window.PixelLifeCheckout.reconcile()]);
  const cart = JSON.parse(ctx.localStorage.getItem(cartKey)); assert.equal(cart[0].quantity, 3); assert.equal(cart[1].id, 'new');
  assert.equal(ctx.calls.length, 1); assert.equal(ctx.sessionStorage.getItem(pendingKey), null);
});
test('status error or disabled gateway never falls back to legacy unpaid order route', async () => {
  for (const handler of [async () => { throw new Error('network'); }, async () => ({ success: true, configured: false })]) {
    const ctx = setup(handler); await ctx.window.PixelLifeCheckout.start();
    assert.ok(ctx.calls.every(c => c.url !== '/api/orders')); assert.equal(ctx.redirects.length, 0); assert.equal(ctx.buttons[0].disabled, false);
  }
});
test('retry after lost response keeps the same idempotency key', async () => {
  const ctx = setup(async url => {
    if (url.endsWith('/status')) return { success: true, configured: true };
    if (url === '/api/addresses') return { success: true, data: [{ _id: 'address' }] };
    if (url.endsWith('/quote')) return { success: true, quote: { hash: 'quote', subtotal: 1, deliveryFee: 0, total: 1 } };
    throw new Error('response lost');
  });
  ctx.localStorage.setItem(cartKey, JSON.stringify([item]));
  await ctx.window.PixelLifeCheckout.start(); await ctx.window.PixelLifeCheckout.start();
  const requests = ctx.calls.filter(c => c.url.endsWith('/checkout'));
  assert.equal(requests.length, 2); assert.equal(requests[0].options.headers['Idempotency-Key'], requests[1].options.headers['Idempotency-Key']);
});
