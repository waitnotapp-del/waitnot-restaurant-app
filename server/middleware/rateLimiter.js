import rateLimit from 'express-rate-limit';

// Rate limiter for voice API
export const voiceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many voice requests. Please wait a moment.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests. Please try again later.'
  }
});

export default {
  voiceRateLimiter,
  apiRateLimiter
};
