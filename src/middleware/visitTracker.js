const crypto = require("crypto");
const AnalyticsDaily = require("../models/AnalyticsDaily");

function dateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shouldTrack(req) {
  if (req.method !== "GET" || req.path.startsWith("/admin") || req.path.startsWith("/api") || req.path === "/sitemap.xml") return false;
  if (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(req.path)) return false;
  if (/bot|crawler|spider|facebookexternalhit|preview/i.test(req.get("user-agent") || "")) return false;
  return true;
}

module.exports = function visitTracker(req, res, next) {
  if (!shouldTrack(req)) return next();
  let visitorId = req.cookies?.pl_visitor;
  if (!visitorId || !/^[a-f0-9]{32}$/i.test(visitorId)) {
    visitorId = crypto.randomBytes(16).toString("hex");
    res.cookie("pl_visitor", visitorId, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  const visitorHash = crypto.createHash("sha256").update(visitorId).digest("hex");
  const page = req.path === "/" ? "/" : req.path.replace(/\/$/, "");
  res.on("finish", () => {
    if (res.statusCode >= 400) return;
    AnalyticsDaily.updateOne({ date: dateKey(), page }, { $inc: { views: 1 }, $addToSet: { visitors: visitorHash } }, { upsert: true })
      .catch((error) => console.error("Visit analytics error:", error.message));
  });
  next();
};
