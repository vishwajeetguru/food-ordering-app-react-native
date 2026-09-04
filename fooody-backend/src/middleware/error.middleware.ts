import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';
import { ZodError } from 'zod';

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  if (err instanceof AppError) {
    // Operational error – safe to expose
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, statusCode: err.statusCode, stack: err.stack });
    } else {
      logger.warn(err.message, { code: err.code, statusCode: err.statusCode });
    }
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Unknown error
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const message = isProduction ? 'Internal server error' : err.message || 'Internal server error';
  const code = 'INTERNAL_ERROR';
  // Never leak stack in production
  const details = isProduction ? undefined : { stack: err.stack };
  return sendError(res, message, 500, code, details);
}
