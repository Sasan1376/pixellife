const express = require("express");
const crypto = require("crypto");
const AnalyticsDaily = require("../models/AnalyticsDaily");

const router = express.Router();

function dateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

router.post("/track", async (req, res) => {
  try {
    const requestedPage = typeof req.body?.page === "string" ? req.body.page : "/";
    const page = requestedPage.startsWith("/") ? requestedPage.slice(0, 180) : "/";
    const visitorId = req.cookies?.pl_visitor || crypto.randomBytes(16).toString("hex");
    const visitorHash = crypto.createHash("sha256").update(visitorId).digest("hex");

    if (!req.cookies?.pl_visitor) {
      res.cookie("pl_visitor", visitorId, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    await AnalyticsDaily.updateOne(
      { date: dateKey(), page },
      { $inc: { views: 1 }, $addToSet: { visitors: visitorHash } },
      { upsert: true },
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Client visit analytics error:", error);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
