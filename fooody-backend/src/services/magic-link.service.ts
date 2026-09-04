import { env, isTest } from '../config/env';
import { ERROR_CODES } from '../config/constants';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateSecureToken, hashToken } from '../utils/crypto';
import { magicLinkRepository } from '../repositories/magicLink.repository';
import { emailService } from './email.service';
import { MagicLinkRecord } from '../types/auth.types';

function nowISO() {
  return new Date().toISOString();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const magicLinkCooldown = new Map<string, number>();
export const magicLinkService = {
  async sendMagicLink(email: string): Promise<{ expiresAt: string; link: string }> {
    const normalized = email.toLowerCase().trim();
    // Cooldown per email — prevent spam (60s like OTP)
    const last = magicLinkCooldown.get(normalized);
    const nowMs = Date.now();
    const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (last && nowMs - last < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - (nowMs - last)) / 1000);
      const { TooManyRequestsError } = await import('../utils/errors');
      throw new TooManyRequestsError(
        `Please wait ${retryAfter}s before requesting another magic link`,
        ERROR_CODES.OTP_RESEND_COOLDOWN,
        { retryAfter }
      );
    }
    magicLinkCooldown.set(normalized, nowMs);
    const rawToken = generateSecureToken(32); // 64 hex chars
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const expiresAt = addMinutes(now, env.MAGIC_LINK_EXPIRATION_MINUTES).toISOString();

    const record: MagicLinkRecord = {
      id: tokenHash,
      email: normalized,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: nowISO(),
    };

    await magicLinkRepository.create(record);

    const baseUrl = env.MAGIC_LINK_REDIRECT_URL;
    // Support both ?token= and deep link schemes
    const separator = baseUrl.includes('?') ? '&' : '?';
    const link = `${baseUrl}${separator}token=${rawToken}&email=${encodeURIComponent(normalized)}`;

    const minutes = env.MAGIC_LINK_EXPIRATION_MINUTES;
    const subject = 'Your Foody Magic Link';
    const text = `Tap to sign in to Foody: ${link}\n\nThis link expires in ${minutes} minutes. If you did not request this, please ignore this email.`;
    const html = `<div style="font-family:sans-serif;max-width:420px;margin:0 auto">
      <h2>Foody</h2>
      <p>Tap the button below to sign in:</p>
      <p><a href="${link}" style="background:#FF5A3D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Sign in to Foody</a></p>
      <p style="color:#666">Link expires in ${minutes} minutes.</p>
    </div>`;
    const sent = isTest ? false : await emailService.send(normalized, subject, text, html);

    if (env.NODE_ENV === 'production') {
      logger.info('Magic link email dispatched', { email: normalized, expiresAt, sent });
    } else {
      logger.info(`[DEV] Magic link for ${normalized}: ${link} (expires ${expiresAt}, sent=${sent})`);
    }

    return { expiresAt, link: env.NODE_ENV === 'production' ? '' : link }; // don't leak link in prod response
  },

  // For API testing, we return link only in non-production
  async verifyMagicLink(token: string): Promise<string> {
    // token is raw token from query
    const tokenHash = hashToken(token.trim());
    const record = await magicLinkRepository.getByHash(tokenHash);

    if (!record) {
      throw new BadRequestError('Invalid magic link token', ERROR_CODES.MAGIC_LINK_INVALID);
    }

    if (record.used) {
      throw new BadRequestError('Magic link already used', ERROR_CODES.MAGIC_LINK_ALREADY_USED);
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      throw new BadRequestError('Magic link has expired. Please request a new one.', ERROR_CODES.MAGIC_LINK_EXPIRED);
    }

    await magicLinkRepository.markUsed(tokenHash);
    logger.info('Magic link verified', { email: record.email });

    return record.email;
  },

  // Helper used by auth.service to consume token and get email atomically
  async consumeToken(token: string): Promise<string> {
    return this.verifyMagicLink(token);
  },
};
