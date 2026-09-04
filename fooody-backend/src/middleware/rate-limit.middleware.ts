import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/response';

// Generic API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later', 429, 'RATE_LIMITED');
  },
});

// Stricter for OTP/magic-link endpoints (prevent abuse)
const isTest = process.env.NODE_ENV === 'test';
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isTest ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many authentication attempts, please try again later', 429, 'OTP_RATE_LIMITED');
  },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many OTP requests. Please try again later.', 429, 'OTP_RATE_LIMITED');
  },
});
