const session = require("express-session");

// یک نشست مشترک برای صفحهٔ ورود ادمین و API پنل.
// با یک نمونهٔ واحد، وضعیت ورود بین /admin و /admin/api حفظ می‌شود.
module.exports = session({
  secret: process.env.SESSION_SECRET || "pixellife-admin-session-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    sameSite: "lax",
  },
});
