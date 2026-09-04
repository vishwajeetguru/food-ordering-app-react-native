import crypto from 'crypto';
import { getAuth, isFirebaseConfigured } from '../config/firebase';
import { isTest } from '../config/env';
import { logger } from '../utils/logger';
import { userRepository } from '../repositories/user.repository';
import { otpService } from './otp.service';
import { magicLinkService } from './magic-link.service';
import { emailService } from './email.service';
import { userService } from './user.service';
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { AuthResult } from '../types/auth.types';

function generateMockUid(email: string): string {
  // Deterministic UID for dev/mock when Firebase not configured
  return 'mock_' + crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 28);
}

async function findOrCreateFirebaseUser(email: string): Promise<{ uid: string; isNew: boolean }> {
  const normalized = email.toLowerCase().trim();

  if (!isFirebaseConfigured()) {
    const uid = generateMockUid(normalized);
    const existing = await userRepository.findById(uid);
    if (existing) return { uid, isNew: false };
    // Pre-create firestore doc later via service; just signal new
    return { uid, isNew: !existing };
  }

  const auth = getAuth();
  try {
    const fbUser = await auth.getUserByEmail(normalized);
    return { uid: fbUser.uid, isNew: false };
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      // Create new Firebase user without password (email provider)
      const created = await auth.createUser({
        email: normalized,
        emailVerified: true, // verified via OTP/magic link
      });
      logger.info('Firebase user created via OTP/magic link flow', { uid: created.uid, email: normalized });
      return { uid: created.uid, isNew: true };
    }
    throw e;
  }
}

async function createCustomToken(uid: string): Promise<string | undefined> {
  if (!isFirebaseConfigured()) {
    // Mock token: base64 of uid + timestamp, client can still use for backend auth via mock verifier
    const payload = JSON.stringify({ uid, iat: Date.now(), mock: true });
    return Buffer.from(payload).toString('base64url');
  }
  try {
    const token = await getAuth().createCustomToken(uid);
    return token;
  } catch (e: any) {
    logger.error('Failed to create custom token', { error: e.message, uid });
    return undefined;
  }
}

export const authService = {
  async sendOtp(email: string, channel = 'email') {
    return otpService.sendOtp(email, channel);
  },

  async verifyOtp(email: string, otp: string, channel = 'email'): Promise<AuthResult> {
    await otpService.verifyOtp(email, otp, channel);

    const normalized = email.toLowerCase().trim();
    const { uid, isNew } = await findOrCreateFirebaseUser(normalized);

    // Ensure Firestore user doc exists / updated
    await userService.ensureUserExists(uid, normalized, {
      providers: channel === 'email' ? ['email_otp'] : [channel],
      emailVerified: true,
    });

    // Update emailVerified in Firebase if needed
    if (isFirebaseConfigured()) {
      try {
        await getAuth().updateUser(uid, { emailVerified: true });
      } catch (e: any) {
        logger.warn('Failed to update emailVerified in Firebase', { error: e.message, uid });
      }
    }

    const customToken = await createCustomToken(uid);
    return { uid, email: normalized, customToken, isNewUser: isNew };
  },

  async sendMagicLink(email: string) {
    return magicLinkService.sendMagicLink(email);
  },

  async verifyMagicLink(token: string): Promise<AuthResult> {
    const email = await magicLinkService.verifyMagicLink(token);
    const normalized = email.toLowerCase().trim();
    const { uid, isNew } = await findOrCreateFirebaseUser(normalized);

    await userService.ensureUserExists(uid, normalized, {
      providers: ['magic_link'],
      emailVerified: true,
    });

    if (isFirebaseConfigured()) {
      try {
        await getAuth().updateUser(uid, { emailVerified: true });
      } catch {}
    }

    const customToken = await createCustomToken(uid);
    return { uid, email: normalized, customToken, isNewUser: isNew };
  },

  async setPassword(uid: string, password: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      // Mock: just mark hasPassword true
      const user = await userRepository.findById(uid);
      if (!user) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
      await userRepository.update(uid, { hasPassword: true } as any);
      logger.info('[MOCK] Password set for user', { uid });
      return;
    }

    try {
      await getAuth().updateUser(uid, { password });
      await userRepository.update(uid, { hasPassword: true } as any);
      // Ensure provider includes password
      const user = await userRepository.findById(uid);
      if (user && !user.providers.includes('password')) {
        await userRepository.update(uid, { providers: [...user.providers, 'password'] } as any);
      }
      logger.info('Password set for user', { uid });
    } catch (e: any) {
      logger.error('setPassword failed', { error: e.message, uid });
      throw new BadRequestError(e.message || 'Failed to set password', ERROR_CODES.BAD_REQUEST);
    }
  },

  async changePassword(uid: string, newPassword: string, currentPassword?: string): Promise<void> {
    // Security: require currentPassword for re-authentication — client should have re-authed via Firebase
    // signInWithEmailAndPassword or reauthenticateWithCredential before calling.
    // Server enforces that currentPassword is supplied and different from newPassword (Zod already validates).
    // For Firebase Admin, we cannot verify currentPassword server-side (needs client SDK), but we log and ensure hasPassword flow.
    if (!currentPassword) {
      throw new BadRequestError('Current password is required for re-authentication', ERROR_CODES.BAD_REQUEST);
    }
    // Ensure user exists and has a password set (except first-time set via setPassword)
    const user = await userRepository.findById(uid);
    if (!user) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
    logger.info('Password change requested — re-auth via currentPassword provided', { uid, hasPassword: user.hasPassword });
    return this.setPassword(uid, newPassword);
  },

  async forgotPassword(email: string): Promise<{ link?: string }> {
    const normalized = email.toLowerCase().trim();

    if (!isFirebaseConfigured()) {
      logger.info(`[MOCK] Forgot password requested for ${normalized} - would send reset link`);
      return {};
    }

    try {
      const link = await getAuth().generatePasswordResetLink(normalized);
      if (process.env.NODE_ENV !== 'test') {
        await emailService.send(
          normalized,
          'Reset your Foody password',
          `Reset your Foody password by visiting: ${link}\n\nIf you did not request this, please ignore this email.`,
          `<div style="font-family:sans-serif;max-width:420px;margin:0 auto">
            <h2>Foody</h2>
            <p>Tap the button below to reset your password:</p>
            <p><a href="${link}" style="background:#FF5A3D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset password</a></p>
          </div>`
        );
      }
      logger.info('Password reset link generated', { email: normalized });
      if (process.env.NODE_ENV !== 'production') {
        // expose link in dev to ease testing
        return { link };
      }
      return {};
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Don't reveal existence; return success silently
        logger.info('Forgot password for non-existent user (masked)', { email: normalized });
        return {};
      }
      logger.error('forgotPassword failed', { error: e.message, email: normalized });
      throw new BadRequestError(e.message || 'Failed to process forgot password', ERROR_CODES.BAD_REQUEST);
    }
  },

  async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    // Firebase Admin doesn't verify oobCode directly; that verification happens client-side via
    // confirmPasswordReset. Backend can only generate links; resetting via Admin requires uid.
    // For backend-managed flow, we can't verify oobCode without client SDK.
    // We document that reset should be done via Firebase Client SDK: confirmPasswordReset(auth, oobCode, newPassword)
    // This endpoint is kept for completeness but will instruct client usage.
    throw new BadRequestError(
      'Password reset via backend oobCode not supported. Use Firebase Client SDK confirmPasswordReset with oobCode, or use generatePasswordResetLink flow.',
      ERROR_CODES.BAD_REQUEST
    );
  },

  // Google auth placeholder: The mobile app will sign in via Firebase Google provider and send idToken to backend.
  // Backend's authenticate middleware will verify token and auto-sync user doc.
  async handleGoogleAuth(idToken: string): Promise<AuthResult> {
    if (!isFirebaseConfigured()) {
      throw new BadRequestError('Google auth requires Firebase configuration', ERROR_CODES.BAD_REQUEST);
    }
    try {
      const decoded = await getAuth().verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email || '';
      await userService.ensureUserExists(uid, email, {
        providers: ['google'],
        emailVerified: !!decoded.email_verified,
        name: decoded.name as string | undefined,
      });
      return { uid, email };
    } catch (e: any) {
      throw new UnauthorizedError('Invalid Google ID token', ERROR_CODES.INVALID_TOKEN);
    }
  },

  async getCurrentUser(uid: string) {
    return userService.syncFromFirebase(uid);
  },
};
