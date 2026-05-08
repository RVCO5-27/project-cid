const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Upload rate limit exceeded. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : (req.ip || req.socket.remoteAddress);
  }
});

module.exports = uploadLimiter;
