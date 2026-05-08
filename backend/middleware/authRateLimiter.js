const rateLimit = require('express-rate-limit');

/**
 * Stricter limit for POST /auth/login — counts failed attempts only when
 * skipSuccessfulRequests is true.
 */
const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

module.exports = { authLoginLimiter };
