/**
 * API Error Parser
 * 
 * Utilities for parsing and handling API validation errors.
 * Provides field-level error mapping for forms.
 */

import { ApiError, toApiError, getValidationErrors } from '@/api/errors';

export interface FieldError {
  field: string;
  message: string;
}

export interface ParsedApiError {
  isValidationError: boolean;
  code?: string;
  generalMessage: string;
  fieldErrors: FieldError[];
  rawError: unknown;
}

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  identifier: 'Phone number or email',
  phone: 'Phone number',
  phone_number: 'Phone number',
  full_name: 'Full name',
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email address',
  password: 'Password',
  password_confirm: 'Confirm password',
  new_password: 'New password',
  new_password_confirm: 'Confirm new password',
  otp_delivery_method: 'Delivery method',
  delivery_method: 'Delivery method',
  purpose: 'Verification type',
  code: 'Verification code',
  amount: 'Amount',
};

const GENERIC_MESSAGES: Record<string, string> = {
  duplicate: 'This phone number is already registered.',
  phone_taken: 'An account with this phone number already exists.',
  email_taken: 'An account with this email already exists.',
  password_mismatch: 'Passwords do not match.',
  password_too_short: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
  password_weak: 'Your password is too weak. Use at least 8 characters with uppercase, lowercase, number, and special character.',
  invalid_phone: 'Enter a valid phone number (e.g., 0722123456).',
  invalid_identifier: 'Please enter a valid phone number or email address.',
  invalid_delivery_method: 'Please choose a valid delivery method and try again.',
  invalid_purpose: 'Please restart verification and try again.',
  required_field: 'Please fill in all required fields.',
};

function normalizeFieldName(field: string): string {
  return field.toLowerCase().replace(/__|_-/g, '_');
}

function getFieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectErrorType(message: string, field: string): string {
  const combined = `${field}:${message}`.toLowerCase();
  
  if (field === 'phone' && (combined.includes('exists') || combined.includes('taken') || combined.includes('duplicate'))) {
    return 'duplicate';
  }
  if (field === 'email' && (combined.includes('exists') || combined.includes('taken') || combined.includes('duplicate'))) {
    return 'email_taken';
  }
  if (field.includes('password') && combined.includes('match')) {
    return 'password_mismatch';
  }
  if (field.includes('password') && combined.includes('short') && combined.includes('8')) {
    return 'password_too_short';
  }
  if (
    field.includes('password') &&
    (combined.includes('weak') ||
      combined.includes('entropy') ||
      combined.includes('breach') ||
      combined.includes('pwned') ||
      combined.includes('common password'))
  ) {
    return 'password_weak';
  }
  if (field === 'phone' && combined.includes('invalid')) {
    return 'invalid_phone';
  }
  if (field === 'identifier' && (combined.includes('email') || combined.includes('phone') || combined.includes('identifier'))) {
    return 'invalid_identifier';
  }
  if (field === 'delivery_method' || field === 'otp_delivery_method') {
    return 'invalid_delivery_method';
  }
  if (field === 'purpose') {
    return 'invalid_purpose';
  }
  if (combined.includes('required') || combined.includes('blank')) {
    return 'required_field';
  }
  
  return 'unknown';
}

export function parseApiValidationError(error: unknown): ParsedApiError {
  const apiError = toApiError(error);
  const validationErrors = getValidationErrors(error);
  
  const fieldErrors: FieldError[] = [];
  
  if (validationErrors && typeof validationErrors === 'object') {
    for (const [field, messages] of Object.entries(validationErrors)) {
      const normalizedMessages = Array.isArray(messages)
        ? messages
        : typeof messages === 'string'
        ? [messages]
        : messages
        ? [String(messages)]
        : [];

      if (normalizedMessages.length > 0) {
        const first = String(normalizedMessages[0]);
        const errorType = detectErrorType(first, field);
        const message = GENERIC_MESSAGES[errorType] || first;
        
        fieldErrors.push({
          field: normalizeFieldName(field),
          message,
        });
      }
    }
  }
  
  const isValidationError = fieldErrors.length > 0 || 
    apiError.code === 'VALIDATION_ERROR' || 
    apiError.status === 400 ||
    apiError.status === 422;
  
  let generalMessage: string;
  if (fieldErrors.length === 1 && fieldErrors[0].message) {
    generalMessage = fieldErrors[0].message;
  } else if (fieldErrors.length > 1) {
    generalMessage = 'Please check the form for errors and try again.';
  } else {
    generalMessage = apiError.message;
  }
  
  if (__DEV__ && (isValidationError || apiError.status === 400 || apiError.status === 422)) {
    console.group('[API Error] Validation Error Parsed');
    console.log('Status:', apiError.status);
    console.log('Code:', apiError.code);
    console.log('Message:', apiError.message);
    console.log('Field Errors:', fieldErrors);
    console.log('Raw Error:', error);
    console.groupEnd();
  }
  
  return {
    isValidationError,
    code: apiError.code,
    generalMessage,
    fieldErrors,
    rawError: error,
  };
}

export interface ParsedFormError<TField extends string = string> {
  code?: string;
  formError: string | null;
  fieldErrors: Partial<Record<TField, string>>;
  raw: ParsedApiError;
}

export function parseApiFormError<TField extends string = string>(
  error: unknown,
  opts?: {
    fieldMap?: Record<string, TField>;
    fallbackFormError?: string;
  }
): ParsedFormError<TField> {
  const raw = parseApiValidationError(error);
  const mapped: Partial<Record<TField, string>> = {};

  for (const item of raw.fieldErrors) {
    const target = opts?.fieldMap?.[item.field] ?? (item.field as TField);
    if (!mapped[target]) {
      mapped[target] = item.message;
    }
  }

  const formError =
    raw.fieldErrors.length > 1
      ? 'Please correct the highlighted fields and try again.'
      : raw.fieldErrors.length === 0
      ? raw.generalMessage || opts?.fallbackFormError || null
      : null;

  return {
    code: raw.code,
    formError,
    fieldErrors: mapped,
    raw,
  };
}

export function mapFieldErrorsToForm<FormData extends Record<string, string>>(
  fieldErrors: FieldError[],
  formData: FormData
): Partial<Record<keyof FormData, string>> {
  const formErrors: Partial<Record<keyof FormData, string>> = {};
  
  for (const { field, message } of fieldErrors) {
    (formErrors as Record<string, string>)[field] = message;
  }
  
  return formErrors;
}

export function getFieldErrorMessage(
  field: string,
  fieldErrors: FieldError[]
): string | undefined {
  const normalized = normalizeFieldName(field);
  const found = fieldErrors.find((e) => normalizeFieldName(e.field) === normalized);
  return found?.message;
}

export function formatFieldErrorForDisplay(error: FieldError): string {
  const displayName = getFieldDisplayName(error.field);
  const errorType = detectErrorType(error.message, error.field);
  const genericMessage = GENERIC_MESSAGES[errorType];
  
  if (genericMessage) {
    return genericMessage;
  }
  
  return `${displayName}: ${error.message}`;
}

export function createFallbackMessage(error: unknown): string {
  const apiError = toApiError(error);
  
  if (apiError.status >= 500) {
    return 'Something went wrong. Please try again later.';
  }
  
  if (apiError.status === 0) {
    return 'Network error. Check your internet connection.';
  }
  
  if (apiError.status === 400 || apiError.status === 422) {
    const parsed = parseApiValidationError(error);
    if (parsed.generalMessage) {
      return parsed.generalMessage;
    }
  }
  
  return apiError.message || 'An unexpected error occurred.';
}
