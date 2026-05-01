import React, { ReactElement } from 'react';
import {
  render as rtlRender,
  RenderOptions,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Test navigation wrapper
const MockNavigationContainer = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

// All providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryProvider>
    <ThemeProvider>
      <SafeAreaProvider>
        <MockNavigationContainer>
          <AuthProvider>{children}</AuthProvider>
        </MockNavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  </QueryProvider>
);

// Custom render with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => rtlRender(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export { screen, fireEvent, waitFor } from '@testing-library/react-native';
export { customRender as render };
