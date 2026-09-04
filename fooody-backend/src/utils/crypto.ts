import crypto from 'crypto';

export function generateOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, digits.length);
    otp += digits[idx];
  }
  return otp;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex'); // 64 hex chars for 32 bytes
}

export function isExpired(expiresAt: Date | admin.firestore.Timestamp | string): boolean {
  const date =
    typeof expiresAt === 'string'
      ? new Date(expiresAt)
      : (expiresAt as any)?.toDate
        ? (expiresAt as any).toDate()
        : (expiresAt as Date);
  return date.getTime() <= Date.now();
}

// Helper to avoid importing admin type here circularly; use any
declare namespace admin {
  namespace firestore {
    interface Timestamp {
      toDate(): Date;
    }
  }
}
