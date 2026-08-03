const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * سرویس مدیریت توکن‌های JWT
 */
const tokenService = {
  /**
   * ساخت توکن JWT برای کاربر
   * @param {string} userId - شناسه کاربر
   * @returns {string} توکن JWT
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });
  },

  /**
   * تأیید و دیکد توکن JWT
   * @param {string} token - توکن JWT
   * @returns {object} payload توکن
   */
  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  },
};

module.exports = tokenService;
