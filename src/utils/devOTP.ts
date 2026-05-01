/**
 * Development-only OTP logging utility
 * 
 * Logs OTP codes to the Metro console in development only.
 * This should NEVER be enabled in production builds.
 */

// Only log in development
const isDev = __DEV__;

export function logDevOTP(source: string, phone: string, code: string): void {
  if (!isDev) return;
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔐 DEV OTP - ${source.toUpperCase()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📱 Phone: ${phone}`);
  console.log(`  🔢 Code:  ${code}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

export function logDevOTPFromResponse(
  source: string,
  response: { data?: { dev_otp?: string; phone?: string } }
): void {
  if (!isDev) return;
  
  const { dev_otp, phone } = response.data || {};
  
  if (dev_otp && phone) {
    logDevOTP(source, phone, dev_otp);
  }
}

/**
 * Wrapper to add OTP logging to any async auth function
 */
export async function withDevOTPLogging<T>(
  source: string,
  fn: () => Promise<T>,
  responseHandler?: (response: unknown) => void
): Promise<T> {
  const result = await fn();
  
  // If the function returns a response with dev_otp, log it
  if (responseHandler && isDev) {
    responseHandler(result);
  }
  
  return result;
}