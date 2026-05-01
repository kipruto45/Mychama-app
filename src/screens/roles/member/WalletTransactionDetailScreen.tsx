import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModernHeader } from '@/components/ui/ModernHeader';
import { useActiveChama } from '@/hooks';
import { MainStackParamList } from '@/navigation/types';
import { navigateToWorkspaceTab } from '@/navigation/workspaceTabNavigation';
import { memberWalletService, type MemberWalletTransactionDetail } from '@/services/memberWalletService';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import {
  getWalletActivityIcon,
  getWalletActivityTypeSupportingText,
  getWalletTransactionStateMeta,
  resolveWalletLinkedTarget,
} from './memberWalletWorkflowShared';
import { resolveWalletReceiptTarget } from './memberWalletWorkflowRouting';

type WalletTransactionNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'WalletTransactionDetail'
>;
type WalletTransactionRouteProp = RouteProp<MainStackParamList, 'WalletTransactionDetail'>;

const safeAmount = (value?: string | null) => Number(value || 0);

export const WalletTransactionDetailScreen: React.FC = () => {
  const navigation = useNavigation<WalletTransactionNavigationProp>();
  const route = useRoute<WalletTransactionRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    setLastOpenedTransactionId,
    setLastVisitedScreen,
    setPendingTransactionReference,
  } = useMemberWalletFlowStore();

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const transactionId = route.params.transactionId;

  const [detail, setDetail] = useState<MemberWalletTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedScreen('WalletTransactionDetail');
    setLastOpenedTransactionId(transactionId);
  }, [setLastOpenedTransactionId, setLastVisitedScreen, transactionId]);

  const loadDetail = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
        setDetail(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await memberWalletService.getTransactionDetail(chamaId, transactionId);
        setDetail(response);
        setError(null);
        if (response.transaction.status === 'pending') {
          setPendingTransactionReference(response.transaction.transactionId);
        }
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
    },
    [chamaId, setPendingTransactionReference, transactionId]
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const transaction = detail?.transaction || null;
  const stateMeta = getWalletTransactionStateMeta(transaction?.status || 'pending');
  const linkedTarget = transaction
    ? resolveWalletLinkedTarget({
        chamaId,
        contributionId: transaction.contributionId,
        loanId: transaction.loanId,
        penaltyId: transaction.penaltyId,
        type: transaction.type,
      })
    : null;
  const receiptTarget = transaction ? resolveWalletReceiptTarget({ ...transaction, chamaId }) : null;

  const refreshStatus = async () => {
    if (!transaction?.refreshSupported || !chamaId) {
      return;
    }

    setRefreshingStatus(true);
    try {
      const response = await memberWalletService.refreshTransactionStatus(chamaId, transaction.transactionId);
      setDetail(response);
      setError(null);
      if (response.transaction.status !== 'pending') {
        setPendingTransactionReference(null);
      }
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'We couldn’t refresh this payment status right now.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const openRetryFlow = useCallback(() => {
    if (!transaction || !chamaId) {
      return;
    }

    if (transaction.type === 'loan_repayment') {
      if (safeAmount(transaction.amount) > 0 && transaction.loanId) {
        navigation.navigate('PaymentMethod', {
          chamaId,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentPurposeType: 'loan_repayment',
          paymentPurposeLabel: transaction.purposeLabel,
          purpose: 'loan_repayment',
          loanId: transaction.loanId || undefined,
          installmentId: transaction.installmentId || undefined,
          targetLabel: transaction.targetLabel || undefined,
          sourceRoute: 'WalletTransactionDetail',
        });
        return;
      }

      navigation.navigate('MemberLoans', { chamaId });
      return;
    }

    if (transaction.type === 'contribution_payment' || transaction.type === 'fine_payment') {
      navigation.navigate('MakeContribution', {
        chamaId,
        contributionId: transaction.contributionId || undefined,
        contributionTypeId: transaction.contributionTypeId || undefined,
        contributionTypeName: transaction.contributionTypeName || undefined,
        prefilledAmount: transaction.amount,
        mode: transaction.type === 'fine_payment' ? 'penalty' : 'contribution',
        penaltyId: transaction.penaltyId || undefined,
      });
      return;
    }

    navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId, entryPoint: 'wallet' });
  }, [chamaId, navigation, transaction]);

  const summaryRows = useMemo(
    () =>
      transaction
        ? [
            { label: 'Transaction type', value: transaction.typeLabel },
            { label: 'Reference number', value: transaction.reference },
            { label: 'Date and time', value: formatDateTime(transaction.date) },
            { label: 'Status', value: transaction.statusLabel },
            {
              label: 'Direction',
              value: transaction.direction === 'inflow' ? 'Inflow' : 'Outflow',
            },
            { label: 'Purpose', value: transaction.purposeLabel },
            { label: 'Payment method', value: transaction.paymentMethod || 'Wallet entry' },
            {
              label: 'Receipt number',
              value: transaction.receiptNumber || 'Not available yet',
            },
          ]
        : [],
    [transaction]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Transaction Details" subtitle={activeChama?.name} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading this transaction…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Transaction Details" subtitle={activeChama?.name} showBack />
        <EmptyState
          title="We couldn’t load this transaction."
          description="Return to your wallet activity and try again."
          icon="receipt-text-remove-outline"
          action={{ label: 'Back to Wallet', onPress: () => navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId }) }}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Transaction Details" subtitle={activeChama?.name} showBack />
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
          <View style={styles.heroHeader}>
            <View style={[styles.heroIcon, { backgroundColor: `${stateMeta.tint}14` }]}>
              <Icon
                name={getWalletActivityIcon(transaction.type, transaction.direction) as any}
                size={24}
                color={stateMeta.tint}
              />
            </View>
            <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
          </View>

          <Text
            style={[
              styles.heroAmount,
              transaction.direction === 'inflow' ? styles.inflowAmount : styles.outflowAmount,
            ]}
          >
            {transaction.direction === 'inflow' ? '+' : '-'}
            {formatCurrency(transaction.amount, transaction.currency)}
          </Text>
          <Text style={styles.heroTitle}>{transaction.purposeLabel}</Text>
          <Text style={styles.heroSubtitle}>
            {getWalletActivityTypeSupportingText(transaction.type)} • {formatDateTime(transaction.date)}
          </Text>
        </Card>

        {transaction.status === 'pending' || transaction.status === 'failed' || transaction.status === 'cancelled' ? (
          <Card style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <View style={styles.noticeIcon}>
                <Icon
                  name={transaction.status === 'pending' ? 'progress-clock' : 'alert-circle-outline'}
                  size={20}
                  color={transaction.status === 'pending' ? colors.warning : colors.error}
                />
              </View>
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>
                  {transaction.status === 'pending'
                    ? 'This payment is still being confirmed.'
                    : 'This transaction did not complete successfully.'}
                </Text>
                <Text style={styles.noticeText}>
                  {transaction.explanation ||
                    (transaction.status === 'pending'
                      ? 'Check again shortly or refresh the status.'
                      : 'You can retry the payment when you are ready.')}
                </Text>
              </View>
            </View>
            <View style={styles.noticeActions}>
              {transaction.refreshSupported ? (
                <Button
                  title={refreshingStatus ? 'Refreshing…' : 'Refresh Status'}
                  variant="outline"
                  onPress={() => void refreshStatus()}
                  loading={refreshingStatus}
                  style={styles.noticeAction}
                />
              ) : null}
              {transaction.status === 'failed' || transaction.status === 'cancelled' ? (
                <Button
                  title="Retry Payment"
                  onPress={openRetryFlow}
                  style={styles.noticeAction}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Payment details</Text>
          {summaryRows.map((row) => (
            <View key={row.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          {receiptTarget ? (
            <Button
              title="Open Receipt"
              onPress={() => (navigation as any).navigate(receiptTarget.screen, receiptTarget.params)}
            />
          ) : (
            <Button
              title="Receipt Not Ready"
              variant="outline"
              onPress={() => void loadDetail(true)}
            />
          )}
          {linkedTarget ? (
            <Button
              title={transaction.loanId ? 'Open Linked Loan' : transaction.penaltyId ? 'Open Fine Details' : 'Open Linked Contribution'}
              variant="outline"
              onPress={() => (navigation as any).navigate(linkedTarget.screen, linkedTarget.params)}
            />
          ) : null}
          {(transaction.type === 'contribution_payment' || transaction.type === 'fine_payment') ? (
            <Button title="Make Contribution" variant="ghost" onPress={openRetryFlow} />
          ) : null}
          {transaction.type === 'loan_repayment' ? (
            <Button title="Repay Loan" variant="ghost" onPress={openRetryFlow} />
          ) : null}
        </Card>

        <Card style={styles.navigationCard}>
          <TouchableOpacity
            style={styles.navigationRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PaymentHistory', { chamaId })}
          >
            <Text style={styles.navigationTitle}>Back to wallet activity</Text>
            <Icon name="chevron-right" size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navigationRow, styles.navigationRowLast]}
            activeOpacity={0.85}
            onPress={() => navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId, entryPoint: 'wallet' })}
          >
            <Text style={styles.navigationTitle}>Back to wallet overview</Text>
            <Icon name="chevron-right" size={20} color={colors.neutral[500]} />
          </TouchableOpacity>
        </Card>

        {error ? (
          <Text style={styles.footerError}>{error}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
  },
  heroCard: {
    gap: spacing[2],
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    letterSpacing: -0.8,
  },
  inflowAmount: {
    color: colors.success,
  },
  outflowAmount: {
    color: colors.neutral[900],
  },
  heroTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  heroSubtitle: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  noticeCard: {
    gap: spacing[3],
    backgroundColor: colors.warning + '08',
    borderWidth: 1,
    borderColor: colors.warning + '26',
  },
  noticeHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCopy: {
    flex: 1,
    gap: spacing[1],
  },
  noticeTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  noticeText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  noticeActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  noticeAction: {
    flex: 1,
  },
  detailCard: {
    gap: spacing[1],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing[2],
  },
  detailRow: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing[1],
  },
  detailLabel: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  actionsCard: {
    gap: spacing[3],
  },
  navigationCard: {
    paddingVertical: 0,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  navigationRowLast: {
    borderBottomWidth: 0,
  },
  navigationTitle: {
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  footerError: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});

export default WalletTransactionDetailScreen;
