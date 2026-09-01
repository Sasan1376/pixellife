const crypto = require("crypto");
const tokenService = require("./tokenService");
const BehaviorEvent = require("../models/BehaviorEvent");

const COOKIE_NAME = "pl_behavior_visitor";
const RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function ensureVisitorHash(req, res) {
  let visitorId = req.cookies?.[COOKIE_NAME];
  if (!visitorId || !/^[a-f0-9]{32}$/i.test(visitorId)) {
    visitorId = crypto.randomBytes(16).toString("hex");
    res.cookie(COOKIE_NAME, visitorId, {
      maxAge: 180 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return hash(visitorId);
}

function resolveUserId(req) {
  try {
    const token = req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : "");
    return token ? tokenService.verifyToken(token).id : null;
  } catch (_) {
    return null;
  }
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanFilters(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 8)
      .filter(([key, item]) => /^[a-zA-Z0-9_آ-ی-]{1,40}$/.test(key) && ["string", "number", "boolean"].includes(typeof item))
      .map(([key, item]) => [key, typeof item === "string" ? item.slice(0, 80) : item]),
  );
}

async function recordBehaviorEvent(req, res, event, source = "client") {
  const visitorHash = ensureVisitorHash(req, res);
  const sessionId = cleanText(event.sessionId, 64);
  const hasSessionId = /^[a-f0-9]{16,64}$/i.test(sessionId);
  if (!hasSessionId && source !== "server") return null;

  return BehaviorEvent.create({
    type: event.type,
    visitorHash,
    sessionHash: hasSessionId ? hash(sessionId) : visitorHash,
    userId: resolveUserId(req),
    page: cleanText(event.page, 180) || "/",
    productId: cleanText(event.productId, 120),
    category: cleanText(event.category, 100),
    brand: cleanText(event.brand, 80),
    searchTerm: cleanText(event.searchTerm, 120),
    filters: cleanFilters(event.filters),
    source,
    expiresAt: new Date(Date.now() + RETENTION_MS),
  });
}

module.exports = { recordBehaviorEvent };
