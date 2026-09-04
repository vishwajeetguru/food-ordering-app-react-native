import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    return fallback ?? '';
  }
  return value;
}

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const cors = process.env.CORS_ORIGIN || '*';
  if (nodeEnv === 'production') {
    if (cors === '*') {
      throw new Error(
        'SECURITY: CORS_ORIGIN=* is not allowed in production. Set explicit origins (e.g. https://yourdomain.com,https://app.yourdomain.com)'
      );
    }
    if (process.env.ALLOW_MOCK_AUTH === 'true') {
      throw new Error('SECURITY: ALLOW_MOCK_AUTH=true is not allowed in production. Mock auth bypass must be disabled.');
    }
    const hasFile = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const hasInline = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
    const hasADC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!hasFile && !hasInline && !hasADC) {
      throw new Error(
        'SECURITY: Firebase credentials missing in production. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_* env vars or GOOGLE_APPLICATION_CREDENTIALS'
      );
    }
    if (hasFile) {
      const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH!);
      if (!fs.existsSync(p)) {
        throw new Error(`Firebase service account file not found at: ${p}`);
      }
    }
  }
}

// Validate immediately on import (fail-fast in prod)
validateEnv();

export const env = {
  NODE_ENV: requireEnv('NODE_ENV', 'development'),
  PORT: parseIntEnv('PORT', 5000),
  CORS_ORIGIN: requireEnv('CORS_ORIGIN', '*'),
  // Firebase
  FIREBASE_PROJECT_ID: requireEnv('FIREBASE_PROJECT_ID', ''),
  FIREBASE_CLIENT_EMAIL: requireEnv('FIREBASE_CLIENT_EMAIL', ''),
  FIREBASE_PRIVATE_KEY: requireEnv('FIREBASE_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  FIREBASE_SERVICE_ACCOUNT_PATH: requireEnv('FIREBASE_SERVICE_ACCOUNT_PATH', ''),
  // Magic link
  MAGIC_LINK_REDIRECT_URL: requireEnv('MAGIC_LINK_REDIRECT_URL', 'foody://auth/magic-link'),
  MAGIC_LINK_EXPIRATION_MINUTES: parseIntEnv('MAGIC_LINK_EXPIRATION_MINUTES', 15),
  // OTP
  OTP_EXPIRATION_MINUTES: parseIntEnv('OTP_EXPIRATION_MINUTES', 5),
  OTP_RESEND_COOLDOWN_SECONDS: parseIntEnv('OTP_RESEND_COOLDOWN_SECONDS', 60),
  OTP_MAX_ATTEMPTS: parseIntEnv('OTP_MAX_ATTEMPTS', 5),
  OTP_LENGTH: parseIntEnv('OTP_LENGTH', 6),
  OTP_MAX_RESENDS_PER_HOUR: parseIntEnv('OTP_MAX_RESENDS_PER_HOUR', 5),
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseIntEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX: parseIntEnv('RATE_LIMIT_MAX', 100),
  // Email (SMTP)
  SMTP_HOST: requireEnv('SMTP_HOST', ''),
  SMTP_PORT: parseIntEnv('SMTP_PORT', 587),
  SMTP_USER: requireEnv('SMTP_USER', ''),
  SMTP_PASS: requireEnv('SMTP_PASS', ''),
  SMTP_FROM: requireEnv('SMTP_FROM', ''),
  SMTP_FROM_NAME: requireEnv('SMTP_FROM_NAME', 'Foody'),
  // Misc
  LOG_LEVEL: requireEnv('LOG_LEVEL', 'info'),
  ALLOW_MOCK_AUTH: requireEnv('ALLOW_MOCK_AUTH', (process.env.NODE_ENV === 'test' ? 'true' : 'false')),
} as const;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
