const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");

const FREE_DELIVERY_FROM = 5000000;
const DELIVERY_FEE = 150000;

function itemId(value) {
  return String(value || "").trim();
}

function priceAfterDiscount(product) {
  const discount = Math.min(100, Math.max(0, Number(product.discount) || 0));
  return Math.round(Number(product.price) * (1 - discount / 100));
}

async function createOrderFromCart(user, body, { paymentMethod = "online" } = {}) {
  const requestedItems = Array.isArray(body?.items) ? body.items : [];
  if (!requestedItems.length) throw new Error("سبد خرید خالی است");

  const address = await Address.findOne({ _id: body.addressId, user: user._id }).lean();
  if (!address) throw new Error("برای ثبت سفارش یک آدرس معتبر انتخاب کنید");

  const productIds = requestedItems.map((item) => itemId(item.productId));
  if (productIds.some((id) => !id)) throw new Error("شناسهٔ یکی از کالاها نامعتبر است");
  if (new Set(productIds).size !== productIds.length) throw new Error("یک کالا بیش از یک‌بار در سفارش ارسال شده است");

  const products = await Promise.all(productIds.map((id) => {
    if (/^[a-f\d]{24}$/i.test(id)) return Product.findById(id).lean();
    return Product.findOne({ $or: [{ slug: id }, { legacyId: id }] }).lean();
  }));

  const items = requestedItems.map((requested, index) => {
    const product = products[index];
    const quantity = Math.max(1, Math.floor(Number(requested.quantity) || 0));
    if (!product || product.availability === "out" || Number(product.stock) < quantity) {
      throw new Error(`محصول «${product?.name || "انتخاب‌شده"}» موجود نیست`);
    }
    return {
      product: product._id,
      name: product.name,
      brand: product.brand || "",
      image: product.mainImage || product.images?.[0] || "",
      price: priceAfterDiscount(product),
      quantity,
      color: String(requested.color || ""),
      storage: String(requested.storage || ""),
      warranty: String(requested.warranty || ""),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const order = await Order.create({
    user: user._id,
    items,
    shippingAddress: {
      receiverName: address.receiverName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "گیرنده",
      receiverMobile: address.receiverMobile || user.mobile,
      province: address.province,
      city: address.city,
      fullAddress: address.fullAddress,
      postalCode: address.postalCode || "",
    },
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    paymentMethod,
  });

  return { order, products };
}

module.exports = { createOrderFromCart, FREE_DELIVERY_FROM, DELIVERY_FEE };
