const mongoose = require("mongoose");
const slugify = require("slugify");
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "عمومی",
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    specs: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    availability: {
      type: String,
      default: "in",
    },
    images: [
      {
        type: String,
      },
    ],
    colors: [
      {
        name: { type: String, trim: true },
        hex: { type: String, default: "#334155" },
      },
    ],
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);
productSchema.pre("validate", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = slugify(`${this.name}-${Date.now()}`, {
      lower: true,
      strict: true,
    });
  }
});
module.exports = mongoose.model("Product", productSchema);
