import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ToastOptions>({
    type: 'info',
    title: '',
    duration: 4000,
  });

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const showToast = useCallback((newOptions: ToastOptions) => {
    setOptions({
      type: 'info',
      duration: 4000,
      ...newOptions,
    });
    setVisible(true);
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo, hideToast }}>
      {children}
      <Toast
        visible={visible}
        type={options.type}
        title={options.title}
        message={options.message}
        action={options.action}
        duration={options.duration}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
