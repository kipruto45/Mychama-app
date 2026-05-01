/**
 * API Error Handling
 * 
 * Provides standardized error types and handling for API responses.
 * Ensures consistent error handling across the application.
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiErrorConfig {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, any>;
  retryAfter?: number;
  timestamp?: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: Record<string, any>;
  public readonly retryAfter?: number;
  public readonly timestamp: string;

  constructor(config: ApiErrorConfig) {
    super(config.message);
    this.name = 'ApiError';
    this.code = config.code;
    this.status = config.status ?? 500;
    this.details = config.details || {};
    this.retryAfter = config.retryAfter;
    this.timestamp = config.timestamp || new Date().toISOString();
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// ERROR CODES
// ============================================================================

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  OTP_REQUIRED: 'OTP_REQUIRED',
  OTP_SENT: 'OTP_SENT',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_LOCKED: 'OTP_LOCKED',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',
  OTP_DELIVERY_FAILED: 'OTP_DELIVERY_FAILED',
  PASSWORD_RESET_CODE_SENT: 'PASSWORD_RESET_CODE_SENT',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',

  // Registration specific
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_SUCCESS_OTP_PENDING: 'REGISTER_SUCCESS_OTP_PENDING',
  REGISTER_EMAIL_EXISTS: 'REGISTER_EMAIL_EXISTS',
  REGISTER_PHONE_EXISTS: 'REGISTER_PHONE_EXISTS',
  REGISTER_WEAK_PASSWORD: 'REGISTER_WEAK_PASSWORD',
  REGISTER_PASSWORD_MISMATCH: 'REGISTER_PASSWORD_MISMATCH',
  REGISTER_INVALID_PHONE: 'REGISTER_INVALID_PHONE',
  REGISTER_INVALID_EMAIL: 'REGISTER_INVALID_EMAIL',
  REGISTER_MISSING_FIELD: 'REGISTER_MISSING_FIELD',

  // Backend v2 / normalized validation codes
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  KYC_REQUIRED_FOR_CHAMA_CREATION: 'KYC_REQUIRED_FOR_CHAMA_CREATION',
  MEMBER_CREATE_CHAMA_FORBIDDEN: 'MEMBER_CREATE_CHAMA_FORBIDDEN',
  INVITE_NOT_FOUND: 'INVITE_NOT_FOUND',
  INVITE_INVALID: 'INVITE_INVALID',
  INVITE_EXPIRED: 'INVITE_EXPIRED',
  INVITE_REVOKED: 'INVITE_REVOKED',
  INVITE_WRONG_ACCOUNT: 'INVITE_WRONG_ACCOUNT',
  INVITE_ALREADY_ACCEPTED: 'INVITE_ALREADY_ACCEPTED',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  JOIN_REQUEST_PENDING: 'JOIN_REQUEST_PENDING',
  MEMBERSHIP_LIMIT_REACHED: 'MEMBERSHIP_LIMIT_REACHED',
  CHAMA_INACTIVE: 'CHAMA_INACTIVE',
  CODE_NOT_FOUND: 'CODE_NOT_FOUND',
  
  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Compliance / KYC gates
  KYC_REQUIRED: 'KYC_REQUIRED',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',

  // Billing / subscription gates
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  UPGRADE_REQUIRED: 'UPGRADE_REQUIRED',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  LOAN_NOT_ELIGIBLE: 'LOAN_NOT_ELIGIBLE',
  
  // Loan-specific errors (extended)
  LOAN_PRODUCT_NOT_FOUND: 'LOAN_PRODUCT_NOT_FOUND',
  LOAN_PRODUCT_INACTIVE: 'LOAN_PRODUCT_INACTIVE',
  LOAN_AMOUNT_TOO_HIGH: 'LOAN_AMOUNT_TOO_HIGH',
  LOAN_AMOUNT_TOO_LOW: 'LOAN_AMOUNT_TOO_LOW',
  LOAN_DURATION_INVALID: 'LOAN_DURATION_INVALID',
  LOAN_GUARANTOR_REQUIRED: 'LOAN_GUARANTOR_REQUIRED',
  LOAN_GUARANTOR_INSUFFICIENT: 'LOAN_GUARANTOR_INSUFFICIENT',
  LOAN_GUARANTOR_SELF: 'LOAN_GUARANTOR_SELF',
  LOAN_GUARANTOR_DUPLICATE: 'LOAN_GUARANTOR_DUPLICATE',
  LOAN_DUPLICATE_APPLICATION: 'LOAN_DUPLICATE_APPLICATION',
  LOAN_KYC_REQUIRED: 'LOAN_KYC_REQUIRED',
  LOAN_ALREADY_APPROVED: 'LOAN_ALREADY_APPROVED',
  LOAN_ALREADY_REJECTED: 'LOAN_ALREADY_REJECTED',
  LOAN_ALREADY_PAID: 'LOAN_ALREADY_PAID',
  LOAN_CHAMA_NO_PRODUCTS: 'LOAN_CHAMA_NO_PRODUCTS',
  LOAN_CHAMA_INACTIVE: 'LOAN_CHAMA_INACTIVE',
  LOAN_NETWORK_ERROR: 'LOAN_NETWORK_ERROR',
  LOAN_TIMEOUT: 'LOAN_TIMEOUT',
  LOAN_SUBMISSION_FAILED: 'LOAN_SUBMISSION_FAILED',
  
  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid phone number or password.',
  [ErrorCodes.TOKEN_INVALID]: 'Please sign in again to continue.',
  [ErrorCodes.ACCOUNT_EXISTS]: 'An account with these details already exists.',
  [ErrorCodes.ACCOUNT_LOCKED]: 'Too many attempts. Please try again later.',
  [ErrorCodes.OTP_REQUIRED]: 'Verification is required to continue.',
  [ErrorCodes.OTP_SENT]: 'A verification code has been sent.',
  [ErrorCodes.INVALID_OTP]: 'The verification code is not correct.',
  [ErrorCodes.OTP_EXPIRED]: 'This verification code has expired.',
  [ErrorCodes.OTP_LOCKED]: 'Your account has been temporarily locked after too many incorrect OTP attempts.',
  [ErrorCodes.OTP_MAX_ATTEMPTS]: 'Too many incorrect attempts. Please request a new verification code.',
  [ErrorCodes.OTP_DELIVERY_FAILED]: 'We could not send a verification code right now.',
  [ErrorCodes.KYC_REQUIRED]: 'Complete KYC verification before using financial features.',
  [ErrorCodes.ACCOUNT_FROZEN]: 'Your account has been restricted due to a compliance check.',
  [ErrorCodes.PAYMENT_REQUIRED]: 'An active subscription is required for this feature.',
  [ErrorCodes.UPGRADE_REQUIRED]: 'This feature requires a higher subscription plan.',
  [ErrorCodes.PASSWORD_RESET_CODE_SENT]: 'If the account details are correct, a reset code has been sent.',
  [ErrorCodes.PASSWORD_RESET_SUCCESS]: 'Your password has been reset successfully.',

  // Registration specific
  [ErrorCodes.REGISTER_SUCCESS]: 'Account created successfully. Welcome!',
  [ErrorCodes.REGISTER_SUCCESS_OTP_PENDING]: 'Your account has been created. Verify your phone to continue.',
  [ErrorCodes.REGISTER_EMAIL_EXISTS]: 'An account with this email already exists.',
  [ErrorCodes.REGISTER_PHONE_EXISTS]: 'An account with this phone number already exists.',
  [ErrorCodes.REGISTER_WEAK_PASSWORD]: 'Your password is too weak. Use at least 8 characters with uppercase, lowercase, number, and special character.',
  [ErrorCodes.REGISTER_PASSWORD_MISMATCH]: 'Passwords do not match.',
  [ErrorCodes.REGISTER_INVALID_PHONE]: 'Enter a valid phone number (e.g., 0722123456).',
  [ErrorCodes.REGISTER_INVALID_EMAIL]: 'Enter a valid email address.',
  [ErrorCodes.REGISTER_MISSING_FIELD]: 'Please fill in all required fields.',

  // Backend v2 / normalized validation codes
  [ErrorCodes.WEAK_PASSWORD]:
    'Your password is too weak. Use at least 8 characters with uppercase, lowercase, number, and special character.',
  [ErrorCodes.PASSWORD_MISMATCH]: 'Passwords do not match.',
  [ErrorCodes.INVALID_EMAIL]: 'Enter a valid email address.',
  [ErrorCodes.INVALID_PHONE]: 'Enter a valid phone number (e.g., 0722123456).',
  [ErrorCodes.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [ErrorCodes.PHONE_ALREADY_EXISTS]: 'An account with this phone number already exists.',
  [ErrorCodes.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields.',
  [ErrorCodes.KYC_REQUIRED_FOR_CHAMA_CREATION]: 'Complete and pass KYC verification before creating a chama.',
  [ErrorCodes.MEMBER_CREATE_CHAMA_FORBIDDEN]: 'This account is not allowed to create a chama.',
  [ErrorCodes.INVITE_NOT_FOUND]: 'This invite is no longer available.',
  [ErrorCodes.INVITE_INVALID]: 'This invite is no longer valid.',
  [ErrorCodes.INVITE_EXPIRED]: 'This invite has expired.',
  [ErrorCodes.INVITE_REVOKED]: 'This invite is no longer valid.',
  [ErrorCodes.INVITE_WRONG_ACCOUNT]: 'This invite was sent to a different account.',
  [ErrorCodes.INVITE_ALREADY_ACCEPTED]: 'This invite has already been used.',
  [ErrorCodes.ALREADY_MEMBER]: 'You are already a member of this chama.',
  [ErrorCodes.JOIN_REQUEST_PENDING]: 'Your join request is already waiting for approval.',
  [ErrorCodes.MEMBERSHIP_LIMIT_REACHED]: 'This chama has reached its member limit right now.',
  [ErrorCodes.CHAMA_INACTIVE]: 'This chama is not accepting new members right now.',
  [ErrorCodes.CODE_NOT_FOUND]: 'This invite code could not be found.',
  
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCodes.PERMISSION_DENIED]: 'Permission denied. Contact your administrator.',
  [ErrorCodes.INSUFFICIENT_ROLE]: 'Your role does not allow this action.',
  
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'The information provided is invalid.',
  [ErrorCodes.MISSING_FIELD]: 'Please fill in all required fields.',
  
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCodes.CONFLICT]: 'A conflict occurred with the current state.',
  
  [ErrorCodes.SERVER_ERROR]: 'Something went wrong. Please try again later.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',

  // Loan-specific errors
  LOAN_PRODUCT_NOT_FOUND: 'This loan product is no longer available.',
  LOAN_PRODUCT_INACTIVE: 'This loan product is not currently active.',
  LOAN_NOT_ELIGIBLE: 'You do not meet the requirements for this loan.',
  LOAN_AMOUNT_TOO_HIGH: 'The requested amount exceeds the maximum allowed.',
  LOAN_AMOUNT_TOO_LOW: 'The requested amount is below the minimum allowed.',
  LOAN_DURATION_INVALID: 'The repayment term is not valid for this product.',
  LOAN_GUARANTOR_REQUIRED: 'Please select the required guarantors.',
  LOAN_GUARANTOR_INSUFFICIENT: 'Selected guarantors do not have enough capacity.',
  LOAN_GUARANTOR_SELF: 'You cannot be your own guarantor.',
  LOAN_GUARANTOR_DUPLICATE: 'A guarantor has been selected more than once.',
  LOAN_DUPLICATE_APPLICATION: 'You already have a pending application for this loan.',
  LOAN_KYC_REQUIRED: 'Complete KYC verification before applying for a loan.',
  LOAN_ALREADY_APPROVED: 'This loan has already been approved.',
  LOAN_ALREADY_REJECTED: 'This loan application has been rejected.',
  LOAN_ALREADY_PAID: 'This loan has already been fully repaid.',
  LOAN_CHAMA_NO_PRODUCTS: 'This chama does not have any loan products available right now.',
  LOAN_CHAMA_INACTIVE: 'This chama is not accepting loan applications right now.',
  LOAN_NETWORK_ERROR: 'Check your internet connection and try again.',
  LOAN_TIMEOUT: 'The request is taking longer than expected. Please try again.',
  LOAN_SUBMISSION_FAILED: 'We could not submit your loan request. Please try again.',
  TIMEOUT: 'The request took too long. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  CONNECTION_FAILED: 'Unable to connect. Check your internet connection and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  BUSINESS_RULE_VIOLATION: 'This action violates a business rule.',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

function normalizeBackendCode(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }
  return String(value).trim().toUpperCase();
}

function extractRequestContext(error: any): Record<string, any> | undefined {
  const baseURL = error?.config?.baseURL;
  const url = error?.config?.url;
  const method = error?.config?.method;

  if (!baseURL && !url && !method) {
    return undefined;
  }

  const target = `${baseURL || ''}${url || ''}`;
  return {
    request: {
      method: typeof method === 'string' ? method.toUpperCase() : undefined,
      baseURL,
      url,
      target,
    },
  };
}

// ============================================================================
// ERROR FACTORY
// ============================================================================

export function createApiError(
  code: ErrorCode,
  message?: string,
  status?: number,
  details?: Record<string, any>
): ApiError {
  return new ApiError({
    code,
    message: message || ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCodes.UNKNOWN],
    status,
    details,
  });
}

// ============================================================================
// ERROR CONVERSION
// ============================================================================

export function toApiError(error: any): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Axios error with response
  if (error.response) {
    const { status, data } = error.response;
    const backendMessage = data?.message || data?.detail || data?.error;
    const backendCode = normalizeBackendCode(
      data?.code ||
        data?.error_code ||
        data?.errors?.code ||
        data?.errors?.error_code ||
        data?.detail?.code
    );
    const knownMessage =
      backendCode && backendCode in ERROR_MESSAGES
        ? ERROR_MESSAGES[backendCode]
        : undefined;
    const details: Record<string, any> = {
      ...(data?.data ? { data: data.data } : {}),
      ...(data?.errors ? { errors: data.errors } : {}),
      ...(data?.details && !data?.errors ? { errors: data.details } : {}),
      ...(backendMessage ? { raw_message: backendMessage } : {}),
    };

    // DRF default validation errors sometimes arrive as a plain object:
    // { field: ["msg"] } with no { code, message, errors } wrapper.
    if (
      (status === 400 || status === 422) &&
      (!details.errors || typeof details.errors !== 'object') &&
      data &&
      typeof data === 'object' &&
      !('success' in data) &&
      !('code' in data) &&
      !('message' in data) &&
      !('data' in data) &&
      !('errors' in data)
    ) {
      details.errors = data;
    }

    const safeBackendMessage =
      typeof backendMessage === 'string' && backendMessage.trim().length > 0
        ? backendMessage.trim()
        : undefined;
    const resolvedMessage = knownMessage ?? safeBackendMessage;

    switch (status) {
      case 402: {
        const billingPayload =
          data?.detail && typeof data.detail === 'object' ? data.detail : data;
        const billingError = String(billingPayload?.error || '').toLowerCase();
        const billingMessage =
          typeof billingPayload?.message === 'string' ? billingPayload.message : resolvedMessage;

        return createApiError(
          billingError === 'upgrade_required' ? ErrorCodes.UPGRADE_REQUIRED : ErrorCodes.PAYMENT_REQUIRED,
          billingMessage,
          status,
          {
            ...details,
            billing: billingPayload,
          }
        );
      }
      case 400:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.VALIDATION_ERROR,
          resolvedMessage,
          status,
          details
        );
      
      case 401:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.SESSION_EXPIRED,
          resolvedMessage,
          status,
          details
        );
      
      case 403:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.FORBIDDEN,
          resolvedMessage,
          status,
          details
        );
      
      case 404:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.NOT_FOUND,
          resolvedMessage,
          status,
          details
        );
      
      case 409:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.CONFLICT,
          resolvedMessage,
          status,
          details
        );
      
      case 422:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.VALIDATION_ERROR,
          resolvedMessage,
          status,
          details
        );
      
      case 429:
        const retryAfter = error.response.headers?.['retry-after'];
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.RATE_LIMITED,
          resolvedMessage,
          status,
          {
            ...details,
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
          }
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.SERVER_ERROR,
          resolvedMessage,
          status,
          details
        );
      
      default:
        return createApiError(
          (backendCode as ErrorCode) || ErrorCodes.UNKNOWN,
          resolvedMessage,
          status,
          details
        );
    }
  }

  // Network error
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return createApiError(
      ErrorCodes.TIMEOUT,
      undefined,
      0,
      extractRequestContext(error)
    );
  }

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return createApiError(
      ErrorCodes.CONNECTION_FAILED,
      undefined,
      0,
      extractRequestContext(error)
    );
  }

  // Generic error
  return createApiError(
    ErrorCodes.UNKNOWN,
    error.message || 'An unexpected error occurred'
  );
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function isAuthError(error: any): boolean {
  return error instanceof ApiError && 
    [ErrorCodes.UNAUTHORIZED, ErrorCodes.SESSION_EXPIRED, ErrorCodes.TOKEN_INVALID].includes(error.code as any);
}

export function isForbiddenError(error: any): boolean {
  return error instanceof ApiError && 
    [ErrorCodes.FORBIDDEN, ErrorCodes.PERMISSION_DENIED, ErrorCodes.INSUFFICIENT_ROLE].includes(error.code as any);
}

export function isValidationError(error: any): boolean {
  return error instanceof ApiError && 
    [ErrorCodes.VALIDATION_ERROR, ErrorCodes.INVALID_INPUT, ErrorCodes.MISSING_FIELD].includes(error.code as any);
}

export function isNetworkError(error: any): boolean {
  return error instanceof ApiError && 
    [ErrorCodes.NETWORK_ERROR, ErrorCodes.CONNECTION_FAILED, ErrorCodes.TIMEOUT].includes(error.code as any);
}

export function isRateLimited(error: any): boolean {
  return error instanceof ApiError && error.code === ErrorCodes.RATE_LIMITED;
}

export function getErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ErrorCodes.UNKNOWN];
}

export function getValidationErrors(error: any): Record<string, string[]> {
  if (error instanceof ApiError && error.details) {
    const nested = (error.details as any).errors;
    if (nested && typeof nested === 'object') {
      return nested as Record<string, string[]>;
    }
    return error.details as Record<string, string[]>;
  }
  return {};
}
