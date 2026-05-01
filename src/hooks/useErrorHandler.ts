import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useToast } from '@/components/ui/ToastProvider';
import { ApiError } from '@/api/errors';
import { getSafeErrorMessage, getErrorTitle, isRetryableError, requiresSessionRefresh, logErrorSafely } from '@/api/safeErrorHandler';

interface ErrorHandlerOptions {
  context?: string;
  customMessages?: Record<string, { title: string; message: string }>;
  onSessionExpired?: () => void;
  useToast?: boolean;
  onRetry?: () => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { showToast, showError, showSuccess, hideToast } = useToast();
  
  const handleError = useCallback((error: unknown) => {
    logErrorSafely(options.context || 'Error', error);
    
    const userMessage = getSafeErrorMessage(error);
    const errorTitle = getErrorTitle(error);
    
    if (requiresSessionRefresh(error)) {
      if (options.onSessionExpired) {
        options.onSessionExpired();
        return;
      }
      Alert.alert('Session expired', 'Please sign in again to continue.', [{ text: 'Sign In', onPress: () => {} }]);
      return;
    }
    
    const canRetry = isRetryableError(error);
    
    if (options.useToast !== false) {
      if (canRetry && options.onRetry) {
        showToast({
          type: 'error',
          title: errorTitle,
          message: userMessage,
          action: { label: 'Try again', onPress: options.onRetry },
        });
      } else {
        showError(errorTitle, userMessage);
      }
    } else {
      if (canRetry && options.onRetry) {
        Alert.alert(errorTitle, userMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try again', onPress: options.onRetry },
        ]);
      } else {
        Alert.alert(errorTitle, userMessage);
      }
    }
  }, [options, showToast, showError]);
  
  const handleValidationError = useCallback((error: unknown): Record<string, string> => {
    if (error instanceof ApiError && error.details) {
      const fieldErrors: Record<string, string> = {};
      Object.entries(error.details).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0];
        } else if (typeof messages === 'string') {
          fieldErrors[field] = messages;
        }
      });
      return fieldErrors;
    }
    return {};
  }, []);
  
  const handleSuccess = useCallback((title: string, message?: string) => {
    showSuccess(title, message);
  }, [showSuccess]);
  
  const showInfoMessage = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);
  
  return { handleError, handleValidationError, handleSuccess, showInfoMessage, hideToast };
};

export default useErrorHandler;
