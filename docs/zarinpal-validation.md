# Zarinpal payment integrity

This change remains a draft. Do not enable a live merchant until the integration gate below passes.

## Contract

- Product prices, quotes and orders use integer toman. The server recalculates quantity, actual variant price, discount and delivery (150,000 toman below 5,000,000 toman).
- The customer confirms this server quote, including delivery, before checkout. A changed quote is rejected.
- The gateway receives `currency: IRR` and the stored `amountRial = total * 10`. Verification uses exactly this frozen amount. Client totals/discounts are not trusted.
- One browser handler owns desktop/mobile checkout. There is no automatic fallback to an unpaid order after a payment configuration/network error.
- A persisted, user-scoped idempotency key and unique MongoDB index prevent duplicate orders/authorities on retry. An ambiguous request timeout is locked as `uncertain`; do not reset it without provider reconciliation.
- A public callback cannot declare success, change the amount or downgrade paid/shipped orders. Only verification codes 100/101 permit settlement.
- Settlement updates stock and order together in a MongoDB transaction, once. Checkout refuses to collect money on a standalone MongoDB deployment. Atlas/replica set or a sharded deployment is required.
- Stock is not reserved during the bank visit. If it becomes unavailable before settlement, record the paid order as `fulfillmentStatus: stock_review`, debit no stock, and display an admin warning for manual fulfillment/refund. This is not an automatic refund facility.
- The browser checks an authenticated owner-scoped order status before subtracting the purchased snapshot from the current cart. URL parameters alone cannot clear a cart; new products/extra quantities are retained.

## Automated application checks

Install the repository dependencies and the test-only dependencies `supertest` and `mongodb-memory-server` in an isolated test environment, then run:

```sh
node --test tests/checkout.test.js tests/zarinpal.test.js
```

Default mode uses the real route/gateway/business code and Mongoose schemas with simulated persistence and HTTP provider responses. It does not prove MongoDB transaction semantics or a bank transfer.

For real database transaction tests against an ephemeral MongoDB replica set:

```sh
PAYMENT_TEST_DB=real node --test tests/zarinpal.test.js
```

The MongoDB binary could be downloaded here but could not start (`open: Operation not permitted`). Consequently the real-database gate has not passed in this workspace. Default simulation tests passed.

## Before production

1. Run the real replica-set tests and confirm index creation permissions (`user + checkoutKey` unique partial index).
2. In staging set a UUID merchant, `ZARINPAL_SANDBOX=true` and the staging `SITE_URL`. Test success, NOK, reload, repeated callback, response loss and a second cart edit while paying.
3. Confirm equal amounts on the final quote, stored order, provider request and verification. Check the admin reference and stock, including multi-line/variant orders.
4. After merchant activation, test a permitted low-value live purchase and refund/reconciliation procedure before public release.
5. Review orders with `zarinpalPayment.status=uncertain` or `fulfillmentStatus=stock_review` manually; do not create a second charge blindly.

Official references:
- https://www.zarinpal.com/docs/paymentGateway/connectToGateway
- https://www.zarinpal.com/docs/paymentGateway/moreFeatures/currency
- https://www.zarinpal.com/docs/paymentGateway/sandBox
