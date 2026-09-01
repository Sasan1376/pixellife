const mongoose = require("mongoose");

const behaviorEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "page_view",
        "product_view",
        "product_click",
        "search",
        "filter_apply",
        "add_to_cart",
        "remove_from_cart",
        "add_to_wishlist",
        "remove_from_wishlist",
        "begin_checkout",
        "order_created",
      ],
      index: true,
    },
    visitorHash: { type: String, required: true, index: true },
    sessionHash: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    page: { type: String, required: true, maxlength: 180, index: true },
    productId: { type: String, default: "", maxlength: 120, index: true },
    category: { type: String, default: "", maxlength: 100, index: true },
    brand: { type: String, default: "", maxlength: 80, index: true },
    searchTerm: { type: String, default: "", maxlength: 120 },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, enum: ["client", "server"], default: "client" },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

behaviorEventSchema.index({ createdAt: -1, type: 1 });
behaviorEventSchema.index({ productId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.models.BehaviorEvent || mongoose.model("BehaviorEvent", behaviorEventSchema);
