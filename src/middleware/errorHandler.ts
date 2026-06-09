// ============================================================
// Hermes GitHub — Middleware de gestion d'erreurs
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HermesError, ApiResponse } from '../types';

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId =
    (req.headers['x-request-id'] as string) || uuidv4();

  // Default to 500 Internal Server Error
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (err instanceof HermesError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'SyntaxError' && (err as any).status === 400) {
    // Body-parser JSON parse error
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'AUTHENTICATION_ERROR';
    message = 'Invalid or expired token';
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, expose the raw error message
    message = err.message;
  }

  // Log the error
  console.error(`[${requestId}] ${code} (${statusCode}): ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(statusCode).json(response);
}

/**
 * Catch-all 404 handler for unknown routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    requestId: (req.headers['x-request-id'] as string) || uuidv4(),
  };

  res.status(404).json(response);
}

/**
 * Async route wrapper to catch promise rejections.
 * Usage: asyncHandler(async (req, res) => { ... })
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request logging middleware.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId =
    (req.headers['x-request-id'] as string) || uuidv4();

  // Attach request ID
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = [
      `[${new Date().toISOString()}]`,
      req.method,
      req.originalUrl,
      res.statusCode,
      `${duration}ms`,
      `- ${req.ip}`,
    ].join(' ');

    if (res.statusCode >= 400) {
      console.error(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}

/**
 * Response wrapper helper.
 * Appends consistent fields to every API response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.getHeader('X-Request-Id') as string,
  };
  res.status(statusCode).json(response);
}
