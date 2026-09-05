const express = require("express");
const axios = require("axios");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const env = require("../config/env");
const { createOrderFromCart } = require("../services/orderService");

const API_BASE = () => env.zarinpalSandbox ? "https://sandbox.zarinpal.com/pg/v4/payment" : "https://api.zarinpal.com/pg/v4/payment";
const GATEWAY_BASE = () => env.zarinpalSandbox ? "https://sandbox.zarinpal.com/pg/StartPay/" : "https://www.zarinpal.com/pg/StartPay/";
const configured = () => Boolean(env.zarinpalMerchantId);
const siteUrl = (req) => String(env.siteUrl || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");

router.get("/zarinpal/status", protect, (req, res) => {
  res.json({ success: true, configured: configured() });
});

router.post("/zarinpal/checkout", protect, async (req, res, next) => {
  let order;
  try {
    if (!configured()) return res.status(503).json({ success: false, message: "درگاه زرین‌پال هنوز پیکربندی نشده است" });
    ({ order } = await createOrderFromCart(req.user, req.body, { paymentMethod: "zarinpal" }));
    const callbackUrl = `${siteUrl(req)}/api/payments/zarinpal/callback?order=${order._id}`;
    const { data } = await axios.post(`${API_BASE()}/request.json`, {
      merchant_id: env.zarinpalMerchantId,
      amount: Math.round(order.total),
      callback_url: callbackUrl,
      description: `پرداخت سفارش ${order.orderNumber}`,
      metadata: { mobile: String(req.user.mobile || "").replace(/^\+98/, "0") },
    }, { timeout: 20000, validateStatus: () => true });
    const authority = data?.data?.authority;
    if (data?.data?.code !== 100 || !authority) throw new Error(data?.errors?.message || "ایجاد درخواست زرین‌پال ناموفق بود");
    order.zarinpalPayment = { authority, status: "redirected" };
    order.statusHistory.push({ status: "awaiting_payment", note: "کاربر به درگاه زرین‌پال هدایت شد" });
    await order.save();
    res.status(201).json({ success: true, paymentUrl: `${GATEWAY_BASE()}${authority}`, order: { id: order._id, orderNumber: order.orderNumber, total: order.total } });
  } catch (error) {
    if (order) {
      order.paymentStatus = "failed";
      order.zarinpalPayment.status = "failed";
      order.statusHistory.push({ status: "awaiting_payment", note: `شروع پرداخت زرین‌پال ناموفق بود: ${error.message}` });
      await order.save().catch(() => {});
    }
    next(error);
  }
});

router.get("/zarinpal/callback", async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.query.order, "zarinpalPayment.authority": String(req.query.Authority || "") });
    if (!order) return res.status(404).send("سفارش یا شناسهٔ پرداخت پیدا نشد");
    if (req.query.Status !== "OK") {
      order.paymentStatus = "failed";
      order.zarinpalPayment.status = "failed";
      order.statusHistory.push({ status: "awaiting_payment", note: "پرداخت زرین‌پال توسط کاربر لغو شد" });
      await order.save();
      return res.redirect(302, `/cart?payment=cancelled&order=${order.orderNumber}`);
    }
    const { data } = await axios.post(`${API_BASE()}/verify.json`, {
      merchant_id: env.zarinpalMerchantId, amount: Math.round(order.total), authority: String(req.query.Authority),
    }, { timeout: 20000, validateStatus: () => true });
    const code = data?.data?.code;
    if (code !== 100 && code !== 101) throw new Error(data?.errors?.message || "تأیید پرداخت زرین‌پال ناموفق بود");
    order.paymentStatus = "paid";
    order.status = "processing";
    order.zarinpalPayment.status = "paid";
    order.zarinpalPayment.refId = String(data?.data?.ref_id || "");
    order.zarinpalPayment.paidAt = new Date();
    order.statusHistory.push({ status: "processing", note: `پرداخت زرین‌پال تأیید شد${order.zarinpalPayment.refId ? `؛ کد پیگیری ${order.zarinpalPayment.refId}` : ""}` });
    await order.save();
    res.redirect(302, `/profile/orders?payment=success&order=${order.orderNumber}`);
  } catch (error) { next(error); }
});

module.exports = router;
