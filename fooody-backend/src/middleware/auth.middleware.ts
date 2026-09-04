import { Request, Response, NextFunction } from 'express';
import { getAuth, isFirebaseConfigured } from '../config/firebase';
import { env, isProduction } from '../config/env';
import { logger } from '../utils/logger';
import { UnauthorizedError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { userService } from '../services/user.service';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header', ERROR_CODES.UNAUTHORIZED);
    }

    const token = header.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Missing authentication token', ERROR_CODES.UNAUTHORIZED);
    }

    // Mock mode for dev/test when Firebase not configured — FIXED: never allow in production
    if (!isFirebaseConfigured()) {
      if (isProduction) {
        // Fail-closed: mock bypass is never allowed in production, even if Firebase misconfigured
        throw new UnauthorizedError('Authentication not configured. Mock auth disabled in production.', ERROR_CODES.INVALID_TOKEN);
      }
      if (env.ALLOW_MOCK_AUTH !== 'true') {
        throw new UnauthorizedError('Mock authentication disabled. Set ALLOW_MOCK_AUTH=true for dev/test only.', ERROR_CODES.INVALID_TOKEN);
      }
      // Expect mock token: base64url JSON {uid, mock:true, iat} OR allow test token "test-token-<uid>"
      // Note: base64 mock is unsigned — only for local dev/test, never prod (see check above)
      if (token.startsWith('test-token-')) {
        const uid = token.replace('test-token-', '');
        if (!uid || uid.length < 3 || uid.length > 128) {
          throw new UnauthorizedError('Invalid test token format', ERROR_CODES.INVALID_TOKEN);
        }
        // Let userService.getById propagate 404 so deleted users return 404, not 401 masking
        const user = await userService.getById(uid);
        if (user.status === 'deleted' || user.status === 'disabled') {
          throw new UnauthorizedError('User account is disabled or deleted', ERROR_CODES.FORBIDDEN);
        }
        (req as any).user = user;
        (req as any).firebaseUser = { uid, mock: true } as any;
        return next();
      }

      try {
        const payloadStr = Buffer.from(token, 'base64url').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload.mock && payload.uid && typeof payload.uid === 'string' && payload.uid.length >= 3) {
          const uid = payload.uid as string;
          // Enforce iat freshness (24h) to limit replay of old mock tokens
          if (payload.iat && typeof payload.iat === 'number' && Date.now() - payload.iat > 24 * 60 * 60 * 1000) {
            throw new UnauthorizedError('Mock token expired', ERROR_CODES.TOKEN_EXPIRED);
          }
          // Try to load user; if not found, deny — no auto-create via mock (prevents IDOR)
          const user = await userService.getById(uid);
          if (user.status === 'deleted' || user.status === 'disabled') {
            throw new UnauthorizedError('User account is disabled or deleted', ERROR_CODES.FORBIDDEN);
          }
          (req as any).user = user;
          (req as any).firebaseUser = { uid, mock: true, ...payload } as any;
          return next();
        }
      } catch (e) {
        // If e is AppError (like 404/403 from getById), propagate
        if ((e as any)?.statusCode === 404 || (e as any)?.statusCode === 401 || (e as any)?.statusCode === 403) throw e;
        // otherwise not mock format; fall through to invalid
      }

      throw new UnauthorizedError('Invalid mock token format', ERROR_CODES.INVALID_TOKEN);
    }

    // Production: verify Firebase ID token
    try {
      const decoded = await getAuth().verifyIdToken(token);
      (req as any).firebaseUser = decoded;

      // Load/sync Firestore user
      const user = await userService.syncFromFirebase(decoded.uid);
      (req as any).user = user;
      return next();
    } catch (err: any) {
      logger.warn('Firebase token verification failed', { error: err.message });
      if (err.code === 'auth/id-token-expired') {
        throw new UnauthorizedError('Token expired', ERROR_CODES.TOKEN_EXPIRED);
      }
      throw new UnauthorizedError('Invalid or expired token', ERROR_CODES.INVALID_TOKEN);
    }
  } catch (err) {
    return next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return next(new UnauthorizedError('Not authenticated', ERROR_CODES.UNAUTHORIZED));
    }
    if (user.status && user.status !== 'active') {
      return next(new UnauthorizedError(`Forbidden: account status ${user.status}`, ERROR_CODES.FORBIDDEN));
    }
    if (!roles.includes(user.role)) {
      return next(
        new UnauthorizedError(`Forbidden: requires role ${roles.join(' or ')}`, ERROR_CODES.FORBIDDEN)
      );
    }
    return next();
  };
}

// Optional: allow public but attach user if token present
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  // reuse authenticate but don't fail if missing
  return authenticate(req, _res, (err) => {
    if (err) {
      // ignore auth error for optional
      logger.debug('optionalAuth ignored error', { error: (err as Error).message });
      return next();
    }
    return next();
  });
}
