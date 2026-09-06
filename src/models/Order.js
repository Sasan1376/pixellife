const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true }, brand: { type: String, default: "" }, image: { type: String, default: "" },
      price: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1 },
      color: { type: String, default: "" }, storage: { type: String, default: "" }, warranty: { type: String, default: "" },
    }],
    shippingAddress: {
      receiverName: { type: String, required: true }, receiverMobile: { type: String, required: true },
      province: { type: String, required: true }, city: { type: String, required: true },
      fullAddress: { type: String, required: true }, postalCode: { type: String, default: "" },
    },
    subtotal: { type: Number, required: true, min: 0 }, deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 }, total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["online", "bale", "zarinpal"], default: "online" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "failed"], default: "unpaid" },
    status: { type: String, enum: ["awaiting_payment", "processing", "shipped", "delivered", "cancelled"], default: "awaiting_payment", index: true },
    statusHistory: [{ _id: false, status: String, note: String, changedAt: { type: Date, default: Date.now } }],
    checkoutKey: { type: String },
    checkoutFingerprint: { type: String },
    fulfillmentStatus: { type: String, enum: ['pending', 'allocated', 'stock_review'], default: 'pending' },
    zarinpalPayment: {
      amountRial: { type: Number },
      verificationCode: { type: Number },
      authority: { type: String, default: "", index: true },
      status: { type: String, enum: ["created", "requesting", "uncertain", "redirected", "paid", "failed"], default: "created" },
      refId: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },
    balePayment: {
      payload: { type: String, default: "", index: true },
      chatId: { type: String, default: "" },
      amountRial: { type: Number, default: 0 },
      status: { type: String, enum: ["created", "sent", "paid", "failed"], default: "created" },
      chargeId: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);
orderSchema.index({ user: 1, checkoutKey: 1 }, { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre("validate", function () {
  if (!this.orderNumber) this.orderNumber = `PL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  if (!this.statusHistory?.length) this.statusHistory = [{ status: this.status, note: "سفارش ثبت شد" }];
});

module.exports = mongoose.model("Order", orderSchema);
