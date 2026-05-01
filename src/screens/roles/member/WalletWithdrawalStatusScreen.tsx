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

type WalletWithdrawalStatusNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletWithdrawalStatus'
>;
type WalletWithdrawalStatusRouteProp = RouteProp<MainStackParamList, 'WalletWithdrawalStatus'>;

export const WalletWithdrawalStatusScreen: React.FC = () => {
  const navigation = useNavigation<WalletWithdrawalStatusNavigationProp>();
  const route = useRoute<WalletWithdrawalStatusRouteProp>();
  const {
    clearWithdrawalDraft,
    setLastVisitedScreen,
    setPendingWithdrawalIntentId,
  } = useMemberWalletFlowStore();

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
    setLastVisitedScreen('WalletWithdrawalStatus');
    void loadDetail();
  }, [route.params?.chamaId, route.params?.intentId, setLastVisitedScreen]);

  useEffect(() => {
    if (!detail) {
      return;
    }
    if (['approved_completed', 'failed', 'rejected', 'cancelled'].includes(detail.state)) {
      clearWithdrawalDraft();
      setPendingWithdrawalIntentId(null);
    } else {
      setPendingWithdrawalIntentId(detail.intentId);
    }
  }, [clearWithdrawalDraft, detail, setPendingWithdrawalIntentId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdrawal Status" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Checking your withdrawal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail || !route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Withdrawal Status" showBack />
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
      <ModernHeader title="Withdrawal Status" showBack />
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
        <Card style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: `${meta.tint}14` }]}>
            <Icon name={meta.icon as any} size={30} color={meta.tint} />
          </View>
          <Text style={styles.heroTitle}>{meta.title}</Text>
          <Text style={styles.heroText}>{transaction.explanation || meta.description}</Text>
          <Badge label={meta.chipLabel} variant={meta.chipVariant} />
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Withdrawal amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(transaction.amount, transaction.currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference number</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Request time</Text>
            <Text style={styles.value}>{formatDateTime(transaction.date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>{transaction.paymentMethod || 'M-Pesa'}</Text>
          </View>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button
            title="View Withdrawal Detail"
            onPress={() =>
              navigation.navigate('WalletWithdrawalDetail', {
                chamaId: route.params.chamaId,
                intentId: detail.intentId,
                source: 'wallet_withdrawal_status',
              })
            }
          />
          {['submitted', 'pending_processing'].includes(detail.state) ? (
            <Button
              title={refreshing ? 'Refreshing…' : 'Refresh Status'}
              variant="outline"
              onPress={() => void loadDetail(true)}
              disabled={refreshing}
            />
          ) : null}
          {['failed', 'rejected', 'cancelled'].includes(detail.state) ? (
            <Button
              title="Retry Withdrawal"
              variant="outline"
              onPress={() =>
                navigation.replace('WalletWithdraw', {
                  chamaId: route.params.chamaId,
                  entryPoint: 'wallet',
                })
              }
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
  heroCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    backgroundColor: '#FFFFFF',
    ...shadows.md,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  heroText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing[4],
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
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
  },
  amountValue: {
    color: colors.primary[700],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
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

export default WalletWithdrawalStatusScreen;
