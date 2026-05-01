import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ThemeProvider } from '@/providers/ThemeProvider';

jest.setTimeout(15000);

const mockRegister = jest.fn();
const mockClearAuthError = jest.fn();

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    register: mockRegister,
    isLoading: false,
    clearAuthError: mockClearAuthError,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => null,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockClearAuthError.mockReset();
  });

  it('renders weak password errors under the password field', async () => {
    mockRegister.mockRejectedValue(
      new ApiError({
        code: 'WEAK_PASSWORD',
        message:
          'Your password is too weak. Use at least 8 characters, including uppercase, lowercase, a number, and a special character.',
        status: 400,
        details: {
          errors: {
            password: ['Password is too weak. Use a longer passphrase with mixed character types.'],
          },
        },
      })
    );

    const { getByPlaceholderText, getByText, getAllByText, queryByTestId } = render(
      <ThemeProvider>
        <RegisterScreen />
      </ThemeProvider>
    );

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('0712345678'), '0712345678');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'password');
    fireEvent.changeText(getByPlaceholderText('Re-enter your password'), 'password');

    fireEvent.press(getAllByText('Create Account').slice(-1)[0]);

    await waitFor(() => {
      expect(getByText(/password is too weak/i)).toBeTruthy();
    }, { timeout: 8000 });

    // Weak password should be a field-level error (not only a form-level banner)
    expect(queryByTestId('register-form-error')).toBeNull();
  });
});
