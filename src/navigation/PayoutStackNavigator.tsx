/**
 * Payout Stack Navigator Configuration
 * 
 * Register all payout-related screens in the main navigation
 * Part of the app's tab/drawer navigation structure
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PayoutsListScreen from '../screens/payouts/PayoutsListScreen';
import MemberPayoutDetailScreen from '../screens/payouts/MemberPayoutDetailScreen';
import TreasurerPayoutReviewScreen from '../screens/payouts/TreasurerPayoutReviewScreen';
import ChairpersonPayoutApprovalScreen from '../screens/payouts/ChairpersonPayoutApprovalScreen';
import RotationQueueScreen from '../screens/payouts/RotationQueueScreen';
import SelectPaymentMethodScreen from '../screens/payouts/SelectPaymentMethodScreen';

import { PayoutStackParamList } from './PayoutNavigator.types';
import { useTheme } from '@/providers/ThemeProvider';

const Stack = createNativeStackNavigator<PayoutStackParamList>();

interface PayoutStackNavigatorProps {
  initialRoute?: keyof PayoutStackParamList;
}

/**
 * Payout Stack Navigator
 * 
 * All screens related to payout workflow
 */
export function PayoutStackNavigator({ initialRoute = 'PayoutsList' }: PayoutStackNavigatorProps) {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          color: theme.colors.text,
        },
        headerBackTitle: 'Back',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      {/* Main List Screen */}
      <Stack.Screen
        name="PayoutsList"
        component={PayoutsListScreen}
        options={{
          title: 'Payouts',
          headerShown: true,
        }}
      />

      {/* Member Detail Screen */}
      <Stack.Screen
        name="PayoutDetail"
        component={MemberPayoutDetailScreen}
        options={{
          title: 'Payout Status',
          headerShown: true,
        }}
      />

      {/* Treasurer Review Screen - Role-Based */}
      <Stack.Screen
        name="TreasurerReview"
        component={TreasurerPayoutReviewScreen}
        options={{
          title: 'Review Payout',
          headerShown: true,
          gestureEnabled: false, // Prevent accidental back
        }}
      />

      {/* Chairperson Approval Screen - Role-Based */}
      <Stack.Screen
        name="ChairpersonApproval"
        component={ChairpersonPayoutApprovalScreen}
        options={{
          title: 'Approve Payout',
          headerShown: true,
          gestureEnabled: false, // Prevent accidental back
        }}
      />

      {/* Rotation Queue Screen */}
      <Stack.Screen
        name="RotationQueue"
        component={RotationQueueScreen}
        options={{
          title: 'Rotation Queue',
          headerShown: true,
        }}
      />

      {/* Payment Method Selection */}
      <Stack.Screen
        name="SelectPaymentMethod"
        component={SelectPaymentMethodScreen}
        options={{
          title: 'Payment Method',
          headerShown: true,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default PayoutStackNavigator;
