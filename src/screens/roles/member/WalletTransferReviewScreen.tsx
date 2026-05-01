import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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

type WalletTransferReviewNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletTransferReview'
>;
type WalletTransferReviewRouteProp = RouteProp<MainStackParamList, 'WalletTransferReview'>;

export const WalletTransferReviewScreen: React.FC = () => {
  const navigation = useNavigation<WalletTransferReviewNavigationProp>();
  const route = useRoute<WalletTransferReviewRouteProp>();
  const { setLastVisitedScreen } = useMemberWalletFlowStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletTransferReview');
  }, [setLastVisitedScreen]);

  const remainingBalance = useMemo(() => {
    const remaining = Math.max(
      Number(route.params.availableBalance || 0) - Number(route.params.amount || 0),
      0
    );
    return remaining.toFixed(2);
  }, [route.params.amount, route.params.availableBalance]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await memberWalletService.createTransfer({
        chamaId: route.params.chamaId,
        recipientMemberId: route.params.recipientMemberId,
        amount: route.params.amount,
        note: route.params.note,
      });

      navigation.replace('WalletTransactionDetail', {
        transactionId: result.transactionRef,
        chamaId: route.params.chamaId,
        source: 'wallet_overview',
      });
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t complete this transfer right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!route.params?.chamaId || !route.params?.recipientMemberId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Review Transfer" showBack />
        <EmptyState
          title="Transfer review unavailable"
          description="Go back and enter the transfer details again."
          icon="clipboard-alert-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Review Transfer" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="account-arrow-right" size={22} color="#DDEBFF" />
          </View>
          <Text style={styles.heroEyebrow}>Confirm transfer</Text>
          <Text style={styles.heroTitle}>Review your transfer before sending.</Text>
          <Text style={styles.heroText}>
            Confirm the recipient and amount. Transfers are instant and can’t be reversed.
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Recipient</Text>
            <Text style={styles.value}>{route.params.recipientName}</Text>
          </View>
          {route.params.recipientPhone ? (
            <View style={styles.row}>
              <Text style={styles.label}>Recipient phone</Text>
              <Text style={styles.value}>{route.params.recipientPhone}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(route.params.amount, route.params.currency)}</Text>
          </View>
          {route.params.note ? (
            <View style={styles.row}>
              <Text style={styles.label}>Note</Text>
              <Text style={styles.value}>{route.params.note}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Balance after transfer</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(remainingBalance, route.params.currency)}
            </Text>
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Confirm Transfer" loading={submitting} onPress={() => void handleConfirm()} />
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
    backgroundColor: '#0F1B2E',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    ...shadows.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(182, 213, 255, 0.16)',
    marginBottom: spacing[3],
  },
  heroEyebrow: {
    color: '#B6D5FF',
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
    color: '#DDEBFF',
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
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletTransferReviewScreen;

