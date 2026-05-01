import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { SendCommunicationScreen } from '../SendCommunicationScreen';
import { ThemeProvider } from '@/providers/ThemeProvider';

jest.mock('@/hooks', () => ({
  useActiveChama: () => ({ activeChamaId: 'chama-1' }),
}));

jest.mock('@/services/communicationService', () => ({
  communicationService: {
    sendCampaign: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
  useRoute: () => ({ params: { chamaId: 'chama-1' } }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SendCommunicationScreen email gating', () => {
  it('disables email channel until priority is critical', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SendCommunicationScreen />
      </ThemeProvider>
    );

    const emailChip = getByTestId('channel-email');
    const emailDisabled = Boolean(
      emailChip.props.disabled ?? emailChip.props.accessibilityState?.disabled
    );
    expect(emailDisabled).toBe(true);

    fireEvent.press(getByTestId('priority-critical'));
    const emailChipEnabled = getByTestId('channel-email');
    const emailDisabledAfter = Boolean(
      emailChipEnabled.props.disabled ?? emailChipEnabled.props.accessibilityState?.disabled
    );
    expect(emailDisabledAfter).toBe(false);
  });
});
