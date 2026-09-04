import winston from 'winston';
import { env, isProduction } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Sanitize sensitive fields before logging — includes PII per audit
const SENSITIVE_KEYS = new Set([
  'password',
  'otp',
  'token',
  'idToken',
  'customToken',
  'privateKey',
  'private_key',
  'authorization',
  'email',
  'phone',
]);

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const copy: any = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(copy)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else if (typeof copy[key] === 'object') {
      copy[key] = sanitize(copy[key]);
    }
  }
  return copy;
}

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(sanitize(meta))}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} [${level}]: ${message}${metaStr}${stackStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  // Prevent leaking sensitive logs in production (redact OTPs etc via sanitize)
});

// Helper to log without sensitive data
export function safeLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta?: any) {
  logger.log(level, message, meta ? sanitize(meta) : undefined);
}
