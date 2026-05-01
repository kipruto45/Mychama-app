import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberWalletService, type MemberWalletWithdrawalFlow } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import { getWalletWithdrawalStateMeta } from './memberWalletWorkflowShared';

type WalletWithdrawalDetailNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletWithdrawalDetail'
>;
type WalletWithdrawalDetailRouteProp = RouteProp<MainStackParamList, 'WalletWithdrawalDetail'>;

export const WalletWithdrawalDetailScreen: React.FC = () => {
  const navigation = useNavigation<WalletWithdrawalDetailNavigationProp>();
  const route = useRoute<WalletWithdrawalDetailRouteProp>();
  const { setLastVisitedScreen } = useMemberWalletFlowStore();
  const [detail, setDetail] = useState<MemberWalletWithdrawalFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async (manual = false) => {
    if (!route.params?.chamaId) {
      setLoading(false);
      return;
    }
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await memberWalletService.getWithdrawalDetail(
        route.params.chamaId,
        route.params.intentId
      );
      setDetail(response);
      setError(null);
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t load this transaction.');
      setDetail(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedScreen('WalletWithdrawalDetail');
    void loadDetail();
  }, [route.params?.chamaId, route.params?.intentId, setLastVisitedScreen]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdrawal Detail" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading this withdrawal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail || !route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdrawal Detail" showBack />
        <EmptyState
          title="We couldn’t load this transaction."
          description="Return to your wallet and try again."
          icon="alert-circle-outline"
          action={{
            label: 'Back to Wallet',
            onPress: () =>
              navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: route.params?.chamaId }),
          }}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  const meta = getWalletWithdrawalStateMeta(detail.state);
  const transaction = detail.transaction;

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Withdrawal Detail" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDetail(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Withdrawal amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(transaction.amount, transaction.currency)}</Text>
          <View style={styles.stateRow}>
            <Badge label={meta.chipLabel} variant={meta.chipVariant} />
            <View style={[styles.stateIcon, { backgroundColor: `${meta.tint}14` }]}>
              <Icon name={meta.icon as any} size={18} color={meta.tint} />
            </View>
          </View>
        </Card>

        <Card style={styles.detailCard}>
          {[
            ['Reference number', transaction.reference],
            ['Request date', formatDateTime(transaction.date)],
            ['Status', transaction.statusLabel],
            ['Method', transaction.paymentMethod || 'M-Pesa'],
            ['Fee', formatCurrency('0.00', transaction.currency)],
            ['Explanation', transaction.explanation || meta.description],
          ].map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </Card>

        {detail.state === 'approved_completed' ? (
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Updated wallet balance</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(
                detail.walletSnapshot.availableBalance,
                detail.walletSnapshot.currency
              )}
            </Text>
          </Card>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actions}>
          {['submitted', 'pending_processing'].includes(detail.state) ? (
            <Button
              title={refreshing ? 'Refreshing…' : 'Refresh Status'}
              onPress={() => void loadDetail(true)}
              disabled={refreshing}
            />
          ) : null}
          <Button
            title="View Transactions"
            variant="outline"
            onPress={() => navigation.navigate('PaymentHistory', { chamaId: route.params.chamaId, filter: 'withdrawals' })}
          />
          <Button
            title="Back to Wallet"
            variant="ghost"
            onPress={() =>
              navigateToWorkspaceTab(navigation as any, 'Payments', {
                chamaId: route.params.chamaId,
                entryPoint: 'wallet',
              })
            }
          />
        </View>
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
  centerText: {
    marginTop: spacing[4],
    textAlign: 'center',
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  amountCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.md,
  },
  amountLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  amountValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
  },
  stateRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
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
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#F3FBF6',
  },
  balanceLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
  },
  balanceValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
  },
  actions: {
    gap: spacing[3],
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletWithdrawalDetailScreen;
