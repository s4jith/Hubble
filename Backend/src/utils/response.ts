import { Response } from 'express';
import { HTTP_STATUS } from '../config/constants';

/**
 * Standardized API Response Handler
 * Ensures consistent response format across all endpoints
 */

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Send successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  meta?: SuccessResponse<T>['meta']
): Response<ApiResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): Response<ApiResponse<T>> {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * Send no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string,
  errors?: Record<string, string[]>
): Response<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Paginated response helper
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);
  
  return sendSuccess(res, data, message, HTTP_STATUS.OK, {
    page,
    limit,
    total,
    totalPages,
  });
}

export default {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendError,
  sendPaginated,
};
