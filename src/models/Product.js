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
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);
productSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(`${this.name}-${this._id.toString().slice(-4)}`, {
      lower: true,
      strict: true,
    });
  }
});
module.exports = mongoose.model("Product", productSchema);
