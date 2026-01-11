import rateLimit from 'express-rate-limit';

// General API rate limiter - 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for authentication routes - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment route limiter - 10 requests per hour
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics limiter - more generous for tracking
export const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many analytics requests.',
  standardHeaders: true,
  legacyHeaders: false,
});
