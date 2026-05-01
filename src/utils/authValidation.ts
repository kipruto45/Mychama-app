/**
 * Authentication Validation Utilities
 * 
 * Provides comprehensive input validation for authentication flows
 * including phone number, password strength, and OTP validation.
 */

import { z } from 'zod';

// ============================================================================
// PHONE NUMBER VALIDATION
// ============================================================================

/**
 * Kenyan phone number regex patterns
 * Supports: +254XXXXXXXXX, 254XXXXXXXXX, 0XXXXXXXXX, XXXXXXXXX
 */
const KENYAN_PHONE_REGEX = /^(\+?254|0)?[17]\d{8}$/;

/**
 * Validate and normalize Kenyan phone number
 */
export function validatePhoneNumber(phone: string): { valid: boolean; normalized?: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check if it matches Kenyan phone pattern
  if (!KENYAN_PHONE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format. Use +254XXXXXXXXX or 0XXXXXXXXX' };
  }

  // Normalize to +254 format
  let normalized = cleaned;
  if (normalized.startsWith('0')) {
    normalized = '+254' + normalized.substring(1);
  } else if (normalized.startsWith('254')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+254')) {
    normalized = '+254' + normalized;
  }

  return { valid: true, normalized };
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-4
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  feedback: string[];
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasMinLength) feedback.push('Password must be at least 8 characters');
  if (!hasUppercase) feedback.push('Add at least one uppercase letter');
  if (!hasLowercase) feedback.push('Add at least one lowercase letter');
  if (!hasNumber) feedback.push('Add at least one number');
  if (!hasSpecialChar) feedback.push('Add at least one special character');

  // Calculate score
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;
  if (password.length >= 12) score++;

  // Determine label
  let label: PasswordStrength['label'];
  if (score <= 1) label = 'weak';
  else if (score === 2) label = 'fair';
  else if (score === 3) label = 'good';
  else if (score === 4) label = 'strong';
  else label = 'very_strong';

  return {
    score: Math.min(score, 4),
    label,
    feedback,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// OTP VALIDATION
// ============================================================================

/**
 * Validate OTP code format
 */
export function validateOTPCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'OTP code is required' };
  }

  const cleaned = code.trim();
  
  if (!/^\d{6}$/.test(cleaned)) {
    return { valid: false, error: 'OTP must be exactly 6 digits' };
  }

  return { valid: true };
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .refine((phone) => validatePhoneNumber(phone).valid, {
    message: 'Invalid phone number format',
  });

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  });

export const otpSchema = z.string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

export const emailSchema = z.string()
  .email('Invalid email format')
  .optional()
  .or(z.literal(''));

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  phone: phoneSchema,
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: passwordSchema,
  email: emailSchema,
  referral_code: z.string().optional(),
});

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  delivery_method: z.enum(['sms', 'email', 'both']).optional(),
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

export const passwordResetRequestSchema = z.object({
  phone: phoneSchema,
});

export const passwordResetConfirmSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
  new_password: passwordSchema,
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

/**
 * Check if action is rate limited
 */
export function isRateLimited(
  state: RateLimitState,
  maxAttempts: number = 5,
  lockoutDurationMs: number = 15 * 60 * 1000 // 15 minutes
): { limited: boolean; remainingTime?: number } {
  const now = Date.now();

  // Check if currently locked
  if (state.lockedUntil && now < state.lockedUntil) {
    return {
      limited: true,
      remainingTime: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  // Reset if lockout period has passed
  if (state.lockedUntil && now >= state.lockedUntil) {
    return { limited: false };
  }

  // Check if max attempts exceeded
  if (state.attempts >= maxAttempts) {
    return {
      limited: true,
      remainingTime: Math.ceil(lockoutDurationMs / 1000),
    };
  }

  return { limited: false };
}

/**
 * Update rate limit state after attempt
 */
export function updateRateLimitState(
  state: RateLimitState,
  success: boolean,
  maxAttempts: number = 5,
  lockoutDurationMs: number = 15 * 60 * 1000
): RateLimitState {
  const now = Date.now();

  if (success) {
    // Reset on successful attempt
    return {
      attempts: 0,
      lastAttempt: now,
      lockedUntil: null,
    };
  }

  // Increment attempts
  const newAttempts = state.attempts + 1;
  const shouldLock = newAttempts >= maxAttempts;

  return {
    attempts: newAttempts,
    lastAttempt: now,
    lockedUntil: shouldLock ? now + lockoutDurationMs : null,
  };
}

// ============================================================================
// SECURITY NOTIFICATIONS
// ============================================================================

export type SecurityNotificationType =
  | 'login_success'
  | 'login_failed'
  | 'account_locked'
  | 'password_changed'
  | 'otp_sent'
  | 'otp_verified'
  | 'suspicious_activity'
  | 'new_device'
  | 'session_expired';

export interface SecurityNotification {
  type: SecurityNotificationType;
  title: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create security notification
 */
export function createSecurityNotification(
  type: SecurityNotificationType,
  metadata?: Record<string, unknown>
): SecurityNotification {
  const notifications: Record<SecurityNotificationType, { title: string; message: string }> = {
    login_success: {
      title: 'Login Successful',
      message: 'You have successfully logged in to your account.',
    },
    login_failed: {
      title: 'Login Failed',
      message: 'Failed login attempt detected. Please verify your credentials.',
    },
    account_locked: {
      title: 'Account Locked',
      message: 'Your account has been temporarily locked due to multiple failed login attempts.',
    },
    password_changed: {
      title: 'Password Changed',
      message: 'Your password has been successfully changed.',
    },
    otp_sent: {
      title: 'OTP Sent',
      message: 'A verification code has been sent to your phone.',
    },
    otp_verified: {
      title: 'OTP Verified',
      message: 'Your phone number has been successfully verified.',
    },
    suspicious_activity: {
      title: 'Suspicious Activity Detected',
      message: 'Unusual activity detected on your account. Please verify your identity.',
    },
    new_device: {
      title: 'New Device Login',
      message: 'A login was detected from a new device.',
    },
    session_expired: {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
    },
  };

  const notification = notifications[type];

  return {
    type,
    title: notification.title,
    message: notification.message,
    timestamp: Date.now(),
    metadata,
  };
}
