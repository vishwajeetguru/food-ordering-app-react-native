import { z } from 'zod';

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  channel: z.enum(['email']).optional().default('email'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  otp: z
    .string()
    .min(4, 'OTP must be at least 4 digits')
    .max(8, 'OTP must be at most 8 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
  channel: z.enum(['email']).optional().default('email'),
});

export const sendMagicLinkSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const verifyMagicLinkSchema = z.object({
  token: z.string().min(10, 'Token is required').trim(),
});

export const verifyMagicLinkQuerySchema = z.object({
  token: z.string().min(10, 'Token is required').trim(),
});

export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  currentPassword: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  oobCode: z.string().min(5, 'Reset code is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
