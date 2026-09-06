const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');
const FREE_DELIVERY_FROM = 5000000;
const DELIVERY_FEE = 150000;
const clean = value => String(value || '').trim().replace(/^—$/, '');
const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

// The order, quote and UI use integer toman. Only the gateway adapter converts to rial.
async function quoteCart(user, body) {
  const requested = body?.items;
  if (!Array.isArray(requested) || !requested.length || requested.length > 100) throw new ApiError(400, 'سبد خرید نامعتبر است');
  if (!/^[a-f\d]{24}$/i.test(String(body.addressId || ''))) throw new ApiError(400, 'آدرس معتبر انتخاب کنید');
  const address = await Address.findOne({ _id: body.addressId, user: user._id }).lean();
  if (!address) throw new ApiError(400, 'آدرس متعلق به حساب شما نیست');
  const products = [];
  const items = [];
  const totals = new Map();
  const seen = new Set();
  for (const entry of requested) {
    const id = clean(entry?.productId);
    const quantity = entry?.quantity;
    if (!id || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) throw new ApiError(400, 'تعداد یا شناسهٔ کالا نامعتبر است');
    const product = await (/^[a-f\d]{24}$/i.test(id) ? Product.findById(id) : Product.findOne({ $or: [{ slug: id }, { legacyId: id }] })).lean();
    if (!product || product.comingSoon || product.availability !== 'in') throw new ApiError(409, 'کالای انتخاب‌شده موجود نیست');
    const color = clean(entry.color), storage = clean(entry.storage), warranty = clean(entry.warranty);
    const variant = product.variants?.length ? product.variants.find(v => clean(v.storage) === storage && clean(v.color?.name) === color) : null;
    if (product.variants?.length && !variant) throw new ApiError(400, 'رنگ یا ظرفیت انتخاب‌شده معتبر نیست');
    const lineKey = JSON.stringify([String(product._id), color, storage]);
    if (seen.has(lineKey)) throw new ApiError(400, 'یک تنوع کالا چند بار ارسال شده است');
    seen.add(lineKey);
    const stock = Number(variant ? variant.stock : product.stock);
    if (!Number.isSafeInteger(stock) || stock < quantity) throw new ApiError(409, `موجودی «${product.name}» کافی نیست`);
    const sum = (totals.get(String(product._id)) || 0) + quantity;
    totals.set(String(product._id), sum);
    if (!Number.isSafeInteger(product.stock) || product.stock < sum) throw new ApiError(409, 'مجموع تعداد انتخابی از موجودی بیشتر است');
    const basePrice = Number(variant?.price ?? product.price);
    const discount = Number(product.discount || 0);
    if (!Number.isSafeInteger(basePrice) || basePrice <= 0 || !Number.isFinite(discount) || discount < 0 || discount >= 100) throw new ApiError(409, 'قیمت کالا معتبر نیست');
    const price = Math.round(basePrice * (1 - discount / 100));
    if (price <= 0) throw new ApiError(409, 'قیمت کالا معتبر نیست');
    products.push(product);
    items.push({ product: product._id, name: product.name, brand: product.brand || '', image: product.mainImage || product.images?.[0] || '', price, quantity, color, storage, warranty });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  if (!Number.isSafeInteger(total * 10)) throw new ApiError(400, 'مبلغ سفارش نامعتبر است');
  const shippingAddress = {
    receiverName: address.receiverName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'گیرنده',
    receiverMobile: address.receiverMobile || user.mobile,
    province: address.province, city: address.city, fullAddress: address.fullAddress, postalCode: address.postalCode || '',
  };
  const data = { user: user._id, items, shippingAddress, subtotal, deliveryFee, total };
  return { data, products, hash: fingerprint(data) };
}
async function createOrderFromCart(user, body, { paymentMethod = 'online' } = {}) {
  const { data, products } = await quoteCart(user, body);
  return { order: await Order.create({ ...data, paymentMethod }), products };
}
module.exports = { quoteCart, fingerprint, createOrderFromCart, FREE_DELIVERY_FROM, DELIVERY_FEE };
