import { ApiError } from '@/api/errors';
import { getCreateChamaErrorMessage } from '../createChamaFeedback';

describe('getCreateChamaErrorMessage', () => {
  it('surfaces the KYC guard message from the backend code', () => {
    const error = new ApiError({
      code: 'KYC_REQUIRED_FOR_CHAMA_CREATION',
      message: 'Complete and pass KYC verification before creating a chama.',
      status: 403,
    });

    expect(getCreateChamaErrorMessage(error)).toBe(
      'Complete and pass KYC verification before creating a chama.'
    );
  });

  it('surfaces the member permission guard with an actionable message', () => {
    const error = new ApiError({
      code: 'MEMBER_CREATE_CHAMA_FORBIDDEN',
      message: 'Members are not allowed to create a chama.',
      status: 403,
    });

    expect(getCreateChamaErrorMessage(error)).toBe(
      'This account cannot create a chama. Use an admin-capable account or ask your chama admin for help.'
    );
  });

  it('keeps field-level validation hints specific', () => {
    const error = new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'county is required',
      status: 400,
    });

    expect(getCreateChamaErrorMessage(error)).toBe('Choose a county to continue.');
  });
});
