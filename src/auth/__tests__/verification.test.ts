import { resolveVerificationContext, resolveVerificationIdentifier } from '@/auth/verification';

describe('verification context normalization', () => {
  it('keeps email verification aligned to email delivery', () => {
    const context = resolveVerificationContext({
      identifier: '+254786737061',
      phone: '+254786737061',
      email: 'YanguChama@Gmail.com',
      purpose: 'verify_phone',
      deliveryMethod: 'email',
      nextRoute: 'ChamaSetup',
    });

    expect(context.identifier).toBe('yanguchama@gmail.com');
    expect(context.email).toBe('yanguchama@gmail.com');
    expect(context.phone).toBe('+254786737061');
    expect(context.purpose).toBe('verify_email');
    expect(context.deliveryMethod).toBe('email');
    expect(context.displayTitle).toBe('Email Verification');
    expect(context.channelLabel).toBe('email');
    expect(context.maskedDestination).toBe('y***@gmail.com');
  });

  it('keeps sms verification aligned to the normalized phone number', () => {
    const context = resolveVerificationContext({
      identifier: '0786737061',
      email: 'yanguchama@gmail.com',
      purpose: 'verify_email',
      deliveryMethod: 'sms',
      nextRoute: 'ChamaSetup',
    });

    expect(context.identifier).toBe('+254786737061');
    expect(context.phone).toBe('+254786737061');
    expect(context.purpose).toBe('verify_phone');
    expect(context.deliveryMethod).toBe('sms');
    expect(context.displayTitle).toBe('Phone Number Verification');
    expect(context.channelLabel).toBe('SMS');
    expect(context.maskedDestination).toBe('+2547******61');
  });

  it('builds resend identifiers from the correct channel target', () => {
    expect(
      resolveVerificationIdentifier({
        identifier: '+254786737061',
        email: 'yanguchama@gmail.com',
        deliveryMethod: 'email',
        purpose: 'verify_email',
      })
    ).toBe('yanguchama@gmail.com');

    expect(
      resolveVerificationIdentifier({
        identifier: '0786737061',
        deliveryMethod: 'sms',
        purpose: 'verify_phone',
      })
    ).toBe('+254786737061');
  });
});
