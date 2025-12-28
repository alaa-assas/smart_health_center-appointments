const rateLimiter = require("express-rate-limit");

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: {
    error: "Too many requests from this IP,cplease try again later",
  },
  standardHeaders: true,
});

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    error: "Too many requests from this IP,cplease try again later",
  },
  standardHeaders: true,
});

module.exports = {
  apiLimiter,
  loginLimiter,
};
