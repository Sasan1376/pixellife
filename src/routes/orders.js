const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const { createOrderFromCart } = require("../services/orderService");
const { recordBehaviorEvent } = require("../services/behaviorAnalytics");

router.post("/", protect, async (req, res, next) => {
  try {
    const { order, products } = await createOrderFromCart(req.user, req.body);
    await Promise.all(order.items.map((item, index) => recordBehaviorEvent(req, res, {
      type: "order_created", page: "/checkout", productId: String(item.product),
      brand: item.brand || "", category: products[index]?.category || "",
    }, "server")));
    res.status(201).json({ success: true, message: "سفارش ثبت شد", order: { id: order._id, orderNumber: order.orderNumber, total: order.total, status: order.status } });
  } catch (error) { next(error); }
});

router.get("/my", protect, async (req, res, next) => {
  try { const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean(); res.json({ success: true, orders }); } catch (error) { next(error); }
});
module.exports = router;
