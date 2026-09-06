const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Transactions make repeated/concurrent callbacks unable to debit stock twice.
// A payment already collected must still be recorded if stock ran out during payment.
async function settleZarinpal(orderId, authority, verified) {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, paymentMethod: 'zarinpal', 'zarinpalPayment.authority': authority }).session(session);
      if (!order) throw new Error('سفارش پرداخت پیدا نشد');
      if (order.paymentStatus === 'paid') { result = order; return; }
      const products = new Map();
      let stockAvailable = true;
      for (const item of order.items) {
        const key = String(item.product);
        if (!products.has(key)) products.set(key, await Product.findById(key).session(session));
        const product = products.get(key);
        const variant = product?.variants?.length ? product.variants.find(v => v.storage === item.storage && v.color?.name === item.color) : null;
        if (!product || product.availability !== 'in' || product.stock < item.quantity || (product.variants?.length && (!variant || variant.stock < item.quantity))) { stockAvailable = false; break; }
        product.stock -= item.quantity;
        if (variant) variant.stock -= item.quantity;
      }
      if (stockAvailable) {
        for (const product of products.values()) await product.save({ session });
      }
      order.paymentStatus = 'paid';
      // Never regress an already shipped/cancelled order on a late callback.
      if (order.status === 'awaiting_payment') order.status = 'processing';
      order.fulfillmentStatus = stockAvailable ? 'allocated' : 'stock_review';
      order.zarinpalPayment.status = 'paid';
      order.zarinpalPayment.refId = String(verified.ref_id || '');
      order.zarinpalPayment.verificationCode = verified.code;
      order.zarinpalPayment.paidAt = new Date();
      order.statusHistory.push({ status: order.status, note: stockAvailable ? 'پرداخت زرین‌پال تأیید و موجودی کسر شد' : 'پرداخت تأیید شد؛ موجودی کافی نیست. بررسی فوری تأمین کالا یا بازپرداخت لازم است' });
      await order.save({ session });
      result = order;
    });
    return result;
  } finally { await session.endSession(); }
}
module.exports = settleZarinpal;
