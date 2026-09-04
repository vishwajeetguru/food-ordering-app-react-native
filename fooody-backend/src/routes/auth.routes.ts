import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, otpLimiter } from '../middleware/rate-limit.middleware';
import {
  sendOtpSchema,
  verifyOtpSchema,
  sendMagicLinkSchema,
  verifyMagicLinkSchema,
  verifyMagicLinkQuerySchema,
  setPasswordSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Public OTP
router.post('/send-otp', otpLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

// Magic link — both GET and POST now validated and rate-limited
router.post('/send-magic-link', otpLimiter, validate(sendMagicLinkSchema), authController.sendMagicLink);
// GET for email click / deep link (query ?token=), POST for API JSON
router.get('/verify-magic-link', authLimiter, validate(verifyMagicLinkQuerySchema, 'query'), authController.verifyMagicLink);
router.post('/verify-magic-link', authLimiter, validate(verifyMagicLinkSchema), authController.verifyMagicLink);

// Password flows
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Authenticated password management
router.post('/set-password', authenticate, validate(setPasswordSchema), authController.setPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// Current user & session
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

// Google — verify Firebase ID token from client (popup or native) and sync user — rate limited
router.post('/google', authLimiter, authController.googleAuth);

export default router;
