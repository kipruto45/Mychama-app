/**
 * API Response Handler
 * 
 * Parses backend API responses and provides user-friendly feedback.
 * Integrates with toast system for displaying success/error messages.
 */

import { useToast } from '@/components/ui/ToastProvider';
import type { ToastType } from '@/components/ui/Toast';

export interface ApiResponse<T = unknown> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  details?: Record<string, unknown>;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface FeedbackConfig {
  title?: string;
  message?: string;
  type?: ToastType;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
  showToast?: boolean;
  fields?: string[];
}

interface SuccessCode {
  message: string;
  nextAction?: string;
}

interface FailureCode {
  message: string;
  field?: string;
  nextAction?: string;
  retryable?: boolean;
}

const SUCCESS_MESSAGES: Record<string, SuccessCode> = {
  REGISTER_SUCCESS: { message: 'Account created successfully. Welcome!' },
  REGISTER_SUCCESS_OTP_PENDING: { message: 'Account created. Enter the verification code to continue.' },
  LOGIN_SUCCESS: { message: 'Login successful. Welcome back!' },
  OTP_SENT: { message: 'Verification code sent successfully.' },
  OTP_SENT_EMAIL: { message: 'Verification code sent to your email.' },
  OTP_VERIFIED: { message: 'Verification successful!' },
  PASSWORD_RESET_SENT: { message: 'Password reset link sent to your email.' },
  PASSWORD_RESET_SUCCESS: { message: 'Password reset successfully. Sign in with your new password.' },
  PASSWORD_CHANGE_SUCCESS: { message: 'Password changed successfully!' },
  VERIFICATION_SUCCESS: { message: 'Phone number verified successfully!' },
  LOGOUT_SUCCESS: { message: 'Logged out successfully.' },
  CHAMA_CREATE_SUCCESS: { message: 'Chama created successfully!' },
  CHAMA_JOIN_SUCCESS: { message: 'You have joined the chama!' },
  CHAMA_LEFT_SUCCESS: { message: 'You have left the chama.' },
  KYC_SUBMITTED: { message: 'Documents submitted for review.' },
  KYC_APPROVED: { message: 'Identity verified successfully!' },
  CONTRIBUTION_SUCCESS: { message: 'Contribution submitted successfully!' },
  WITHDRAWAL_SUCCESS: { message: 'Withdrawal request submitted!' },
  WALLET_FUNDING_SUCCESS: { message: 'Wallet funded successfully!' },
  LOAN_APPLICATION_SUCCESS: { message: 'Loan application received and under review.' },
  LOAN_APPROVED: { message: 'Your loan has been approved!' },
  PROFILE_UPDATE_SUCCESS: { message: 'Profile updated successfully!' },
  SUCCESS: { message: 'Success!' },
};

const FAILURE_MESSAGES: Record<string, FailureCode> = {
  REGISTER_EMAIL_EXISTS: { message: 'An account with this email already exists.', field: 'email' },
  REGISTER_PHONE_EXISTS: { message: 'An account with this phone number already exists.', field: 'phone' },
  REGISTER_WEAK_PASSWORD: { message: 'Use at least 8 characters with uppercase, lowercase, number, and special character.', field: 'password' },
  REGISTER_PASSWORD_MISMATCH: { message: 'Passwords do not match.', field: 'password_confirm' },
  REGISTER_INVALID_PHONE: { message: 'Enter a valid phone number (e.g., 0722123456).', field: 'phone' },
  REGISTER_INVALID_EMAIL: { message: 'Enter a valid email address.', field: 'email' },
  REGISTER_MISSING_FIELD: { message: 'Please fill in all required fields.' },
  WEAK_PASSWORD: {
    message: 'Use at least 8 characters with uppercase, lowercase, number, and special character.',
    field: 'password',
  },
  PASSWORD_MISMATCH: { message: 'Passwords do not match.', field: 'password_confirm' },
  INVALID_PHONE: { message: 'Enter a valid phone number (e.g., 0722123456).', field: 'phone' },
  INVALID_EMAIL: { message: 'Enter a valid email address.', field: 'email' },
  PHONE_ALREADY_EXISTS: { message: 'An account with this phone number already exists.', field: 'phone' },
  EMAIL_ALREADY_EXISTS: { message: 'An account with this email already exists.', field: 'email' },
  REQUIRED_FIELD_MISSING: { message: 'Please fill in all required fields.' },
  LOGIN_FAILED: { message: 'Invalid phone number or password.', field: 'password' },
  LOGIN_ACCOUNT_LOCKED: { message: 'Too many failed attempts. Please wait 15 minutes.', retryable: true },
  LOGIN_ACCOUNT_INACTIVE: { message: 'Your account has been deactivated. Contact support.' },
  OTP_INVALID: { message: 'The verification code you entered is invalid.', field: 'code' },
  OTP_EXPIRED: { message: 'This code has expired. Request a new one.', field: 'code', nextAction: 'resend_code' },
  OTP_RATE_LIMITED: { message: 'Too many requests. Please wait a moment and try again.', retryable: true },
  OTP_DELIVERY_FAILED: { message: 'We could not send the code right now. Please try again.', retryable: true },
  PASSWORD_RESET_INVALID_TOKEN: { message: 'This reset link is invalid or has expired. Request a new one.', nextAction: 'request_reset' },
  PASSWORD_RESET_WEAK_PASSWORD: { message: 'Use at least 8 characters with uppercase, lowercase, number, and special character.', field: 'new_password' },
  PASSWORD_CHANGE_WRONG_OLD: { message: 'Your current password is incorrect.', field: 'old_password' },
  SESSION_EXPIRED: { message: 'Your session has expired. Please sign in again.', nextAction: 'login' },
  TOKEN_INVALID: { message: 'Please sign in again to continue.', nextAction: 'login' },
  CHAMA_ALREADY_MEMBER: { message: 'You are already a member of this chama.' },
  CHAMA_JOIN_REQUEST_PENDING: { message: 'Your join request is awaiting approval.' },
  CHAMA_NOT_FOUND: { message: 'The chama could not be found.' },
  CHAMA_INACTIVE: { message: 'This chama is not accepting new members.' },
  CHAMA_MEMBERSHIP_FULL: { message: 'This chama has reached its member limit.' },
  CHAMA_INVITE_INVALID: { message: 'This invitation is no longer valid.' },
  CHAMA_INVITE_EXPIRED: { message: 'This invitation has expired.' },
  KYC_REJECTED: { message: 'Your documents were rejected. Please submit clearer documents.' },
  KYC_MISSING_DOCUMENT: { message: 'Please upload all required documents.' },
  KYC_INVALID_DOCUMENT: { message: 'The uploaded document is invalid.' },
  KYC_FILE_TOO_LARGE: { message: 'File is too large. Please upload a smaller image (max 5MB).' },
  KYC_UNSUPPORTED_FILE_TYPE: { message: 'This file type is not supported. Use JPG or PNG.' },
  CONTRIBUTION_INVALID_AMOUNT: { message: 'Enter a valid amount greater than zero.', field: 'amount' },
  WITHDRAWAL_INSUFFICIENT_BALANCE: { message: 'You do not have enough balance.', field: 'amount' },
  LOAN_INELIGIBLE: { message: 'You are not eligible to apply for a loan at this time.' },
  LOAN_ALREADY_APPLIED: { message: 'You already have a pending loan application.' },
  LOAN_AMOUNT_TOO_HIGH: { message: 'The amount exceeds the maximum allowed.', field: 'amount' },
  LOAN_AMOUNT_TOO_LOW: { message: 'The amount is below the minimum allowed.', field: 'amount' },
  LOAN_GUARANTOR_REQUIRED: { message: 'Please select the required guarantors.' },
  LOAN_GUARANTOR_INSUFFICIENT: { message: 'Selected guarantors do not have enough capacity.' },
  PROFILE_EMAIL_TAKEN: { message: 'This email is already in use.', field: 'email' },
  UNAUTHORIZED: { message: 'Please sign in to continue.' },
  FORBIDDEN: { message: 'You do not have permission to perform this action.' },
  NOT_FOUND: { message: 'The requested item could not be found.' },
  CONFLICT: { message: 'This action conflicts with the current state.' },
  RATE_LIMITED: { message: 'Too many requests. Please wait and try again.', retryable: true },
  VALIDATION_ERROR: { message: 'Please check your input and try again.' },
  SERVER_ERROR: { message: 'Something went wrong on our side. Please try again later.', retryable: true },
  UNKNOWN_ERROR: { message: 'An unexpected error occurred. Please try again.', retryable: true },
};

function getResponseCode(response: ApiResponse): string {
  return response.code || (response.success ? 'SUCCESS' : 'VALIDATION_ERROR');
}

export function getSuccessMessage(code: string): SuccessCode | undefined {
  return SUCCESS_MESSAGES[code];
}

export function getFailureMessage(code: string): FailureCode | undefined {
  return FAILURE_MESSAGES[code];
}

export function parseResponse<T = unknown>(response: unknown): ApiResponse<T> {
  if (!response || typeof response !== 'object') {
    return {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    };
  }

  const data = response as Record<string, unknown>;

  return {
    success: data.success === true,
    code: typeof data.code === 'string' ? data.code : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
    data: data.data as T,
    errors: typeof data.errors === 'object' ? (data.errors as Record<string, string[]>) : undefined,
    details: typeof data.details === 'object' ? (data.details as Record<string, unknown>) : undefined,
  };
}

export function useFeedback() {
  const { showToast, showSuccess: showSuccessToast, showError: showErrorToast } = useToast();

  const handleSuccess = (
    response: unknown,
    config?: FeedbackConfig
  ) => {
    const parsed = parseResponse(response);
    const code = getResponseCode(parsed);
    const successInfo = SUCCESS_MESSAGES[code];

    const title = config?.title || (successInfo?.message ? 'Success!' : parsed.message || 'Success!');
    const message = config?.message || successInfo?.message || parsed.message || '';

    if (config?.showToast !== false) {
      if (successInfo?.nextAction) {
        showSuccessToast(title, message);
      } else {
        showSuccessToast(title, message);
      }
    }

    return {
      ...parsed,
      fields: config?.fields || [],
      nextAction: successInfo?.nextAction,
    };
  };

  const handleError = (
    response: unknown,
    config?: FeedbackConfig
  ) => {
    const parsed = parseResponse(response);
    const code = parsed.code || 'UNKNOWN_ERROR';
    const failureInfo = FAILURE_MESSAGES[code];

    const title = config?.title || 'Something went wrong';
    const message = config?.message || failureInfo?.message || parsed.message || 'An unexpected error occurred.';

    if (config?.showToast !== false) {
      showErrorToast(title, message);
    }

    return {
      ...parsed,
      fields: config?.fields || (failureInfo?.field ? [failureInfo.field] : []),
      nextAction: failureInfo?.nextAction,
      retryable: failureInfo?.retryable,
    };
  };

  const showApiResponse = (
    response: unknown,
    config?: FeedbackConfig
  ): boolean => {
    const parsed = parseResponse(response);

    if (parsed.success) {
      handleSuccess(parsed, config);
    } else {
      handleError(parsed, config);
    }

    return parsed.success;
  };

  return {
    handleSuccess,
    handleError,
    showApiResponse,
    parseResponse,
  };
}

export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  if (!errors || !Array.isArray(errors)) {
    return undefined;
  }
  const fieldErrors = errors[field];
  if (!fieldErrors || !Array.isArray(fieldErrors) || fieldErrors.length === 0) {
    return undefined;
  }
  return fieldErrors[0];
}

export function getDefaultFeedback(code: string, isSuccess: boolean): { message: string; retryable?: boolean } {
  if (isSuccess) {
    return SUCCESS_MESSAGES[code] || { message: 'Success!' };
  }
  return FAILURE_MESSAGES[code] || { message: 'An unexpected error occurred.', retryable: true };
}
