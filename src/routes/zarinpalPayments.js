const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const { quoteCart, fingerprint } = require('../services/orderService');
const gateway = require('../services/zarinpalGateway');
const settle = require('../services/settleZarinpal');
const ApiError = require('../utils/ApiError');
const objectId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const orderResult = order => ({ id: order._id, orderNumber: order.orderNumber, total: order.total, paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus });
const fingerprintBody = body => fingerprint({ addressId: body.addressId, items: body.items });

router.get('/zarinpal/status', protect, (req, res) => res.set('Cache-Control', 'no-store').json({ success: true, configured: gateway.configured() }));
router.post('/zarinpal/quote', protect, async (req, res, next) => {
  try {
    if (!gateway.configured()) throw new ApiError(503, 'درگاه پرداخت هنوز فعال نشده است');
    const { data, hash } = await quoteCart(req.user, req.body);
    res.set('Cache-Control', 'no-store').json({ success: true, quote: { hash, subtotal: data.subtotal, deliveryFee: data.deliveryFee, total: data.total, currency: 'IRT' } });
  } catch (error) { next(error); }
});

router.post('/zarinpal/checkout', protect, async (req, res, next) => {
  try {
    if (!gateway.configured()) throw new ApiError(503, 'درگاه پرداخت هنوز فعال نشده است');
    // Settlement relies on database transactions: fail before collecting any money
    // if deployment is using standalone MongoDB instead of Atlas/replica set.
    const topology = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!topology.setName && topology.msg !== 'isdbgrid') throw new ApiError(503, 'زیرساخت ثبت پرداخت آماده نیست');
    await Order.init();
    const key = req.get('Idempotency-Key');
    if (!/^[a-z\d-]{16,80}$/i.test(key || '')) throw new ApiError(400, 'شناسهٔ درخواست خرید معتبر نیست');
    const filter = { user: req.user._id, checkoutKey: key };
    const bodyHash = fingerprintBody(req.body);
    let order = await Order.findOne(filter);
    if (!order) {
      const quote = await quoteCart(req.user, req.body);
      if (req.body.quoteHash !== quote.hash) return res.status(409).json({ success: false, code: 'QUOTE_CHANGED', message: 'قیمت یا اطلاعات سفارش تغییر کرده است؛ مبلغ را دوباره بررسی کنید' });
      try {
        order = await Order.create({ ...quote.data, paymentMethod: 'zarinpal', checkoutKey: key, checkoutFingerprint: bodyHash,
          zarinpalPayment: { amountRial: gateway.amountRial(quote.data.total) } });
      } catch (error) {
        if (error.code !== 11000) throw error;
        order = await Order.findOne(filter);
        if (!order) throw error;
      }
    }
    if (order.checkoutFingerprint !== bodyHash) throw new ApiError(409, 'این شناسه برای سبد دیگری استفاده شده است');
    if (order.paymentStatus === 'paid') return res.json({ success: true, order: orderResult(order) });
    if (order.zarinpalPayment.authority) return res.json({ success: true, order: orderResult(order), paymentUrl: gateway.paymentUrl(order.zarinpalPayment.authority) });
    // Atomic claim: no second gateway request even if the first HTTP response is lost.
    const claimed = await Order.findOneAndUpdate({ ...filter, 'zarinpalPayment.status': 'created' }, { $set: { 'zarinpalPayment.status': 'requesting' } }, { new: true });
    if (!claimed) throw new ApiError(409, 'درخواست پرداخت در حال بررسی است؛ دوباره سفارش ثبت نکنید');
    try {
      const authority = await gateway.request(claimed);
      order = await Order.findByIdAndUpdate(claimed._id, { $set: { 'zarinpalPayment.authority': authority, 'zarinpalPayment.status': 'redirected' } }, { new: true });
      res.status(201).json({ success: true, order: orderResult(order), paymentUrl: gateway.paymentUrl(authority) });
    } catch (error) {
      // Timeouts are ambiguous. Keep the attempt locked for reconciliation, never retry blindly.
      await Order.updateOne({ _id: claimed._id, 'zarinpalPayment.status': 'requesting' }, { $set: { 'zarinpalPayment.status': 'uncertain' } });
      throw error;
    }
  } catch (error) { next(error); }
});

router.get('/zarinpal/orders/:orderId/status', protect, async (req, res, next) => {
  try {
    if (!objectId(req.params.orderId)) throw new ApiError(400, 'شناسه سفارش نامعتبر است');
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id, paymentMethod: 'zarinpal' });
    if (!order) throw new ApiError(404, 'سفارش پیدا نشد');
    res.set('Cache-Control', 'no-store').json({ success: true, order: orderResult(order) });
  } catch (error) { next(error); }
});

router.get('/zarinpal/callback', async (req, res, next) => {
  try {
    const { order: id, Authority: authority, Status: status } = req.query;
    if (!objectId(id) || typeof authority !== 'string' || !/^[AS][a-z\d]{20,100}$/i.test(authority)) throw new ApiError(400, 'شناسهٔ پرداخت نامعتبر است');
    const order = await Order.findOne({ _id: id, paymentMethod: 'zarinpal', 'zarinpalPayment.authority': authority });
    if (!order) throw new ApiError(404, 'سفارش یا شناسهٔ پرداخت پیدا نشد');
    const successUrl = `/profile/orders?payment=success&orderId=${order._id}`;
    if (order.paymentStatus === 'paid') return res.redirect(303, successUrl);
    // The callback is public. NOK must never be allowed to downgrade or mutate a payment.
    if (status !== 'OK') return res.redirect(303, `/cart?payment=cancelled&orderId=${order._id}`);
    try {
      const verified = await gateway.verify(order);
      if (![100, 101].includes(verified?.code)) return res.redirect(303, `/cart?payment=failed&orderId=${order._id}`);
      await settle(order._id, authority, verified);
      return res.redirect(303, successUrl);
    } catch (_) {
      // Retry this same callback after a transient provider/DB failure; never claim success.
      return res.status(503).send('تأیید نهایی پرداخت موقتاً ممکن نیست. برای بررسی دوباره همین صفحه را بازخوانی کنید؛ دوباره پرداخت نکنید.');
    }
  } catch (error) { next(error); }
});
module.exports = router;
