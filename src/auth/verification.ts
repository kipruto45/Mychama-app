import { normalizeKenyanPhone } from '@/utils/phoneUtils';
import type { DeliveryMethod, VerificationContext, VerificationPurpose } from '@/navigation/types';

type VerificationContextInput = Partial<VerificationContext> & {
  identifier?: string;
  phone?: string;
  email?: string;
  purpose?: VerificationPurpose;
  deliveryMethod?: DeliveryMethod;
};

const normalizeEmail = (value?: string): string => String(value || '').trim().toLowerCase();

const isEmail = (value?: string): boolean => {
  const normalized = normalizeEmail(value);
  return !!normalized && normalized.includes('@') && normalized.includes('.');
};

const normalizePhoneNumber = (value?: string): string => {
  if (!value) return '';
  try {
    return normalizeKenyanPhone(value);
  } catch {
    return value;
  }
};

const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return (local[0] || '*') + '***@' + domain;
};

const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  // Example: +2547******00 / +2541******00
  const head = phone.slice(0, 5);
  const tail = phone.slice(-2);
  return `${head}******${tail}`;
};

export function resolveVerificationContext(input: VerificationContextInput): VerificationContext {
  // Determine delivery method first. For verification flows, the delivery method is the source of truth.
  const deliveryMethod: DeliveryMethod =
    input.deliveryMethod ??
    (input.purpose === 'verify_email' ? 'email' : input.purpose === 'verify_phone' ? 'sms' : undefined) ??
    (isEmail(input.identifier) || isEmail(input.email) ? 'email' : 'sms');
  const nextRoute = input.nextRoute ?? 'ChamaSetup';
  const successTitle = input.successTitle;
  const successMessage = input.successMessage;
  const incomingPurpose = input.purpose;
  
  if (deliveryMethod === 'email') {
    const emailCandidate = normalizeEmail(input.email || (isEmail(input.identifier) ? input.identifier : ''));
    const phone = input.phone ? normalizePhoneNumber(input.phone) : '';
    
    let purpose: VerificationPurpose;
    // Enforce: email delivery => verify_email for member verification.
    // For non-verification purposes (e.g. login_2fa) we keep the incoming purpose.
    if (incomingPurpose === 'login_2fa' || incomingPurpose === 'password_reset' || incomingPurpose === 'withdrawal_confirm' || incomingPurpose === 'register') {
      purpose = incomingPurpose;
    } else {
      purpose = 'verify_email';
    }
    
    const identifier = emailCandidate;
    
    return {
      identifier,
      phone,
      email: emailCandidate || undefined,
      purpose,
      deliveryMethod: 'email',
      channelLabel: 'email',
      displayTitle: 'Email Verification',
      displaySubtitle: 'We sent a verification code to your email address.',
      maskedDestination: maskEmail(emailCandidate),
      nextRoute,
      nextToken: input.nextToken,
      nextCode: input.nextCode,
      successTitle,
      successMessage,
      registrationData: input.registrationData,
    };
  }
  
  const phoneCandidate = normalizePhoneNumber(
    input.phone || (!isEmail(input.identifier) ? (input.identifier || '') : '')
  );
  const email = normalizeEmail(input.email) || (isEmail(input.identifier) ? normalizeEmail(input.identifier) : '') || undefined;
  
  let purpose: VerificationPurpose;
  // Enforce: SMS/console delivery => verify_phone for member verification.
  if (incomingPurpose === 'login_2fa' || incomingPurpose === 'password_reset' || incomingPurpose === 'withdrawal_confirm' || incomingPurpose === 'register') {
    purpose = incomingPurpose;
  } else {
    purpose = 'verify_phone';
  }
  
  return {
    identifier: phoneCandidate,
    phone: phoneCandidate,
    email,
    purpose,
    deliveryMethod,
    channelLabel: 'SMS',
    displayTitle: 'Phone Number Verification',
    displaySubtitle:
      deliveryMethod === 'console'
        ? 'A verification code has been generated. Check the terminal/console for the code.'
        : 'We sent a verification code to your phone number via SMS.',
    maskedDestination: maskPhone(phoneCandidate),
    nextRoute,
    nextToken: input.nextToken,
    nextCode: input.nextCode,
    successTitle,
    successMessage,
    registrationData: input.registrationData,
  };
}

export function resolveVerificationIdentifier(params: {
  identifier?: string;
  phone?: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  purpose?: VerificationPurpose;
}): string {
  return resolveVerificationContext({
    identifier: params.identifier,
    phone: params.phone,
    email: params.email,
    deliveryMethod: params.deliveryMethod,
    purpose: params.purpose,
  }).identifier;
}

export function isEmailVerificationContext(context: Pick<VerificationContext, 'deliveryMethod' | 'identifier' | 'purpose'>): boolean {
  // Delivery method is the source of truth; don't infer channel from identifier shape.
  return context.deliveryMethod === 'email' || context.purpose === 'verify_email';
}

export function getVerificationDisplayInfo(context: Pick<VerificationContext, 'deliveryMethod' | 'identifier' | 'purpose' | 'phone' | 'email'>) {
  const isEmail = context.deliveryMethod === 'email' || context.purpose === 'verify_email';
  
  if (isEmail) {
    const maskedEmail = context.email ? maskEmail(context.email) : maskEmail(context.identifier);
    return {
      displayTitle: 'Email Verification',
      displaySubtitle: 'We sent a verification code to your email address.',
      channelLabel: 'email',
      maskedDestination: maskedEmail,
      resendLabel: 'Resend code to email',
      codePlaceholder: 'Enter the code sent to your email.',
    };
  }
  
  const maskedPhone = context.phone ? maskPhone(context.phone) : maskPhone(context.identifier);
  return {
    displayTitle: 'Phone Number Verification',
    displaySubtitle: 'We sent a verification code to your phone number via SMS.',
    channelLabel: 'SMS',
    maskedDestination: maskedPhone,
    resendLabel: 'Resend code via SMS',
    codePlaceholder: 'Enter the code sent to your phone.',
  };
}
