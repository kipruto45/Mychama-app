/**
 * Safe Error Handler
 * 
 * Centralized error handling that:
 * - Maps technical errors to user-friendly messages
 * - Logs technical details silently for developers
 * - Never exposes backend/internal details to users
 */

import { ApiError, ErrorCodes, getErrorMessage as getApiErrorMessage, ApiErrorConfig } from './errors';

// ============================================================================
// USER-FRIENDLY ERROR MAPPING
// ============================================================================

const SAFE_USER_MESSAGES: Record<string, string> = {
  // Network & connectivity
  [ErrorCodes.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection and try again.',
  [ErrorCodes.CONNECTION_FAILED]: "We couldn't reach the server right now. Please try again.",
  [ErrorCodes.TIMEOUT]: 'The request is taking longer than expected. Please check your connection and try again.',
  
  // Authentication & session
  [ErrorCodes.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid phone number or password.',
  [ErrorCodes.TOKEN_INVALID]: 'Please sign in again to continue.',
  
  // OTP
  [ErrorCodes.INVALID_OTP]: 'The verification code is not correct. Please check and try again.',
  [ErrorCodes.OTP_EXPIRED]: 'This code has expired. Please request a new one.',
  [ErrorCodes.OTP_DELIVERY_FAILED]: 'We could not send a verification code right now. Please try again.',
  
  // Authorization
  [ErrorCodes.FORBIDDEN]: "You don't have permission to perform this action.",
  [ErrorCodes.PERMISSION_DENIED]: "You don't have permission to perform this action.",
  [ErrorCodes.INSUFFICIENT_ROLE]: "You don't have permission to perform this action.",
  
  // Validation
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'The information provided is invalid.',
  [ErrorCodes.MISSING_FIELD]: 'Please fill in all required fields.',
  
  // Resource
  [ErrorCodes.NOT_FOUND]: "We couldn't find what you're looking for.",
  [ErrorCodes.ALREADY_EXISTS]: 'This already exists.',
  [ErrorCodes.CONFLICT]: 'This action could not be completed.',
  
  // Server errors - generic safe messages
  [ErrorCodes.SERVER_ERROR]: 'Something went wrong on our side. Please try again.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  
  // Rate limiting
  [ErrorCodes.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  
  // Business logic
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: 'This action cannot be completed right now.',
  [ErrorCodes.INSUFFICIENT_FUNDS]: 'Insufficient funds for this transaction.',
  [ErrorCodes.LOAN_NOT_ELIGIBLE]: 'You are not eligible for this at this time.',
  
  // Invite-specific
  [ErrorCodes.INVITE_NOT_FOUND]: 'This invite is no longer available.',
  [ErrorCodes.INVITE_INVALID]: 'This invite is no longer valid.',
  [ErrorCodes.INVITE_EXPIRED]: 'This invite has expired.',
  [ErrorCodes.INVITE_REVOKED]: 'This invite is no longer valid.',
  [ErrorCodes.INVITE_ALREADY_ACCEPTED]: 'This invite has already been used.',
  [ErrorCodes.ALREADY_MEMBER]: 'You are already a member.',
  [ErrorCodes.JOIN_REQUEST_PENDING]: 'Your join request is already waiting for approval.',
  [ErrorCodes.MEMBERSHIP_LIMIT_REACHED]: 'This group has reached its member limit.',
  [ErrorCodes.CHAMA_INACTIVE]: 'This group is not accepting new members right now.',
  
  // Account
  [ErrorCodes.ACCOUNT_EXISTS]: 'An account with these details already exists.',
  [ErrorCodes.ACCOUNT_LOCKED]: 'Too many attempts. Please try again later.',
  
  // Generic fallback
  [ErrorCodes.UNKNOWN]: 'Something went wrong. Please try again.',
};

// Default safe message for unknown errors
const DEFAULT_SAFE_MESSAGE = 'Something went wrong. Please try again.';

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Strips any backend/internal details from an error for safe logging
 */
function sanitizeForLogging(error: unknown): Record<string, unknown> {
  if (!error) return { sanitized: true };
  
  const safeError: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };
  
  if (error instanceof ApiError) {
    safeError.code = error.code;
    safeError.status = error.status;
    // Don't include raw message, details, or stack traces
  } else if (error instanceof Error) {
    safeError.type = error.name;
    safeError.message = error.message;
    // Don't include stack trace
  } else if (typeof error === 'object') {
    safeError.type = 'unknown_error';
  }
  
  return safeError;
}

/**
 * Completely sanitizes an error - removes all internal details
 */
function sanitizeError(error: unknown): Record<string, unknown> {
  if (!error) return {};
  
  if (error instanceof ApiError) {
    return {
      code: error.code,
      status: error.status,
    };
  }
  
  if (error instanceof Error) {
    return {
      type: 'error',
    };
  }
  
  if (typeof error === 'object') {
    return { type: 'error' };
  }
  
  return {};
}

// ============================================================================
// SAFE ERROR GETTER
// ============================================================================

/**
 * Gets a safe, user-friendly error message
 * This is the MAIN function to use throughout the app
 */
export function getSafeErrorMessage(error: unknown): string {
  // If already a safe string, return it
  if (typeof error === 'string' && error.length > 0 && error.length < 200) {
    // Basic check to avoid obviously technical messages
    if (!error.includes('http') && 
        !error.includes('://') && 
        !error.includes('stack') &&
        !error.includes('Stack')) {
      return error;
    }
  }
  
  // Handle ApiError
  if (error instanceof ApiError) {
    const safeMessage = SAFE_USER_MESSAGES[error.code];
    if (safeMessage) {
      return safeMessage;
    }
    return error.message || DEFAULT_SAFE_MESSAGE;
  }
  
  // Handle regular Error
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for network-related errors
    if (message.includes('network') || message.includes('Network')) {
      return SAFE_USER_MESSAGES[ErrorCodes.NETWORK_ERROR];
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return SAFE_USER_MESSAGES[ErrorCodes.TIMEOUT];
    }
    if (message.includes('ECONNREFUSED') || message.includes('connection')) {
      return SAFE_USER_MESSAGES[ErrorCodes.CONNECTION_FAILED];
    }
    
    // Return generic safe message for any other error
    return DEFAULT_SAFE_MESSAGE;
  }
  
  // Handle unknown types
  return DEFAULT_SAFE_MESSAGE;
}

/**
 * Gets the error code from any error type
 */
export function getErrorCode(error: unknown): string | null {
  if (error instanceof ApiError) {
    return error.code;
  }
  return ErrorCodes.UNKNOWN;
}

/**
 * Determines if an error should trigger a session redirect
 */
export function requiresSessionRefresh(error: unknown): boolean {
  if (error instanceof ApiError) {
    return [
      ErrorCodes.UNAUTHORIZED,
      ErrorCodes.SESSION_EXPIRED,
      ErrorCodes.TOKEN_INVALID,
    ].includes(error.code as any);
  }
  return false;
}

/**
 * Determines if an error should show a retry option
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.CONNECTION_FAILED,
      ErrorCodes.TIMEOUT,
      ErrorCodes.SERVER_ERROR,
      ErrorCodes.SERVICE_UNAVAILABLE,
      ErrorCodes.RATE_LIMITED,
    ].includes(error.code as any);
  }
  return true;
}

/**
 * Gets a short error title for UI display
 */
export function getErrorTitle(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ErrorCodes.NETWORK_ERROR:
      case ErrorCodes.CONNECTION_FAILED:
        return 'No connection';
      case ErrorCodes.TIMEOUT:
        return 'Timed out';
      case ErrorCodes.SESSION_EXPIRED:
        return 'Session expired';
      case ErrorCodes.INVALID_CREDENTIALS:
        return 'Invalid details';
      case ErrorCodes.INVALID_OTP:
        return 'Wrong code';
      case ErrorCodes.FORBIDDEN:
        return 'Access denied';
      case ErrorCodes.NOT_FOUND:
        return 'Not found';
      case ErrorCodes.SERVER_ERROR:
        return 'Server issue';
      default:
        return 'Something went wrong';
    }
  }
  return 'Something went wrong';
}

// ============================================================================
// SAFE LOGGING (FOR DEVELOPERS ONLY)
// ============================================================================

/**
 * Logs error details safely for developers (console only)
 * Never exposed to users
 */
export function logErrorSafely(context: string, error: unknown): void {
  if (!__DEV__) {
    return; // Skip in production
  }
  
  const sanitized = sanitizeForLogging(error);
  console.group(`[Error] ${context}`);
  console.log('Details:', sanitized);
  if (error instanceof Error && error.stack) {
    console.log('Stack:', error.stack);
  }
  console.groupEnd();
}

/**
 * Full error logging with backend details (development only)
 */
export function logFullError(context: string, error: unknown, requestDetails?: Record<string, unknown>): void {
  if (!__DEV__) {
    // In production, you would send to a logging service like Sentry
    // For now, we just don't log to console
    return;
  }
  
  console.group(`[Full Error] ${context}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Sanitized:', sanitizeForLogging(error));
  console.log('Request:', requestDetails || 'N/A');
  
  if (error instanceof Error) {
    console.log('Message:', error.message);
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
  }
  console.groupEnd();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  SAFE_USER_MESSAGES,
  DEFAULT_SAFE_MESSAGE,
  sanitizeError,
  sanitizeForLogging,
};