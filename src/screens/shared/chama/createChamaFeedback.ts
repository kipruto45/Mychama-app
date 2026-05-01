import { ErrorCodes, toApiError } from '@/api/errors';

const GENERIC_CREATE_CHAMA_ERROR =
  'We couldn’t create your chama right now. Please try again.';

export function getCreateChamaErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  const message = apiError.message.toLowerCase();

  if (apiError.code === 'MEMBER_CREATE_CHAMA_FORBIDDEN') {
    return 'This account cannot create a chama. Use an admin-capable account or ask your chama admin for help.';
  }

  if (apiError.code === 'KYC_REQUIRED_FOR_CHAMA_CREATION') {
    return 'Complete and pass KYC verification before creating a chama.';
  }

  if (apiError.code === ErrorCodes.CONNECTION_FAILED || apiError.code === ErrorCodes.NETWORK_ERROR) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  if (apiError.code === ErrorCodes.TIMEOUT) {
    return 'The chama setup request is taking longer than expected. Please try again.';
  }

  if (message.includes('already exists') || message.includes('duplicate')) {
    return 'That chama name is already in use. Choose a different name and try again.';
  }
  if (message.includes('county')) {
    return 'Choose a county to continue.';
  }
  if (message.includes('subcounty')) {
    return 'Enter the subcounty to continue.';
  }
  if (message.includes('name')) {
    return 'Enter a chama name to continue.';
  }

  return apiError.message || GENERIC_CREATE_CHAMA_ERROR;
}
