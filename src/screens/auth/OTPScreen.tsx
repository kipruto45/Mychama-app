import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resolveVerificationContext } from '@/auth/verification';
import { type AuthStackParamList } from '@/navigation/types';
import { normalizeKenyanPhone } from '@/utils/phoneUtils';

type OTPScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, 'OTP'>;

// Legacy entry point maintained for backward compatibility.
// Redirects into the canonical OTP verification screen with a normalized context.
export const OTPScreen: React.FC = () => {
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPScreenRouteProp>();
  const phone = route.params?.phone;

  useEffect(() => {
    if (!phone) {
      Alert.alert(
        'Missing phone number',
        'Please start the registration or sign-in process again.'
      );
      navigation.goBack();
      return;
    }

    let normalized = phone;
    try {
      normalized = normalizeKenyanPhone(phone);
    } catch {
      // Keep raw value; OTPVerificationScreen will show a useful error if it cannot proceed.
    }

    navigation.replace('OTPVerification', {
      verificationContext: resolveVerificationContext({
        identifier: normalized,
        phone: normalized,
        deliveryMethod: 'sms',
        purpose: 'verify_phone',
        nextRoute: 'ChamaSetup',
      }),
    });
  }, [navigation, phone]);

  return null;
};

