const rateLimit = require('express-rate-limit');
const ApiError = require('./ApiError');

const makeLimiter = (minutes, limit, message, extraOptions = {}) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => next(new ApiError(429, message)),
    ...extraOptions,
  });

// Login / register / reset password
const authLimiter = makeLimiter(15, 20, 'Too many attempts, try again in 15 minutes');

// Forgot password (stops email spam)
const forgotPasswordLimiter = makeLimiter(60, 5, 'Too many reset requests, try again in an hour');

// Ebook downloads: each logged-in user gets a limited number per hour.
const downloadLimiter = makeLimiter(60, 30, 'Too many downloads, try again later', {
  keyGenerator: (req) => (req.user ? req.user.id : req.ip), // runs after login, so req.user exists
});

// Contact form (stops spam): 5 messages per hour from one address.
const contactLimiter = makeLimiter(60, 5, 'Too many messages, try again in an hour');

module.exports = { authLimiter, forgotPasswordLimiter, downloadLimiter, contactLimiter };
