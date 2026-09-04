import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';

export const authController = {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, channel } = req.body;
      const result = await authService.sendOtp(email, channel);
      sendSuccess(res, result, 'OTP sent successfully');
    } catch (err) {
      next(err);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, channel } = req.body;
      const result = await authService.verifyOtp(email, otp, channel);
      sendSuccess(
        res,
        {
          uid: result.uid,
          email: result.email,
          customToken: result.customToken,
          isNewUser: result.isNewUser,
          message:
            'OTP verified. Use customToken with Firebase client signInWithCustomToken to obtain ID token, then use Bearer token for subsequent requests.',
        },
        'OTP verified successfully',
        200
      );
    } catch (err) {
      next(err);
    }
  },

  async sendMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.sendMagicLink(email);
      // In production, don't expose link
      const data =
        process.env.NODE_ENV === 'production'
          ? { expiresAt: result.expiresAt, message: 'Magic link sent to email if account exists' }
          : result;
      sendSuccess(res, data, 'Magic link sent successfully');
    } catch (err) {
      next(err);
    }
  },

  async verifyMagicLink(req: Request, res: Response, next: NextFunction) {
    try {
      // Support both GET query token and POST body token
      const token = (req.query.token as string) || req.body.token;
      if (!token) {
        const { sendError } = await import('../utils/response');
        return sendError(res, 'Missing token', 400, 'VALIDATION_ERROR');
      }
      const result = await authService.verifyMagicLink(token as string);

      // Determine if request expects redirect (browser) vs JSON (mobile API)
      const acceptsHtml = req.headers.accept?.includes('text/html');
      if (acceptsHtml && req.method === 'GET') {
        // Escape email to prevent XSS
        const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
        const html = `
          <html><body style="font-family:sans-serif; text-align:center; padding:40px;">
            <h2>Foody – Magic link verified</h2>
            <p>You are now authenticated. You can close this window and return to the app.</p>
            <p>Email: ${esc(result.email)}</p>
          </body></html>`;
        return res.status(200).send(html);
      }

      sendSuccess(
        res,
        {
          uid: result.uid,
          email: result.email,
          customToken: result.customToken,
          isNewUser: result.isNewUser,
        },
        'Magic link verified successfully'
      );
    } catch (err) {
      next(err);
    }
  },

  async setPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      const { password } = req.body;
      await authService.setPassword(uid, password);
      sendSuccess(res, null, 'Password set successfully');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      const { newPassword, currentPassword } = req.body;
      await authService.changePassword(uid, newPassword, currentPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      // Never reveal if email exists; generic message
      const data =
        process.env.NODE_ENV !== 'production' && (result as any).link
          ? { link: (result as any).link }
          : null;
      sendSuccess(res, data, 'If an account with that email exists, a password reset link has been sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oobCode, newPassword } = req.body;
      await authService.resetPassword(oobCode, newPassword);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const uid = (req as any).user.id;
      const user = await authService.getCurrentUser(uid);
      sendSuccess(res, user, 'Current user retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response) {
    // Stateless Firebase: client should delete token locally.
    // Optionally revoke refresh tokens if Firebase Admin configured.
    sendSuccess(res, null, 'Logged out successfully. Please discard tokens on client.');
  },

  // Google placeholder – actual flow is client-side Firebase Google sign-in
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        // Inform client about expected flow
        return sendSuccess(
          res,
          {
            flow: 'Expo App -> Google Sign-In -> Firebase Authentication -> getIdToken() -> Authorization: Bearer <idToken>',
            note: 'Send Firebase ID token via Authorization header to any authenticated endpoint; backend will auto-sync user.',
          },
          'Google auth architecture ready'
        );
      }
      const result = await authService.handleGoogleAuth(idToken);
      sendSuccess(res, result, 'Google authentication successful');
    } catch (err) {
      next(err);
    }
  },

  // Admin login — email + password, returns customToken + user. Works in both mock and Firebase modes.
  // For production, also accepts Firebase ID token directly via Authorization header (handled by /auth/me).
  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        const { BadRequestError } = await import('../utils/errors');
        const { ERROR_CODES } = await import('../config/constants');
        throw new BadRequestError('Email and password required', ERROR_CODES.BAD_REQUEST);
      }
      const result = await authService.adminLogin(email, password);
      sendSuccess(res, result, 'Admin login successful');
    } catch (err) { next(err); }
  },
};
