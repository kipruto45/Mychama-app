import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { memberWalletService } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency } from '@/utils/format';

import { getPaymentMethodDisplay } from './memberPaymentsWorkflowShared';

type WalletDepositReviewNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletDepositReview'
>;
type WalletDepositReviewRouteProp = RouteProp<MainStackParamList, 'WalletDepositReview'>;

export const WalletDepositReviewScreen: React.FC = () => {
  const navigation = useNavigation<WalletDepositReviewNavigationProp>();
  const route = useRoute<WalletDepositReviewRouteProp>();
  const {
    setDepositDraft,
    setLastVisitedScreen,
    setPendingDepositIntentId,
  } = useMemberWalletFlowStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletDepositReview');
  }, [setLastVisitedScreen]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await memberWalletService.createDeposit({
        chamaId: route.params.chamaId,
        amount: route.params.amount,
        paymentMethod: route.params.paymentMethod,
        phone: route.params.phone,
      });
      setPendingDepositIntentId(result.intentId);
      setDepositDraft({
        amount: route.params.amount,
        method: route.params.paymentMethod,
      });
      navigation.replace('WalletDepositStatus', {
        chamaId: route.params.chamaId,
        intentId: result.intentId,
        source: 'deposit_review',
      });
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t start your deposit right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Review Deposit" showBack />
        <EmptyState
          title="Review unavailable"
          description="Go back and enter your deposit details again."
          icon="clipboard-alert-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Review Deposit" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Confirm wallet funding</Text>
          <Text style={styles.heroTitle}>Review your deposit before continuing.</Text>
          <Text style={styles.heroText}>
            Confirm the amount, method, and destination before we send the payment request.
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(route.params.amount, route.params.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Deposit method</Text>
            <Text style={styles.value}>{getPaymentMethodDisplay(route.params.paymentMethod)}</Text>
          </View>
          {route.params.paymentMethod === 'mpesa' ? (
            <View style={styles.row}>
              <Text style={styles.label}>Phone number</Text>
              <Text style={styles.value}>{route.params.phone}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Wallet destination</Text>
            <Text style={styles.value}>My wallet</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fees</Text>
            <Text style={styles.value}>{formatCurrency('0.00', route.params.currency)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(route.params.amount, route.params.currency)}
            </Text>
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Confirm Deposit" loading={submitting} onPress={() => void handleConfirm()} />
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
    backgroundColor: '#0E2C20',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroEyebrow: {
    color: '#9EE5C2',
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
    color: '#D9F2E5',
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
    textAlign: 'right',
    flex: 1,
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
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletDepositReviewScreen;
