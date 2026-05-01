import { ApiError, ErrorCodes, toApiError } from '@/api/errors';
import { getSafeErrorMessage, logErrorSafely } from '@/api/safeErrorHandler';

export interface UserMessage {
  title: string;
  message: string;
}

export type UserMessageContext =
  | 'auth.login'
  | 'auth.register'
  | 'auth.otp.request'
  | 'auth.otp.verify'
  | 'auth.otp.resend'
  | 'auth.passwordReset.request'
  | 'auth.passwordReset.confirm'
  | 'kyc.details'
  | 'kyc.location'
  | 'kyc.submit'
  | 'kyc.resubmit'
  | 'kyc.upload.id_front'
  | 'kyc.upload.id_back'
  | 'kyc.upload.selfie'
  | 'kyc.upload.proof'
  | 'invite.send'
  | 'invite.preview'
  | 'invite.validate'
  | 'invite.accept'
  | 'payment.generic'
  | 'generic';

const DEFAULT_MESSAGES: Record<UserMessageContext, UserMessage> = {
  'auth.login': {
    title: 'Sign in failed',
    message: 'Check your phone number and password, then try again.',
  },
  'auth.register': {
    title: "Couldn't create your account",
    message: 'Please check your details and try again.',
  },
  'auth.otp.request': {
    title: "Couldn't send the code",
    message: 'Please try again in a moment.',
  },
  'auth.otp.verify': {
    title: 'Code not accepted',
    message: 'Check the code and try again.',
  },
  'auth.otp.resend': {
    title: "Couldn't resend the code",
    message: 'Please try again in a moment.',
  },
  'auth.passwordReset.request': {
    title: "Couldn't send reset instructions",
    message: 'Please try again in a moment.',
  },
  'auth.passwordReset.confirm': {
    title: "Couldn't reset your password",
    message: 'Check the code and try again.',
  },
  'kyc.details': {
    title: "Couldn't save KYC details",
    message: 'Please review your information and try again.',
  },
  'kyc.location': {
    title: "Couldn't save location",
    message: 'Please try again, or continue without sharing location.',
  },
  'kyc.submit': {
    title: 'Submission failed',
    message: 'Please try again in a moment.',
  },
  'kyc.resubmit': {
    title: 'Resubmission failed',
    message: 'Please try again in a moment.',
  },
  'kyc.upload.id_front': {
    title: 'Upload failed',
    message: 'Please retake the front of your ID and try again.',
  },
  'kyc.upload.id_back': {
    title: 'Upload failed',
    message: 'Please retake the back of your ID and try again.',
  },
  'kyc.upload.selfie': {
    title: 'Selfie upload failed',
    message: 'Please try again and make sure your face is clearly visible.',
  },
  'kyc.upload.proof': {
    title: 'Upload failed',
    message: 'Please try again with a clear photo of your document.',
  },
  'invite.send': {
    title: 'Invite not sent',
    message: 'Please check the invite details and try again.',
  },
  'invite.preview': {
    title: 'Invite unavailable',
    message: 'This invite could not be opened. Ask for a new invite or join code.',
  },
  'invite.validate': {
    title: 'Code not valid',
    message: 'This code could not be used. Check it and try again.',
  },
  'invite.accept': {
    title: 'Invite could not be completed',
    message: 'Please try again or ask for a new invite.',
  },
  'payment.generic': {
    title: 'Payment update unavailable',
    message: 'Please try again in a moment.',
  },
  generic: {
    title: 'Something went wrong',
    message: 'Please try again.',
  },
};

const CONTEXT_CODE_MESSAGES: Partial<
  Record<UserMessageContext, Partial<Record<string, UserMessage>>>
> = {
  'auth.login': {
    [ErrorCodes.INVALID_CREDENTIALS]: {
      title: 'Sign in failed',
      message: 'Check your phone number and password, then try again.',
    },
    [ErrorCodes.SESSION_EXPIRED]: {
      title: 'Sign in failed',
      message: 'Your session has expired. Please sign in again.',
    },
    ACCOUNT_LOCKED: {
      title: 'Too many attempts',
      message: 'Please wait a little while, then try signing in again.',
    },
    [ErrorCodes.NETWORK_ERROR]: {
      title: 'No internet connection',
      message: 'Check your internet connection and try again.',
    },
    [ErrorCodes.CONNECTION_FAILED]: {
      title: 'Unable to connect',
      message: 'Check your internet connection and try again.',
    },
  },
  'auth.register': {
    [ErrorCodes.WEAK_PASSWORD]: {
      title: 'Weak password',
      message:
        'Use at least 8 characters, including uppercase, lowercase, a number, and a special character.',
    },
    [ErrorCodes.PASSWORD_MISMATCH]: {
      title: 'Passwords do not match',
      message: 'Please confirm the same password and try again.',
    },
    [ErrorCodes.PHONE_ALREADY_EXISTS]: {
      title: 'Phone already in use',
      message: 'Try signing in or reset your password.',
    },
    [ErrorCodes.EMAIL_ALREADY_EXISTS]: {
      title: 'Email already in use',
      message: 'Use another email address or sign in to your account.',
    },
    [ErrorCodes.INVALID_PHONE]: {
      title: 'Invalid phone number',
      message: 'Enter a valid Kenyan phone number.',
    },
    [ErrorCodes.INVALID_EMAIL]: {
      title: 'Invalid email address',
      message: 'Enter a valid email address.',
    },
    [ErrorCodes.REQUIRED_FIELD_MISSING]: {
      title: 'Missing details',
      message: 'Please fill in all required fields and try again.',
    },
    ACCOUNT_EXISTS: {
      title: 'Account already exists',
      message: 'Try signing in or reset your password.',
    },
    PHONE_ALREADY_REGISTERED: {
      title: 'Account already exists',
      message: 'Try signing in or reset your password.',
    },
    EMAIL_ALREADY_REGISTERED: {
      title: 'Email already in use',
      message: 'Use another email address or sign in to your account.',
    },
    [ErrorCodes.VALIDATION_ERROR]: {
      title: "Couldn't create your account",
      message: 'Please review your details and try again.',
    },
    [ErrorCodes.TIMEOUT]: {
      title: 'Registration is taking longer than expected',
      message: 'Please wait a moment and try again.',
    },
    [ErrorCodes.NETWORK_ERROR]: {
      title: 'Unable to connect',
      message: 'Check your internet connection and try again.',
    },
    [ErrorCodes.CONNECTION_FAILED]: {
      title: 'Unable to connect',
      message: 'Check your internet connection and try again.',
    },
    OTP_DELIVERY_FAILED: {
      title: "Couldn't send the verification code",
      message: 'Please try creating your account again in a moment.',
    },
    ACCOUNT_CREATED_BUT_OTP_FAILED: {
      title: 'Account created',
      message: 'We could not send the verification code. Please try again.',
    },
    REGISTER_SUCCESS_OTP_FAILED: {
      title: 'Account created',
      message: 'We could not send the verification code. Please try again.',
    },
  },
  'kyc.location': {
    INVALID_LOCATION_PAYLOAD: {
      title: "Couldn't save location",
      message: 'Please enable location access and try again, or continue without sharing location.',
    },
  },
  'kyc.submit': {
    INVALID_LOCATION_PAYLOAD: {
      title: "Couldn't save location",
      message: 'Please enable location access and try again, or continue without sharing location.',
    },
  },
  'auth.otp.request': {
    OTP_REQUIRED: {
      title: 'Verification code sent',
      message: "We've sent a verification code. Enter it to continue.",
    },
    OTP_DELIVERY_FAILED: {
      title: "Couldn't send the code",
      message: 'Please try again in a moment.',
    },
    OTP_SEND_FAILED: {
      title: "Couldn't send the code",
      message: 'We could not send the verification code. Please try again.',
    },
    OTP_RESEND_BLOCKED: {
      title: 'Please wait before requesting another code',
      message: 'Please wait a moment before requesting another verification code.',
    },
    INVALID_IDENTIFIER: {
      title: 'Invalid details',
      message: 'Please enter a valid phone number or email address.',
    },
    INVALID_PHONE: {
      title: 'Invalid phone number',
      message: 'Enter a valid Kenyan phone number.',
    },
    INVALID_EMAIL: {
      title: 'Invalid email address',
      message: 'Enter a valid email address.',
    },
    INVALID_DELIVERY_METHOD: {
      title: 'Invalid delivery method',
      message: 'Please choose a valid delivery method and try again.',
    },
    INVALID_VERIFICATION_PURPOSE: {
      title: 'Invalid verification request',
      message: 'Please restart verification and try again.',
    },
    [ErrorCodes.RATE_LIMITED]: {
      title: 'Please wait a moment',
      message: "You've requested too many codes too quickly. Try again shortly.",
    },
  },
  'auth.otp.verify': {
    INVALID_OTP: {
      title: 'Invalid code',
      message: 'The code you entered is incorrect. Please try again.',
    },
    OTP_EXPIRED: {
      title: 'Code expired',
      message: 'Request a new verification code and try again.',
    },
    OTP_REQUIRED: {
      title: 'Verification required',
      message: 'Request a verification code to continue.',
    },
    INVALID_IDENTIFIER: {
      title: 'Invalid details',
      message: 'Please check the phone number or email address and try again.',
    },
    INVALID_PHONE: {
      title: 'Invalid phone number',
      message: 'Enter a valid Kenyan phone number.',
    },
    INVALID_EMAIL: {
      title: 'Invalid email address',
      message: 'Enter a valid email address.',
    },
    [ErrorCodes.RATE_LIMITED]: {
      title: 'Too many attempts',
      message: 'Please wait a moment before trying again.',
    },
  },
  'auth.otp.resend': {
    OTP_DELIVERY_FAILED: {
      title: "Couldn't resend the code",
      message: 'We could not resend the code right now. Please try again.',
    },
    OTP_RESEND_COOLDOWN: {
      title: 'Please wait before requesting another code',
      message: 'You must wait before requesting a new verification code.',
    },
    OTP_SESSION_EXPIRED: {
      title: 'Verification session expired',
      message: 'This verification session has expired. Please start registration again.',
    },
    NO_PENDING_VERIFICATION: {
      title: 'No pending verification found',
      message: 'No pending verification was found for this phone number.',
    },
    INVALID_PHONE_FORMAT: {
      title: 'Invalid phone number',
      message: 'Please enter a valid Kenyan phone number.',
    },
    OTP_SEND_FAILED: {
      title: "Couldn't resend the code",
      message: 'We could not resend the code right now. Please try again.',
    },
    OTP_RESEND_BLOCKED: {
      title: 'Please wait before requesting another code',
      message: 'Please wait a moment before requesting another verification code.',
    },
    INVALID_IDENTIFIER: {
      title: 'Invalid details',
      message: 'Please enter a valid phone number or email address.',
    },
    INVALID_PHONE: {
      title: 'Invalid phone number',
      message: 'Enter a valid Kenyan phone number.',
    },
    INVALID_EMAIL: {
      title: 'Invalid email address',
      message: 'Enter a valid email address.',
    },
    INVALID_DELIVERY_METHOD: {
      title: 'Invalid delivery method',
      message: 'Please choose a valid delivery method and try again.',
    },
    INVALID_VERIFICATION_PURPOSE: {
      title: 'Invalid verification request',
      message: 'Please restart verification and try again.',
    },
    [ErrorCodes.RATE_LIMITED]: {
      title: 'Please wait a moment',
      message: "You've requested too many codes too quickly. Try again shortly.",
    },
    [ErrorCodes.VALIDATION_ERROR]: {
      title: 'Invalid request',
      message: 'Please check your details and try again.',
    },
  },
  'auth.passwordReset.request': {
    PASSWORD_RESET_CODE_SENT: {
      title: 'Reset code sent',
      message: "If the account details are correct, we've sent a reset code.",
    },
  },
  'auth.passwordReset.confirm': {
    PASSWORD_RESET_SUCCESS: {
      title: 'Password updated',
      message: 'Your password has been reset. You can now sign in.',
    },
    INVALID_OTP: {
      title: 'Invalid code',
      message: 'The reset code you entered is incorrect. Please try again.',
    },
    OTP_EXPIRED: {
      title: 'Code expired',
      message: 'Request a new reset code and try again.',
    },
  },
  'invite.send': {
    [ErrorCodes.RATE_LIMITED]: {
      title: 'Please wait a moment',
      message: "You've sent too many invite actions too quickly. Try again shortly.",
    },
  },
  'invite.preview': {
    INVITE_NOT_FOUND: {
      title: 'Invite unavailable',
      message: 'This invite is no longer available. Ask for a new one.',
    },
    INVITE_INVALID: {
      title: 'Invite unavailable',
      message: 'This invite is no longer valid. Ask for a new one.',
    },
    INVITE_EXPIRED: {
      title: 'Invite expired',
      message: 'This invite has expired. Ask for a new invite or join code.',
    },
    INVITE_REVOKED: {
      title: 'Invite no longer valid',
      message: 'This invite has been withdrawn and can no longer be used.',
    },
    INVITE_ALREADY_ACCEPTED: {
      title: 'Invite already used',
      message: 'This invite has already been used. Ask for a new one if you still need access.',
    },
    CHAMA_INACTIVE: {
      title: 'Chama not accepting new members',
      message: 'This chama is not accepting new members right now.',
    },
  },
  'invite.validate': {
    INVITE_NOT_FOUND: {
      title: 'Code not valid',
      message: 'This invite code could not be found. Check it and try again.',
    },
    CODE_NOT_FOUND: {
      title: 'Code not valid',
      message: 'This invite code could not be found. Check it and try again.',
    },
    INVITE_INVALID: {
      title: 'Code not valid',
      message: 'This code is no longer valid. Ask for a new invite or code.',
    },
    INVITE_EXPIRED: {
      title: 'Code expired',
      message: 'This invite code has expired. Ask for a new one.',
    },
    INVITE_REVOKED: {
      title: 'Code no longer valid',
      message: 'This invite code has been withdrawn and can no longer be used.',
    },
  },
  'invite.accept': {
    NOT_FOUND: {
      title: 'Invite unavailable',
      message: 'This invite is no longer available. Ask for a new one.',
    },
    INVITE_NOT_FOUND: {
      title: 'Invite unavailable',
      message: 'This invite is no longer available. Ask for a new one.',
    },
    INVITE_INVALID: {
      title: 'Invite unavailable',
      message: 'This invite is no longer valid. Ask for a new one.',
    },
    INVITE_EXPIRED: {
      title: 'Invite expired',
      message: 'This invite has expired. Ask for a new invite or join code.',
    },
    INVITE_REVOKED: {
      title: 'Invite no longer valid',
      message: 'This invite has been withdrawn and can no longer be used.',
    },
    INVITE_WRONG_ACCOUNT: {
      title: 'Different account needed',
      message: 'This invite was sent to a different account. Sign in with the invited phone number or email.',
    },
    INVITE_ALREADY_ACCEPTED: {
      title: 'Invite already used',
      message: 'This invite has already been used. Ask the chama admin for a new one if needed.',
    },
    ALREADY_MEMBER: {
      title: 'Already a member',
      message: 'You are already a member of this chama.',
    },
    JOIN_REQUEST_PENDING: {
      title: 'Request already sent',
      message: 'Your join request is already waiting for approval.',
    },
    MEMBERSHIP_LIMIT_REACHED: {
      title: 'Chama is full right now',
      message: 'This chama has reached its current member limit. Please try again later.',
    },
    CHAMA_INACTIVE: {
      title: 'Chama not accepting new members',
      message: 'This chama is not accepting new members right now.',
    },
  },
  'payment.generic': {
    PAYMENT_VERIFICATION_PENDING: {
      title: 'Payment pending',
      message: 'Your payment is waiting for confirmation.',
    },
    PAYMENT_FAILED: {
      title: 'Payment not completed',
      message: 'Please try again or choose another payment method.',
    },
  },
};

const SUCCESS_MESSAGES = {
  registerToPhoneVerification: (): UserMessage => ({
    title: 'Verify your phone number',
    message:
      "Your account has been created successfully. We've sent a verification code to your phone. Enter it to continue.",
  }),
  registerToEmailVerification: (): UserMessage => ({
    title: 'Verify your email address',
    message:
      "Your account has been created successfully. We've sent a verification code to your email. Enter it to continue.",
  }),
  otpResentSms: (): UserMessage => ({
    title: 'Code sent',
    message: "We've sent a new verification code to your phone.",
  }),
  otpResentEmail: (): UserMessage => ({
    title: 'Code sent',
    message: "We've sent a new verification code to your email.",
  }),
  otpVerifiedLogin: (): UserMessage => ({
    title: 'Sign in complete',
    message: 'Your code has been confirmed and you are now signed in.',
  }),
  otpVerifiedPhone: (): UserMessage => ({
    title: 'Phone number verified',
    message: 'Your phone number has been verified successfully.',
  }),
  otpVerifiedEmail: (): UserMessage => ({
    title: 'Email verified',
    message: 'Your email address has been verified successfully.',
  }),
  passwordResetRequested: (): UserMessage => ({
    title: 'Verification code sent',
    message: "If the account details are correct, we've sent a reset code.",
  }),
  passwordResetSuccess: (): UserMessage => ({
    title: 'Password updated',
    message: 'Your password has been reset. You can now sign in.',
  }),
};

const BANNED_TERMS = [
  'backend',
  'api',
  'server',
  'database',
  'serializer',
  'exception',
  'stack trace',
  'token mismatch',
  'internal error',
  'http',
  'https://',
  '://',
  'trace',
  'errno',
  'ELOCAL',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'Network Error',
  'timeout',
  'undefined is not',
  'cannot read',
  'is not a function',
  'stack:',
  ' at ',
];

function isUnsafeMessage(message: string | undefined | null): boolean {
  const normalized = String(message || '').toLowerCase();
  return BANNED_TERMS.some((term) => normalized.includes(term));
}

function normalizeCode(error: ApiError): string {
  return String(error.code || ErrorCodes.UNKNOWN).toUpperCase();
}

function inferCodeFromDetails(error: ApiError): string | null {
  const detailsText = JSON.stringify(error.details || {}).toLowerCase();
  const messageText = (error.message || '').toLowerCase();

  if (detailsText.includes('already exists') && detailsText.includes('phone')) {
    return 'ACCOUNT_EXISTS';
  }
  if (detailsText.includes('already exists') && detailsText.includes('email')) {
    return 'EMAIL_ALREADY_REGISTERED';
  }
  if (detailsText.includes('already a member')) {
    return 'ALREADY_MEMBER';
  }
  if (detailsText.includes('restricted to another user')) {
    return 'INVITE_WRONG_ACCOUNT';
  }
  if (detailsText.includes('join request') && detailsText.includes('pending')) {
    return 'JOIN_REQUEST_PENDING';
  }
  if (detailsText.includes('invite') && detailsText.includes('revoked')) {
    return 'INVITE_REVOKED';
  }
  if (detailsText.includes('invite') && detailsText.includes('invalid')) {
    return 'INVITE_INVALID';
  }
  if (detailsText.includes('invite') && detailsText.includes('expired')) {
    return 'INVITE_EXPIRED';
  }
  if (detailsText.includes('expired') || messageText.includes('expired')) {
    return 'OTP_EXPIRED';
  }
  if (detailsText.includes('invalid') && detailsText.includes('otp')) {
    return 'INVALID_OTP';
  }
  if (messageText.includes('wait') && messageText.includes('cooldown')) {
    return 'OTP_RESEND_COOLDOWN';
  }
  if (messageText.includes('rate limit')) {
    return ErrorCodes.RATE_LIMITED;
  }
  if (messageText.includes('no pending') || messageText.includes('not found')) {
    return 'NO_PENDING_VERIFICATION';
  }
  if (messageText.includes('valid kenyan') || messageText.includes('phone number')) {
    return 'INVALID_PHONE_FORMAT';
  }

  return null;
}

export function getUserMessage(
  error: unknown,
  context: UserMessageContext = 'generic'
): UserMessage {
  const apiError = toApiError(error);
  const normalizedCode = normalizeCode(apiError);
  const inferredCode = inferCodeFromDetails(apiError);
  const codeMessages = CONTEXT_CODE_MESSAGES[context] || {};
  const baseMessage =
    (inferredCode ? codeMessages[inferredCode] : undefined) ||
    codeMessages[normalizedCode] ||
    codeMessages[apiError.code] ||
    (!isUnsafeMessage(apiError.message)
      ? {
          title: DEFAULT_MESSAGES[context].title,
          message: apiError.message,
        }
      : undefined) ||
    DEFAULT_MESSAGES[context];

  return baseMessage;
}

export function getSuccessMessage(
  key: keyof typeof SUCCESS_MESSAGES
): UserMessage {
  return SUCCESS_MESSAGES[key]();
}
