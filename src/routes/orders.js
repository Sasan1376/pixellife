const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");
const { recordBehaviorEvent } = require("../services/behaviorAnalytics");

router.post("/", protect, async (req, res, next) => {
  try {
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!requestedItems.length) return res.status(400).json({ success: false, message: "سبد خرید خالی است" });
    const address = await Address.findOne({ _id: req.body.addressId, user: req.user._id }).lean();
    if (!address) return res.status(400).json({ success: false, message: "برای ثبت سفارش یک آدرس معتبر انتخاب کنید" });
    const products = await Promise.all(requestedItems.map(async (item) => {
      const id = String(item.productId || "").trim();
      if (/^[a-f\d]{24}$/i.test(id)) return Product.findById(id).lean();
      return Product.findOne({ $or: [{ slug: id }, { legacyId: id }] }).lean();
    }));
    const items = requestedItems.map((item, index) => {
      const product = products[index]; const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
      if (!product || product.availability === "out" || Number(product.stock) < quantity) throw new Error(`محصول «${product?.name || "انتخاب‌شده"}» موجود نیست`);
      const price = Math.round(Number(product.price) * (1 - Math.max(0, Number(product.discount) || 0) / 100));
      return { product: product._id, name: product.name, brand: product.brand, image: product.mainImage || product.images?.[0] || "", price, quantity, color: String(item.color || ""), storage: String(item.storage || ""), warranty: String(item.warranty || "") };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({ user: req.user._id, items, shippingAddress: { receiverName: address.receiverName || `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "گیرنده", receiverMobile: address.receiverMobile || req.user.mobile, province: address.province, city: address.city, fullAddress: address.fullAddress, postalCode: address.postalCode || "" }, subtotal, total: subtotal });
    await Promise.all(items.map((item, index) => recordBehaviorEvent(req, res, { type: "order_created", page: "/checkout", productId: String(item.product), brand: item.brand || "", category: products[index]?.category || "" }, "server")));
    res.status(201).json({ success: true, message: "سفارش ثبت شد", order: { id: order._id, orderNumber: order.orderNumber, total: order.total, status: order.status } });
  } catch (error) { next(error); }
});

router.get("/my", protect, async (req, res, next) => {
  try { const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean(); res.json({ success: true, orders }); } catch (error) { next(error); }
});
module.exports = router;
