const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.MONGO_URI = 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = 'test-only';
process.env.ZARINPAL_MERCHANT_ID = '11111111-1111-1111-1111-111111111111';
process.env.SITE_URL = 'https://pixellife.ir';
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const axios = require('axios');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Address = require('../src/models/Address');
const gateway = require('../src/services/zarinpalGateway');
const env = require('../src/config/env');
const user = { _id: new mongoose.Types.ObjectId(), mobile: '09121234567', firstName: 'Test' };
require.cache[require.resolve('../src/middleware/authMiddleware')] = { exports: { protect(req, res, next) { req.user = { ...user, _id: req.get('X-User') || user._id }; next(); } } };
const app = express(); app.use(express.json()); app.use('/api/payments', require('../src/routes/zarinpalPayments'));
app.use((err, req, res, next) => res.status(err.statusCode || 500).json({ success: false, message: err.message }));
let db, product, address, calls, verifiedCode, providerFailure;
const authority = 'A' + '1'.repeat(35);
const originalPost = axios.post;
before(async () => {
  if (process.env.PAYMENT_TEST_DB !== 'real') { require('./paymentDatabaseMock')([Order, Product, Address], mongoose); return; }
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.24' } });
  await mongoose.connect(db.getUri()); await Promise.all([Order.init(), Product.init(), Address.init()]);
});
after(async () => { axios.post = originalPost; if (db) { await mongoose.disconnect(); await db.stop(); } });
beforeEach(async () => {
  await Promise.all([Order.deleteMany({}), Product.deleteMany({}), Address.deleteMany({})]);
  product = await Product.create({ name: 'Phone', slug: 'phone', brand: 'Apple', price: 200000, discount: 10, stock: 5 });
  address = await Address.create({ user: user._id, province: 'Tehran', city: 'Tehran', fullAddress: 'Test', receiverMobile: user.mobile });
  calls = []; verifiedCode = 100; providerFailure = false;
  axios.post = async (url, body) => {
    calls.push({ url, body });
    if (providerFailure) throw new Error('timeout');
    return { data: { data: url.includes('request') ? { code: 100, authority } : { code: verifiedCode, ref_id: 123456 } } };
  };
});
const payload = (items) => ({ addressId: String(address._id), items: items || [{ productId: String(product._id), quantity: 2, color: '', storage: '', warranty: '' }] });
async function checkout(body = payload(), key = '11111111-1111-4111-a111-111111111111') {
  const quote = await request(app).post('/api/payments/zarinpal/quote').send(body).expect(200);
  return request(app).post('/api/payments/zarinpal/checkout').set('Idempotency-Key', key).send({ ...body, quoteHash: quote.body.quote.hash });
}
const callback = (order, status = 'OK', auth = authority) => request(app).get('/api/payments/zarinpal/callback').query({ order: String(order._id), Authority: auth, Status: status });

test('server prices, discount and shipping become one frozen rial amount for request AND verify', async () => {
  const body = { ...payload(), total: 1, discount: 999 };
  const response = await checkout(body); assert.equal(response.status, 201);
  let order = await Order.findOne(); assert.equal(order.total, 510000);
  assert.equal(calls[0].body.amount, 5100000); assert.equal(calls[0].body.currency, 'IRR');
  assert.equal(calls[0].url, 'https://payment.zarinpal.com/pg/v4/payment/request.json');
  await callback(order).expect(303);
  assert.equal(calls[1].body.amount, calls[0].body.amount);
  order = await Order.findById(order._id); assert.equal(order.paymentStatus, 'paid');
  assert.equal(order.fulfillmentStatus, 'allocated'); assert.equal((await Product.findById(product._id)).stock, 3);
});
test('simultaneous identical checkout creates one order and one provider request', async () => {
  const body = payload(); const q = await request(app).post('/api/payments/zarinpal/quote').send(body);
  const responses = await Promise.all([1,2,3].map(() => request(app).post('/api/payments/zarinpal/checkout').set('Idempotency-Key', 'same-checkout-key-12345').send({ ...body, quoteHash: q.body.quote.hash })));
  assert.ok(responses.every(r => [200,201,409].includes(r.status)));
  assert.equal(await Order.countDocuments(), 1); assert.equal(calls.length, 1);
});
test('a timeout never blindly requests a second authority on retry', async () => {
  providerFailure = true; assert.equal((await checkout()).status, 500);
  providerFailure = false; assert.equal((await checkout()).status, 409);
  assert.equal(calls.length, 1); assert.equal(await Order.countDocuments(), 1);
});
test('NOK, rejected verification and malformed/unknown authority never mark paid or debit inventory', async () => {
  await checkout(); const order = await Order.findOne();
  await callback(order, 'NOK').expect(303); assert.equal(calls.length, 1);
  verifiedCode = -51; await callback(order).expect(303);
  await callback(order, 'OK', 'A' + '2'.repeat(35)).expect(404);
  await callback(order, 'OK', '').expect(400);
  assert.equal((await Order.findById(order._id)).paymentStatus, 'unpaid'); assert.equal((await Product.findById(product._id)).stock, 5);
});
test('concurrent callbacks and code 101 settle once; late NOK cannot downgrade shipped order', async () => {
  await checkout(); let order = await Order.findOne(); verifiedCode = 101;
  const responses = await Promise.all([callback(order), callback(order)]); assert.ok(responses.every(r => r.status === 303));
  assert.equal((await Product.findById(product._id)).stock, 3);
  order = await Order.findById(order._id); assert.equal(order.statusHistory.length, 2);
  await Order.updateOne({ _id: order._id }, { status: 'shipped' });
  await callback(order, 'NOK').expect(303);
  order = await Order.findById(order._id); assert.equal(order.status, 'shipped'); assert.equal(order.paymentStatus, 'paid');
});
test('server rejects altered quote, invalid counts, unavailable product and aliases bypassing stock', async () => {
  for (const quantity of [0, -1, 1.5, '2', 1001]) {
    await request(app).post('/api/payments/zarinpal/quote').send(payload([{ productId: String(product._id), quantity }])).expect(400);
  }
  await request(app).post('/api/payments/zarinpal/quote').send(payload([{ productId: String(product._id), quantity: 4 }, { productId: product.slug, quantity: 4 }])).expect(400);
  const body = payload(); const q = await request(app).post('/api/payments/zarinpal/quote').send(body);
  await Product.updateOne({ _id: product._id }, { price: 300000 });
  await request(app).post('/api/payments/zarinpal/checkout').set('Idempotency-Key', 'changed-price-key-1234').send({ ...body, quoteHash: q.body.quote.hash }).expect(409);
  assert.equal(await Order.countDocuments(), 0);
});
test('stock disappearing during bank payment records money but flags fulfillment; no negative stock', async () => {
  await checkout(); const order = await Order.findOne();
  await Product.updateOne({ _id: product._id }, { stock: 1 });
  await callback(order).expect(303);
  const paid = await Order.findById(order._id); assert.equal(paid.paymentStatus, 'paid'); assert.equal(paid.fulfillmentStatus, 'stock_review');
  assert.equal((await Product.findById(product._id)).stock, 1);
});
test('status endpoint is owner-scoped; mismatched stored amount is not verified', async () => {
  await checkout(); const order = await Order.findOne();
  await request(app).get(`/api/payments/zarinpal/orders/${order._id}/status`).set('X-User', String(new mongoose.Types.ObjectId())).expect(404);
  await Order.updateOne({ _id: order._id }, { 'zarinpalPayment.amountRial': 1 });
  await callback(order).expect(503); assert.equal(calls.length, 1);
});
test('variant price/stock and free shipping use server configuration', async () => {
  product.variants = [{ storage: '256', color: { name: 'blue' }, price: 6000000, stock: 1 }]; await product.save();
  const r = await checkout(payload([{ productId: String(product._id), quantity: 1, color: 'blue', storage: '256' }]));
  assert.equal(r.status, 201); const order = await Order.findOne(); assert.equal(order.total, 5400000); assert.equal(order.deliveryFee, 0);
  await callback(order).expect(303); assert.equal((await Product.findById(product._id)).variants[0].stock, 0);
});
test('sandbox URL and integer amount validation', async () => {
  assert.throws(() => gateway.amountRial(1.5)); assert.throws(() => gateway.amountRial(0));
  env.zarinpalSandbox = true;
  try { await checkout(); assert.ok(calls[0].url.startsWith('https://sandbox.zarinpal.com/')); } finally { env.zarinpalSandbox = false; }
});
