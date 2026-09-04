import { ERROR_CODES } from '../config/constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code: string = ERROR_CODES.BAD_REQUEST, details?: any) {
    super(message, 400, code, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code: string = ERROR_CODES.UNAUTHORIZED, details?: any) {
    super(message, 401, code, true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code: string = ERROR_CODES.FORBIDDEN, details?: any) {
    super(message, 403, code, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', code: string = ERROR_CODES.NOT_FOUND, details?: any) {
    super(message, 404, code, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code: string = ERROR_CODES.CONFLICT, details?: any) {
    super(message, 409, code, true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 422, ERROR_CODES.VALIDATION_ERROR, true, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code: string = ERROR_CODES.OTP_RATE_LIMITED, details?: any) {
    super(message, 429, code, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code = ERROR_CODES.INTERNAL_ERROR) {
    super(message, 500, code, true);
  }
}
