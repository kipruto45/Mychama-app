import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { memberWalletService } from '@/services/memberWalletService';
import { useAuthStore } from '@/store/authStore';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

import { getPaymentMethodDisplay, normalizePhoneNumber } from './memberPaymentsWorkflowShared';

type WalletWithdrawalReviewNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletWithdrawalReview'
>;
type WalletWithdrawalReviewRouteProp = RouteProp<MainStackParamList, 'WalletWithdrawalReview'>;

export const WalletWithdrawalReviewScreen: React.FC = () => {
  const navigation = useNavigation<WalletWithdrawalReviewNavigationProp>();
  const route = useRoute<WalletWithdrawalReviewRouteProp>();
  const { user } = useAuthStore();
  const {
    setLastVisitedScreen,
    setPendingWithdrawalIntentId,
    setWithdrawalDraft,
  } = useMemberWalletFlowStore();

  const [phone, setPhone] = useState(normalizePhoneNumber(route.params.phone || user?.phone || ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletWithdrawalReview');
  }, [setLastVisitedScreen]);

  const normalizedPhone = normalizePhoneNumber(phone);
  const remainingBalance = Math.max(
    Number(route.params.withdrawableBalance || 0) - Number(route.params.amount || 0),
    0
  ).toFixed(2);

  const handleConfirm = async () => {
    if (!normalizedPhone || normalizedPhone.length < 12) {
      setError('Enter a valid phone number to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await memberWalletService.createWithdrawal({
        chamaId: route.params.chamaId,
        amount: route.params.amount,
        paymentMethod: route.params.paymentMethod,
        phone: normalizedPhone,
      });
      setPendingWithdrawalIntentId(result.intentId);
      setWithdrawalDraft({
        amount: route.params.amount,
        method: route.params.paymentMethod,
      });
      navigation.replace('WalletWithdrawalStatus', {
        chamaId: route.params.chamaId,
        intentId: result.intentId,
        source: 'withdrawal_review',
      });
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t submit your withdrawal right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Review Withdrawal" showBack />
        <EmptyState
          title="Review unavailable"
          description="Go back and enter your withdrawal details again."
          icon="clipboard-alert-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Review Withdrawal" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Confirm withdrawal</Text>
          <Text style={styles.heroTitle}>Review your withdrawal request.</Text>
          <Text style={styles.heroText}>
            Confirm the amount, destination, and timing before you submit the request.
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(route.params.amount, route.params.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Withdrawable balance</Text>
            <Text style={styles.value}>
              {formatCurrency(route.params.withdrawableBalance, route.params.currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Withdrawal method</Text>
            <Text style={styles.value}>{getPaymentMethodDisplay(route.params.paymentMethod)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expected processing time</Text>
            <Text style={styles.value}>Usually within the normal payout cycle</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fees</Text>
            <Text style={styles.value}>{formatCurrency('0.00', route.params.currency)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Balance after request</Text>
            <Text style={styles.totalValue}>{formatCurrency(remainingBalance, route.params.currency)}</Text>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Input
            label="M-Pesa destination"
            placeholder="2547XXXXXXXX"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (error) setError(null);
            }}
            keyboardType="phone-pad"
            error={error || undefined}
          />
        </Card>

        <Button
          title="Confirm Withdrawal"
          loading={submitting}
          onPress={() => void handleConfirm()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: spacing[5],
    gap: spacing[4],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#20150E',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#E7C2A4',
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    marginBottom: spacing[2],
  },
  heroText: {
    color: '#F2E4DA',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  label: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  value: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing[2],
  },
  totalLabel: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  totalValue: {
    color: colors.primary[700],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
});

export default WalletWithdrawalReviewScreen;
