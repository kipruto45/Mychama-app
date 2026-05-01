import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { KYCFlowProvider, useKYCFlow } from '@/screens/kyc/KYCFlowContext';
import { KYCReviewConfirmScreen } from '@/screens/kyc/KYCReviewConfirmScreen';

jest.setTimeout(15000);

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/hooks', () => ({
  useActiveChama: () => ({ activeChamaId: null, activeChama: null }),
}));

jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      border: '#E5E7EB',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
    },
  }),
}));

jest.mock('@/services/kycService', () => ({
  kycService: {
    uploadDocument: jest.fn(async () => ({ data: { record: null } })),
    submitLocation: jest.fn(async () => ({})),
    submit: jest.fn(async () => ({})),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 2 },
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: true })),
  hasServicesEnabledAsync: jest.fn(async () => true),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: -1.2921, longitude: 36.8219 },
  })),
  reverseGeocodeAsync: jest.fn(async () => [{ city: 'Nairobi', country: 'Kenya' }]),
}));

describe('KYCScreen location capture UX', () => {
  it('captures device location when share location is enabled', async () => {
    const SeedDraft = () => {
      const { setDraft } = useKYCFlow();

      React.useEffect(() => {
        setDraft((prev) => ({
          ...prev,
          kycId: 'kyc_1',
          legalName: 'Test User',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationality: 'Kenyan',
          documentType: 'national_id',
          idNumber: '12345678',
          idFrontUri: 'file://id-front.jpg',
          idBackUri: 'file://id-back.jpg',
          selfieUri: 'file://selfie.jpg',
          shareLocation: false,
          location: null,
        }));
      }, [setDraft]);

      return <KYCReviewConfirmScreen />;
    };

    const { getByTestId, getByText } = render(
      <KYCFlowProvider initial={{ onboardingPath: 'create_chama', chamaId: null, legalName: 'Test User' }}>
        <SeedDraft />
      </KYCFlowProvider>
    );

    fireEvent(getByTestId('kyc-share-location-switch'), 'valueChange', true);

    await waitFor(() => {
      expect(getByText('Nairobi, Kenya')).toBeTruthy();
    }, { timeout: 8000 });
  });
});
