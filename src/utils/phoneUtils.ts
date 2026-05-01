/**
 * Phone Utilities
 * 
 * Phone number normalization and validation utilities for Kenyan phone numbers.
 * Matches backend normalize_kenyan_phone() logic for consistent E.164 formatting.
 */

const KENYAN_PHONE_REGEX = /^[+]?((7[0-9]{8})|(1[0-9]{8}))$/;
const KENYAN_MOBILE_PREFIXES = ['7', '1'];

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string | null;
  error: string | null;
}

export function normalizeKenyanPhone(phoneNumber: string): string {
  /**
   * Normalize Kenyan phone numbers to E.164 format.
   * 
   * Accepted examples:
   * - 0712345678
   * - 712345678
   * - 254712345678
   * - +254712345678
   * - 0112345678
   * - +254112345678
   * 
   * Returns +2547XXXXXXXX or +2541XXXXXXXX format
   * 
   * @throws {Error} If phone number cannot be normalized
   */
  if (!phoneNumber) {
    throw new Error('Phone number is required.');
  }

  const value = phoneNumber.trim().replace(/[^\d+]/g, '');

  let digits: string;
  if (value.startsWith('+')) {
    digits = value.substring(1);
  } else {
    digits = value;
  }

  let normalized: string;
  if (digits.startsWith('0') && digits.length === 10 && KENYAN_MOBILE_PREFIXES.includes(digits[1])) {
    normalized = `+254${digits.substring(1)}`;
  } else if (digits.length === 9 && KENYAN_MOBILE_PREFIXES.includes(digits[0])) {
    normalized = `+254${digits}`;
  } else if (digits.length === 12 && digits.startsWith('254') && KENYAN_MOBILE_PREFIXES.includes(digits[3])) {
    normalized = `+${digits}`;
  } else {
    throw new Error('Enter a valid Kenyan phone number in +2547XXXXXXXX or +2541XXXXXXXX format.');
  }

  if (normalized.length !== 13) {
    throw new Error('Enter a valid Kenyan phone number in +2547XXXXXXXX or +2541XXXXXXXX format.');
  }

  return normalized;
}

export function validateKenyanPhone(phoneNumber: string): PhoneValidationResult {
  /**
   * Validate a Kenyan phone number and return structured result.
   */
  try {
    const normalized = normalizeKenyanPhone(phoneNumber);
    return {
      isValid: true,
      normalized,
      error: null,
    };
  } catch (err) {
    return {
      isValid: false,
      normalized: null,
      error: err instanceof Error ? err.message : 'Invalid phone number',
    };
  }
}

export function formatPhoneDisplay(phoneNumber: string): string {
  /**
   * Format phone number for display (e.g., +254 712 345 678)
   */
  try {
    const normalized = normalizeKenyanPhone(phoneNumber);
    const digits = normalized.substring(1);
    return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } catch {
    return phoneNumber;
  }
}

export function isValidKenyanMobile(phoneNumber: string): boolean {
  /**
   * Quick check if a phone number is a valid Kenyan mobile number
   */
  const result = validateKenyanPhone(phoneNumber);
  return result.isValid;
}

export function maskPhoneNumber(phoneNumber: string): string {
  /**
   * Mask phone number for display (e.g., +254 712 *** 678)
   */
  try {
    const normalized = normalizeKenyanPhone(phoneNumber);
    const digits = normalized.substring(1);
    const visible = digits.slice(-3);
    return `+254 *** *** ${visible}`;
  } catch {
    return '*** *** ***';
  }
}