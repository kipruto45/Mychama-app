import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberWalletService, type MemberWalletDepositFlow } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import { getWalletDepositStateMeta } from './memberWalletWorkflowShared';

type WalletDepositStatusNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletDepositStatus'
>;
type WalletDepositStatusRouteProp = RouteProp<MainStackParamList, 'WalletDepositStatus'>;

export const WalletDepositStatusScreen: React.FC = () => {
  const navigation = useNavigation<WalletDepositStatusNavigationProp>();
  const route = useRoute<WalletDepositStatusRouteProp>();
  const {
    clearDepositDraft,
    setLastVisitedScreen,
    setPendingDepositIntentId,
  } = useMemberWalletFlowStore();

  const [detail, setDetail] = useState<MemberWalletDepositFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshAttempted = useRef(false);

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
      const response = await memberWalletService.getDepositDetail(
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

  const refreshStatus = async () => {
    if (!route.params?.chamaId) {
      return;
    }
    setRefreshing(true);
    try {
      const response = await memberWalletService.refreshDeposit(
        route.params.chamaId,
        route.params.intentId
      );
      setDetail(response);
      setError(null);
    } catch {
      setError('We couldn’t refresh this payment status right now.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLastVisitedScreen('WalletDepositStatus');
    void loadDetail();
  }, [route.params?.chamaId, route.params?.intentId, setLastVisitedScreen]);

  useEffect(() => {
    if (!detail) {
      return;
    }
    if (detail.state === 'success') {
      clearDepositDraft();
      setPendingDepositIntentId(null);
    } else if (['initiated', 'processing', 'pending'].includes(detail.state)) {
      setPendingDepositIntentId(detail.intentId);
      if (!autoRefreshAttempted.current) {
        autoRefreshAttempted.current = true;
        void refreshStatus();
      }
    }
  }, [clearDepositDraft, detail, setPendingDepositIntentId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Deposit Status" showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Checking your deposit…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail || !route.params?.chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Deposit Status" showBack />
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

  const meta = getWalletDepositStateMeta(detail.state);
  const transaction = detail.transaction;
  const instructions = detail.instructions;

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Deposit Status" showBack />
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
            <Text style={styles.label}>Deposited amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(transaction.amount, transaction.currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>{transaction.paymentMethod || 'M-Pesa'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference number</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date and time</Text>
            <Text style={styles.value}>{formatDateTime(transaction.date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Wallet destination</Text>
            <Text style={styles.value}>My wallet</Text>
          </View>
        </Card>

        {instructions?.type === 'bank_transfer' ? (
          <Card style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Icon name="bank-outline" size={20} color={colors.primary[600]} />
              <Text style={styles.instructionsTitle}>Bank transfer instructions</Text>
            </View>
            <Text style={styles.instructionsText}>
              Transfer {formatCurrency(transaction.amount, transaction.currency)} to the account below and use the
              reference code so we can match your deposit.
            </Text>

            {[
              { label: 'Bank', value: instructions.bank_name },
              { label: 'Account name', value: instructions.account_name },
              { label: 'Account number', value: instructions.account_number },
              { label: 'Reference code', value: instructions.transfer_reference },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <View key={row.label} style={styles.instructionsRow}>
                  <View style={styles.instructionsRowCopy}>
                    <Text style={styles.instructionsRowLabel}>{row.label}</Text>
                    <Text style={styles.instructionsRowValue}>{String(row.value)}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.copyButton}
                    onPress={() => void Clipboard.setStringAsync(String(row.value))}
                  >
                    <Icon name="content-copy" size={16} color={colors.primary[700]} />
                  </TouchableOpacity>
                </View>
              ))}
          </Card>
        ) : null}

        {detail.state === 'success' ? (
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
          {transaction.receiptAvailable && transaction.receiptReady ? (
            <Button
              title="View Receipt"
              onPress={() =>
                navigation.navigate('Receipt', {
                  intentId: detail.intentId,
                  chamaId: route.params.chamaId,
                  paymentPurposeType: 'wallet_deposit',
                  paymentPurposeLabel: 'Deposit to Wallet',
                  targetLabel: 'My wallet',
                })
              }
            />
          ) : null}
          {['initiated', 'processing', 'pending'].includes(detail.state) ? (
            <Button
              title={refreshing ? 'Refreshing…' : 'Refresh Status'}
              variant="outline"
              onPress={() => void refreshStatus()}
              disabled={refreshing}
            />
          ) : null}
          {['failed', 'cancelled'].includes(detail.state) ? (
            <Button
              title="Retry Deposit"
              variant="outline"
              onPress={() =>
                navigation.replace('WalletDeposit', {
                  chamaId: route.params.chamaId,
                  entryPoint: 'wallet',
                })
              }
            />
          ) : null}
          <Button
            title="View Transactions"
            variant="outline"
            onPress={() => navigation.navigate('PaymentHistory', { chamaId: route.params.chamaId, filter: 'deposits' })}
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
  instructionsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  instructionsTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  instructionsText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  instructionsRowCopy: {
    flex: 1,
  },
  instructionsRowLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  instructionsRowValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    marginTop: 2,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

export default WalletDepositStatusScreen;
