const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const host = () => env.zarinpalSandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
const configured = () => Boolean(env.zarinpalMerchantId);
function amountRial(totalToman) {
  if (!Number.isSafeInteger(totalToman) || totalToman <= 0 || !Number.isSafeInteger(totalToman * 10)) throw new ApiError(400, 'مبلغ پرداخت معتبر نیست');
  return totalToman * 10;
}
async function call(method, payload) {
  const { data } = await axios.post(`${host()}/pg/v4/payment/${method}.json`, { merchant_id: env.zarinpalMerchantId, ...payload }, { timeout: 20000, validateStatus: () => true });
  return data;
}
function paymentUrl(authority) { return `${host()}/pg/StartPay/${encodeURIComponent(authority)}`; }
async function request(order) {
  const callback = new URL('/api/payments/zarinpal/callback', env.siteUrl);
  callback.searchParams.set('order', String(order._id));
  const result = await call('request', { amount: order.zarinpalPayment.amountRial, currency: 'IRR', callback_url: callback.href,
    description: `پرداخت سفارش ${order.orderNumber}`, metadata: { mobile: order.shippingAddress.receiverMobile, order_id: order.orderNumber } });
  if (result?.data?.code !== 100 || !/^[AS][a-z\d]{20,100}$/i.test(result?.data?.authority || '')) throw new ApiError(502, 'ایجاد پرداخت ناموفق بود؛ درخواست را دوباره ارسال نکنید و وضعیت سفارش را بررسی کنید');
  return result.data.authority;
}
async function verify(order) {
  const amount = order.zarinpalPayment.amountRial;
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount !== amountRial(order.total)) throw new ApiError(409, 'مبلغ ذخیره‌شدهٔ پرداخت با سفارش تطابق ندارد');
  return (await call('verify', { amount, authority: order.zarinpalPayment.authority }))?.data;
}
module.exports = { configured, amountRial, request, verify, paymentUrl };
