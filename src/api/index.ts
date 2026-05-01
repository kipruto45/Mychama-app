/**
 * API Module
 * 
 * Central export point for all API-related functionality.
 */

// Client
export { apiClient } from './client';
export type { TokenResponse } from './client';

// Errors
export {
  ApiError,
  ErrorCodes,
  createApiError,
  toApiError,
  isAuthError,
  isForbiddenError,
  isValidationError,
  isNetworkError,
  isRateLimited,
  getErrorMessage,
  getValidationErrors,
} from './errors';
export type { ApiErrorConfig, ErrorCode } from './errors';

// Safe Error Handler
export {
  getSafeErrorMessage,
  getErrorCode,
  requiresSessionRefresh,
  isRetryableError,
  getErrorTitle,
  logErrorSafely,
  logFullError,
  SAFE_USER_MESSAGES,
  DEFAULT_SAFE_MESSAGE,
  sanitizeError,
  sanitizeForLogging,
} from './safeErrorHandler';
