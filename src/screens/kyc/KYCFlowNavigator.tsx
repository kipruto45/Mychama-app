import React, { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useActiveChama } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { KYCFlowProvider } from './KYCFlowContext';
import { KYCLandingScreen } from './KYCLandingScreen';
import { KYCPersonalDetailsScreen } from './KYCPersonalDetailsScreen';
import { KYCSelectIDTypeScreen } from './KYCSelectIDTypeScreen';
import { KYCCaptureIDFrontScreen } from './KYCCaptureIDFrontScreen';
import { KYCCaptureIDBackScreen } from './KYCCaptureIDBackScreen';
import { KYCLivenessSelfieScreen } from './KYCLivenessSelfieScreen';
import { KYCReviewConfirmScreen } from './KYCReviewConfirmScreen';
import { KYCProcessingScreen } from './KYCProcessingScreen';
import { KYCStatusScreen } from './KYCStatusScreen';
import { KYCRejectedScreen } from './KYCRejectedScreen';
import { KYCResubmitScreen } from './KYCResubmitScreen';
import { AccountFrozenScreen } from './AccountFrozenScreen';
import type { OnboardingPath } from '@/services/kycService';

export type KYCFlowStackParamList = {
  KYCLanding: undefined;
  KYCPersonalDetails: undefined;
  KYCSelectIDType: undefined;
  KYCCaptureIDFront: undefined;
  KYCCaptureIDBack: undefined;
  KYCLivenessSelfie: undefined;
  KYCReviewConfirm: undefined;
  KYCProcessing: { kycId: string };
  KYCStatus: undefined;
  KYCRejected: undefined;
  KYCResubmit: undefined;
  AccountFrozen: undefined;
};

const Stack = createNativeStackNavigator<KYCFlowStackParamList>();

export function KYCFlowNavigator() {
  const { user } = useAuth();
  const { activeChamaId } = useActiveChama();

  const initial = useMemo(() => {
    const onboardingPath: OnboardingPath =
      activeChamaId ? 'existing_member_update' : 'create_chama';
    return {
      onboardingPath,
      chamaId: null,
      legalName: user?.full_name || '',
    };
  }, [activeChamaId, user?.full_name]);

  const initialRouteName: keyof KYCFlowStackParamList =
    user?.account_frozen ? 'AccountFrozen' : 'KYCLanding';

  return (
    <KYCFlowProvider initial={initial}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="AccountFrozen" component={AccountFrozenScreen} />
        <Stack.Screen name="KYCLanding" component={KYCLandingScreen} />
        <Stack.Screen name="KYCPersonalDetails" component={KYCPersonalDetailsScreen} />
        <Stack.Screen name="KYCSelectIDType" component={KYCSelectIDTypeScreen} />
        <Stack.Screen name="KYCCaptureIDFront" component={KYCCaptureIDFrontScreen} />
        <Stack.Screen name="KYCCaptureIDBack" component={KYCCaptureIDBackScreen} />
        <Stack.Screen name="KYCLivenessSelfie" component={KYCLivenessSelfieScreen} />
        <Stack.Screen name="KYCReviewConfirm" component={KYCReviewConfirmScreen} />
        <Stack.Screen name="KYCProcessing" component={KYCProcessingScreen} />
        <Stack.Screen name="KYCStatus" component={KYCStatusScreen} />
        <Stack.Screen name="KYCRejected" component={KYCRejectedScreen} />
        <Stack.Screen name="KYCResubmit" component={KYCResubmitScreen} />
      </Stack.Navigator>
    </KYCFlowProvider>
  );
}

