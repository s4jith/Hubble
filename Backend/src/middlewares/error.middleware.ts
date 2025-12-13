import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger, sanitizeLogData } from '../utils/logger';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';
import { env } from '../config/env';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

/**
 * Central Error Handler Middleware
 * Catches all errors and sends appropriate responses
 * 
 * SECURITY: Error messages are sanitized in production to avoid information leakage
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error (sanitized)
  logger.error('Error occurred:', {
    message: err.message,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: sanitizeLogData(req.body as Record<string, unknown>),
    userId: (req as unknown as { user?: { userId: string } }).user?.userId,
  });

  // Handle specific error types
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.code, err.errors);
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(e.message);
    });
    sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', errors);
    return;
  }

  // Handle MongoDB errors
  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 'Invalid ID format', HTTP_STATUS.BAD_REQUEST, 'INVALID_ID');
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = [err.errors[key].message];
    });
    sendError(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', errors);
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as unknown as { code?: number }).code === 11000) {
    const field = Object.keys((err as unknown as { keyValue?: Record<string, unknown> }).keyValue || {})[0];
    sendError(
      res,
      `${field} already exists`,
      HTTP_STATUS.CONFLICT,
      'DUPLICATE_KEY'
    );
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED, 'INVALID_TOKEN');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED, 'TOKEN_EXPIRED');
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'Invalid JSON', HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON');
    return;
  }

  // Default to internal server error
  const message = env.nodeEnv === 'production'
    ? ERROR_MESSAGES.INTERNAL_ERROR
    : err.message;

  sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
};

/**
 * Not Found Handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `Cannot ${req.method} ${req.path}`,
    HTTP_STATUS.NOT_FOUND,
    'NOT_FOUND'
  );
};

export default errorHandler;
