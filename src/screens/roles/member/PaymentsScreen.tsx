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
import { memberWalletService, type MemberWalletActivityItem, type MemberWalletWorkspace } from '@/services/memberWalletService';
import { useMemberPaymentsFlowStore } from '@/store/memberPaymentsFlowStore';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { useMemberWalletFlowStore } from '@/store/memberWalletFlowStore';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

import {
  getWalletActivityIcon,
  getWalletActivityTypeSupportingText,
  getWalletBalanceStateMeta,
  getWalletTransactionStateMeta,
  resolveWalletLinkedTarget,
} from './memberWalletWorkflowShared';
import {
  resolveMemberWalletActivityTarget,
  resolveWalletReceiptTarget,
} from './memberWalletWorkflowRouting';
import {
  buildLoanRepaymentResumeParams,
  buildPendingLoanRepaymentParams,
  hasRestorableLoanRepaymentDraft,
} from './memberLoanRepaymentWorkflowShared';

type WalletNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Payments'>;
type WalletRouteProp = RouteProp<MainStackParamList, 'Payments'>;

const AUTO_FORWARD_ENTRY_POINTS = new Set(['loan_detail', 'contributions']);

const safeAmount = (value?: string | null) => Number(value || 0);

const buildEntryPointLabel = (entryPoint?: MainStackParamList['Payments'] extends infer T
  ? T extends undefined
    ? never
    : T extends { entryPoint?: infer E }
    ? E
    : never
  : never) => {
  switch (entryPoint) {
    case 'dashboard':
      return 'Opened from your dashboard';
    case 'more':
      return 'Opened from More';
    case 'notifications':
      return 'Opened from a wallet notification';
    case 'alerts':
      return 'Opened from alerts and reminders';
    case 'deep_link':
      return 'Opened from a secure deep link';
    case 'loan_detail':
      return 'Opened from your active loan';
    case 'contributions':
      return 'Opened from contributions';
    default:
      return null;
  }
};

export const PaymentsScreen: React.FC = () => {
  const navigation = useNavigation<WalletNavigationProp>();
  const route = useRoute<WalletRouteProp>();
  const { activeChama, activeChamaId } = useActiveChama();
  const {
    activePayment,
    draft: activeDraft,
  } = useMemberPaymentsFlowStore();
  const {
    pendingRepaymentIntentId,
    repaymentDraft,
  } = useMemberLoanFlowStore();
  const {
    pendingDepositIntentId,
    pendingWithdrawalIntentId,
    setActiveChamaId,
    setLastEntryPoint,
    setLastOpenedTransactionId,
    setLastVisitedScreen,
    setPendingDepositIntentId,
    setPendingTransactionReference,
    setPendingWithdrawalIntentId,
  } = useMemberWalletFlowStore();

  const [workspace, setWorkspace] = useState<MemberWalletWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoForwarded, setAutoForwarded] = useState(false);

  const chamaId = route.params?.chamaId || activeChamaId || undefined;
  const entryPointLabel = buildEntryPointLabel(route.params?.entryPoint);
  const currency = workspace?.currency || activeChama?.currency || 'KES';
  const balanceMeta = getWalletBalanceStateMeta(workspace?.balanceState || 'temporarily_unavailable');
  const contributionSummary = workspace?.linked?.contributions || {};
  const loanSummary = workspace?.linked?.loans || {};
  const promptPurpose = route.params?.preselectedPurpose || null;
  const activeLoanId = workspace?.summaryCards.activeLoanId || null;
  const nextLoanRepaymentAmount = workspace?.summaryCards.nextLoanRepaymentAmount || '0.00';
  const pendingWalletItem = workspace?.pendingActivity?.[0] || null;
  const contributionBalance = contributionSummary.remaining_amount || contributionSummary.current_cycle_amount || '0.00';
  const contributionDueDate = contributionSummary.next_due_date || route.params?.dueDate || undefined;
  const hasWalletActivity = Boolean(workspace?.recentActivity.length || workspace?.pendingActivity.length);

  useEffect(() => {
    setLastVisitedScreen('Payments');
    setActiveChamaId(chamaId || null);
    setLastEntryPoint(route.params?.entryPoint || 'tab');
  }, [chamaId, route.params?.entryPoint, setActiveChamaId, setLastEntryPoint, setLastVisitedScreen]);

  const loadWorkspace = useCallback(
    async (showRefresh = false) => {
      if (!chamaId) {
        setWorkspace(null);
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
        const response = await memberWalletService.getWorkspace(chamaId);
        setWorkspace(response);
        setError(null);
        setPendingTransactionReference(response.recovery.pendingTransactionReference || null);
        const pendingDeposit = response.pendingActivity.find((item) => item.type === 'wallet_deposit');
        const pendingWithdrawal = response.pendingActivity.find(
          (item) => item.type === 'wallet_withdrawal'
        );
        setPendingDepositIntentId(pendingDeposit?.intentId || null);
        setPendingWithdrawalIntentId(pendingWithdrawal?.intentId || null);
      } catch (serviceError) {
        const message =
          typeof serviceError === 'object' && serviceError && 'message' in serviceError
            ? String((serviceError as { message?: string }).message || '')
            : '';
        setError(message || 'We couldn’t load your wallet right now. Please try again.');
        setWorkspace(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [chamaId, setPendingDepositIntentId, setPendingTransactionReference, setPendingWithdrawalIntentId]
  );

  const openContributionFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }

    navigation.navigate('MakeContribution', {
      chamaId,
      prefilledAmount: safeAmount(contributionBalance) > 0 ? contributionBalance : undefined,
      dueDate: contributionDueDate,
      contributionId: route.params?.contributionId,
      contributionTypeId: route.params?.contributionTypeId,
      contributionTypeName: route.params?.contributionTypeName,
      mode: route.params?.penaltyId ? 'penalty' : 'contribution',
      penaltyId: route.params?.penaltyId,
    });
  }, [
    chamaId,
    contributionBalance,
    contributionDueDate,
    navigation,
    route.params?.contributionId,
    route.params?.contributionTypeId,
    route.params?.contributionTypeName,
    route.params?.penaltyId,
  ]);

  const openLoanRepaymentFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }

    const resumeParams = buildLoanRepaymentResumeParams({
      draft:
        hasRestorableLoanRepaymentDraft(repaymentDraft, chamaId) &&
        repaymentDraft?.sourceEntryPoint === 'wallet'
          ? repaymentDraft
          : null,
      fallbackLoanId: route.params?.loanId || activeLoanId,
      fallbackChamaId: chamaId,
      fallbackEntryPoint: 'wallet',
    });

    if (resumeParams) {
      navigation.navigate('LoanRepayment', resumeParams);
      return;
    }

    if (safeAmount(nextLoanRepaymentAmount) > 0 && activeLoanId) {
      navigation.navigate('LoanRepayment', {
        chamaId,
        loanId: route.params?.loanId || activeLoanId,
        installmentId: route.params?.installmentId,
        amount: route.params?.amount || nextLoanRepaymentAmount,
        dueDate: route.params?.dueDate || workspace?.summaryCards.nextLoanRepaymentDue || undefined,
        targetLabel: route.params?.targetLabel || 'Loan repayment',
        entryPoint: 'wallet',
      });
      return;
    }

    navigation.navigate('MemberLoans', { chamaId });
  }, [
    activeLoanId,
    chamaId,
    currency,
    navigation,
    nextLoanRepaymentAmount,
    repaymentDraft,
    route.params?.installmentId,
    route.params?.loanId,
    route.params?.amount,
    route.params?.dueDate,
    route.params?.targetLabel,
    workspace?.summaryCards.nextLoanRepaymentDue,
  ]);

  const openDepositFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }
    navigation.navigate('WalletDeposit', { chamaId, entryPoint: 'wallet' });
  }, [chamaId, navigation]);

  const openWithdrawalFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }
    navigation.navigate('WalletWithdraw', { chamaId, entryPoint: 'wallet' });
  }, [chamaId, navigation]);

  const openTransferFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }
    navigation.navigate('WalletTransfer', { chamaId, entryPoint: 'wallet' });
  }, [chamaId, navigation]);

  const openSendToChamaFlow = useCallback(() => {
    if (!chamaId) {
      return;
    }
    navigation.navigate('WalletSendToChama', { chamaId, entryPoint: 'wallet' });
  }, [chamaId, navigation]);

  const openTransaction = useCallback(
    (item: MemberWalletActivityItem, source: MainStackParamList['WalletTransactionDetail']['source'] = 'wallet_overview') => {
      setLastOpenedTransactionId(item.transactionId);
      const target = resolveMemberWalletActivityTarget(
        {
          transactionId: item.transactionId,
          type: item.type,
          intentId: item.intentId || undefined,
          chamaId,
        },
        source
      );
      (navigation as any).navigate(target.screen, target.params);
    },
    [chamaId, navigation, setLastOpenedTransactionId]
  );

  const openReceipt = useCallback(
    (item: MemberWalletActivityItem) => {
      const target = resolveWalletReceiptTarget({ ...item, chamaId });
      if (target) {
        (navigation as any).navigate(target.screen, target.params);
      }
    },
    [chamaId, navigation]
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!chamaId || !promptPurpose || autoForwarded || !AUTO_FORWARD_ENTRY_POINTS.has(route.params?.entryPoint || '')) {
      return;
    }

    setAutoForwarded(true);
    if (promptPurpose === 'loan_repayment') {
      openLoanRepaymentFlow();
      return;
    }

    openContributionFlow();
  }, [
    autoForwarded,
    chamaId,
    openContributionFlow,
    openLoanRepaymentFlow,
    promptPurpose,
    route.params?.entryPoint,
  ]);

  const highlightedPrompt = useMemo(() => {
    if (!promptPurpose) {
      return null;
    }

    if (promptPurpose === 'loan_repayment') {
      return {
        title: 'Ready to continue with your loan repayment?',
        message: route.params?.amount
          ? `You can repay ${formatCurrency(route.params.amount, currency)} from here.`
          : 'Open your next repayment securely from your wallet.',
        actionLabel: 'Repay Loan',
        action: openLoanRepaymentFlow,
      };
    }

    return {
      title: 'Ready to continue with your contribution?',
      message: route.params?.amount
        ? `You can contribute ${formatCurrency(route.params.amount, currency)} from here.`
        : 'Open your contribution flow from your wallet.',
      actionLabel: route.params?.penaltyId ? 'Pay Fine' : 'Make Contribution',
      action: openContributionFlow,
    };
  }, [currency, openContributionFlow, openLoanRepaymentFlow, promptPurpose, route.params?.amount, route.params?.penaltyId]);

  const linkedContributionTarget = resolveWalletLinkedTarget({
    chamaId,
    contributionId: route.params?.contributionId,
    type: 'contribution_payment',
  });
  const linkedLoanTarget = resolveWalletLinkedTarget({
    chamaId,
    loanId: activeLoanId || route.params?.loanId,
    type: 'loan_repayment',
  });

  const recoveryAction = useMemo(() => {
    if (pendingDepositIntentId) {
      return {
        label: 'Resume pending deposit',
        onPress: () =>
          navigation.navigate('WalletDepositStatus', {
            chamaId,
            intentId: pendingDepositIntentId,
            source: 'wallet_activity',
          }),
      };
    }

    if (pendingWithdrawalIntentId) {
      return {
        label: 'Resume pending withdrawal',
        onPress: () =>
          navigation.navigate('WalletWithdrawalDetail', {
            chamaId,
            intentId: pendingWithdrawalIntentId,
            source: 'wallet_overview',
          }),
      };
    }

    if (pendingWalletItem) {
      return {
        label: 'Review pending payment',
        onPress: () => openTransaction(pendingWalletItem),
      };
    }

    if (
      pendingRepaymentIntentId &&
      activeLoanId
    ) {
      const pendingRepaymentParams = buildPendingLoanRepaymentParams({
        intentId: pendingRepaymentIntentId,
        chamaId,
        loanId: repaymentDraft?.loanId || activeLoanId,
        installmentId: repaymentDraft?.installmentId || route.params?.installmentId,
        amount:
          repaymentDraft?.amount ||
          route.params?.amount ||
          nextLoanRepaymentAmount ||
          workspace?.summaryCards.activeLoanOutstanding,
        currency,
        targetLabel: repaymentDraft?.targetLabel || route.params?.targetLabel,
        paymentMethod: repaymentDraft?.paymentMethod || 'mpesa',
      });

      if (pendingRepaymentParams) {
        return {
          label: 'Resume pending repayment',
          onPress: () => navigation.navigate('PendingPaymentDetail', pendingRepaymentParams),
        };
      }
    }

    if (
      activePayment &&
      ['initiated', 'pending', 'pending_authentication', 'pending_verification'].includes(
        activePayment.status
      )
    ) {
      return {
        label: 'Resume pending payment',
        onPress: () =>
          navigation.navigate('PendingPaymentDetail', {
            intentId: activePayment.intentId,
            chamaId: activePayment.chamaId,
            amount: activePayment.amount,
            currency: activePayment.currency,
            purpose: activePayment.paymentPurposeType,
            paymentPurposeType: activePayment.paymentPurposeType,
            paymentPurposeLabel: activePayment.paymentPurposeLabel,
            contributionId: activePayment.contributionId || undefined,
            loanId: activePayment.loanId || undefined,
            installmentId: activePayment.installmentId || undefined,
            penaltyId: activePayment.penaltyId || undefined,
            targetLabel: activePayment.targetLabel || undefined,
            paymentMethod: activePayment.paymentMethod,
          }),
      };
    }

    if (
      hasRestorableLoanRepaymentDraft(repaymentDraft, chamaId)
    ) {
      return {
        label: 'Resume repayment draft',
        onPress: openLoanRepaymentFlow,
      };
    }

    if (
      activeDraft?.chamaId === chamaId &&
      activeDraft?.amount &&
      (activeDraft?.paymentPurposeType === 'loan_repayment' || activeDraft?.contributionTypeId || activeDraft?.penaltyId)
    ) {
      const draftToResume = activeDraft;
      return {
        label: 'Resume interrupted payment',
        onPress: () => {
          if (draftToResume?.paymentPurposeType === 'loan_repayment') {
            openLoanRepaymentFlow();
            return;
          }
          openContributionFlow();
        },
      };
    }

    return null;
  }, [
    activeDraft,
    activePayment,
    activeLoanId,
    chamaId,
    currency,
    navigation,
    openContributionFlow,
    openLoanRepaymentFlow,
    openTransaction,
    pendingRepaymentIntentId,
    pendingDepositIntentId,
    pendingWalletItem,
    pendingWithdrawalIntentId,
    repaymentDraft,
    route.params?.amount,
    route.params?.installmentId,
    route.params?.targetLabel,
    nextLoanRepaymentAmount,
    workspace?.summaryCards.activeLoanOutstanding,
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Wallet" subtitle={activeChama?.name} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>Loading your wallet…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chamaId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Wallet" />
        <EmptyState
          title="No chama selected"
          description="Choose a chama first so we can load your wallet."
          icon="wallet-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  if (error && !workspace) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title="Wallet" subtitle={activeChama?.name} />
        <EmptyState
          title="We couldn’t load your wallet right now. Please try again."
          description="Your balance, activity, and linked payments will appear here once the connection is restored."
          icon="cloud-alert-outline"
          action={{ label: 'Try Again', onPress: () => void loadWorkspace() }}
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title="Wallet" subtitle={activeChama?.name} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadWorkspace(true)}
            tintColor={colors.primary[500]}
          />
        }
      >
        {entryPointLabel ? (
          <Card style={styles.entryCard}>
            <Icon name="compass-outline" size={18} color={colors.primary[600]} />
            <Text style={styles.entryText}>{entryPointLabel}</Text>
          </Card>
        ) : null}

        {highlightedPrompt ? (
          <Card style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <View style={styles.promptIcon}>
                <Icon
                  name={promptPurpose === 'loan_repayment' ? 'bank-check' : 'cash-plus'}
                  size={22}
                  color={colors.success}
                />
              </View>
              <View style={styles.promptCopy}>
                <Text style={styles.promptTitle}>{highlightedPrompt.title}</Text>
                <Text style={styles.promptText}>{highlightedPrompt.message}</Text>
              </View>
            </View>
            <Button title={highlightedPrompt.actionLabel} onPress={highlightedPrompt.action} />
          </Card>
        ) : null}

        <Card style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(workspace?.availableBalance || '0.00', currency)}
              </Text>
              <Text style={styles.balanceCaption}>{balanceMeta.title}</Text>
            </View>
            <View style={[styles.balanceBadge, { backgroundColor: `${balanceMeta.tint}16` }]}>
              <Icon name={balanceMeta.icon as any} size={24} color={balanceMeta.tint} />
            </View>
          </View>

          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Pending</Text>
              <Text style={styles.balanceStatValue}>
                {formatCurrency(workspace?.pendingBalance || '0.00', currency)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Withdrawable</Text>
              <Text style={styles.balanceStatValue}>
                {formatCurrency(workspace?.withdrawableBalance || '0.00', currency)}
              </Text>
            </View>
          </View>

          <Text style={styles.balanceDescription}>
            {balanceMeta.description}{' '}
            {workspace?.lastUpdated ? `Last updated ${formatDateTime(workspace.lastUpdated)}.` : ''}
          </Text>
        </Card>

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total inflows</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(workspace?.totalInflows || '0.00', currency)}
            </Text>
            <Text style={styles.summaryFootnote}>Money received into your wallet</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total outflows</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(workspace?.totalOutflows || '0.00', currency)}
            </Text>
            <Text style={styles.summaryFootnote}>Contributions, repayments, and deductions</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Recent contributions</Text>
            <Text style={styles.summaryValue}>
              {workspace?.summaryCards.recentContributionPaymentsCount || 0}
            </Text>
            <Text style={styles.summaryFootnote}>
              {formatCurrency(
                workspace?.summaryCards.recentContributionPaymentsTotal || '0.00',
                currency
              )}{' '}
              paid recently
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Loan outstanding</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(workspace?.summaryCards.activeLoanOutstanding || '0.00', currency)}
            </Text>
            <Text style={styles.summaryFootnote}>
              {workspace?.summaryCards.nextLoanRepaymentDue
                ? `Next due ${formatDate(workspace.summaryCards.nextLoanRepaymentDue)}`
                : 'No active repayment due right now'}
            </Text>
          </Card>
        </View>

        <Card style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsRow}>
            <Button title="Deposit" onPress={openDepositFlow} style={styles.primaryAction} />
            <Button
              title="Withdraw"
              variant="outline"
              onPress={openWithdrawalFlow}
              style={styles.secondaryAction}
              disabled={Number(workspace?.withdrawableBalance || 0) <= 0}
            />
          </View>
          <View style={styles.actionsRow}>
            <Button
              title="Transfer"
              variant="outline"
              onPress={openTransferFlow}
              style={styles.secondaryAction}
              disabled={Number(workspace?.withdrawableBalance || 0) <= 0}
            />
            <Button
              title="Send to Chama"
              variant="outline"
              onPress={openSendToChamaFlow}
              style={styles.secondaryAction}
              disabled={Number(workspace?.withdrawableBalance || 0) <= 0}
            />
          </View>
          <Button
            title="View Transactions"
            variant="ghost"
            onPress={() => navigation.navigate('PaymentHistory', { chamaId })}
            style={styles.fullAction}
          />
        </Card>

        {(pendingWalletItem || recoveryAction) && (
          <Card style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <View style={styles.pendingLead}>
                <View style={styles.pendingIcon}>
                  <Icon name="progress-clock" size={22} color={colors.warning} />
                </View>
              <View style={styles.pendingCopy}>
                <Text style={styles.pendingTitle}>Pending wallet activity</Text>
                <Text style={styles.pendingText}>
                    {pendingWalletItem?.explanation || 'This transaction is still being processed.'}
                </Text>
              </View>
            </View>
            <Badge label="Pending" variant="warning" size="sm" />
          </View>
            {pendingWalletItem ? (
              <View style={styles.pendingMetaRow}>
                <Text style={styles.pendingMetaLabel}>
                  {pendingWalletItem.purposeLabel} • {formatCurrency(pendingWalletItem.amount, currency)}
                </Text>
                <Text style={styles.pendingMetaValue}>Ref {pendingWalletItem.reference}</Text>
              </View>
            ) : null}
            {recoveryAction ? (
              <Button title={recoveryAction.label} variant="outline" onPress={recoveryAction.onPress} />
            ) : null}
          </Card>
        )}

        <Card style={styles.linkedCard}>
          <View style={styles.linkedHeader}>
            <Text style={styles.sectionTitle}>Linked finances</Text>
            <Text style={styles.linkedHeaderText}>Understand how your wallet relates to obligations</Text>
          </View>
          <View style={styles.linkedGrid}>
            <TouchableOpacity
              activeOpacity={0.87}
              style={styles.linkedTile}
              onPress={() => {
                if (linkedContributionTarget) {
                  (navigation as any).navigate(linkedContributionTarget.screen, linkedContributionTarget.params);
                  return;
                }
                openContributionFlow();
              }}
            >
              <View style={[styles.linkedTileIcon, { backgroundColor: `${colors.success}14` }]}>
                <Icon name="calendar-check-outline" size={20} color={colors.success} />
              </View>
              <Text style={styles.linkedTileTitle}>Contributions</Text>
              <Text style={styles.linkedTileValue}>
                {formatCurrency(contributionSummary.remaining_amount || '0.00', currency)}
              </Text>
              <Text style={styles.linkedTileMeta}>
                {contributionSummary.next_due_date
                  ? `Next due ${formatDate(contributionSummary.next_due_date)}`
                  : 'Open contribution details'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.87}
              style={styles.linkedTile}
              onPress={() => {
                if (linkedLoanTarget) {
                  (navigation as any).navigate(linkedLoanTarget.screen, linkedLoanTarget.params);
                  return;
                }
                navigation.navigate('MemberLoans', { chamaId });
              }}
            >
              <View style={[styles.linkedTileIcon, { backgroundColor: `${colors.primary[500]}14` }]}>
                <Icon name="bank-check" size={20} color={colors.primary[500]} />
              </View>
              <Text style={styles.linkedTileTitle}>Loans</Text>
              <Text style={styles.linkedTileValue}>
                {formatCurrency(workspace?.summaryCards.activeLoanOutstanding || '0.00', currency)}
              </Text>
              <Text style={styles.linkedTileMeta}>
                {workspace?.summaryCards.nextLoanRepaymentDue
                  ? `Repay by ${formatDate(workspace.summaryCards.nextLoanRepaymentDue)}`
                  : 'Open loan details'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.healthCard}>
          <View style={styles.healthIcon}>
            <Icon
              name={
                workspace?.financialHealth.tone === 'attention'
                  ? 'shield-alert-outline'
                  : workspace?.financialHealth.tone === 'positive'
                  ? 'shield-check-outline'
                  : 'information-outline'
              }
              size={20}
              color={
                workspace?.financialHealth.tone === 'attention'
                  ? colors.warning
                  : workspace?.financialHealth.tone === 'positive'
                  ? colors.success
                  : colors.info
              }
            />
          </View>
          <View style={styles.healthCopy}>
            <Text style={styles.healthTitle}>{workspace?.financialHealth.title}</Text>
            <Text style={styles.healthText}>{workspace?.financialHealth.message}</Text>
          </View>
        </Card>

        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent wallet activity</Text>
            <Text style={styles.activityHeaderText}>View the details for this transaction.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('PaymentHistory', { chamaId })}>
            <Text style={styles.activityLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {!hasWalletActivity ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="wallet-outline"
              title={workspace?.emptyState.title || 'No wallet activity yet.'}
              description={workspace?.emptyState.description}
              action={{ label: workspace?.emptyState.actionLabel || 'Make Contribution', onPress: openContributionFlow }}
            />
          </Card>
        ) : (
          <View style={styles.activityList}>
            {(workspace?.recentActivity || []).map((item) => {
              const stateMeta = getWalletTransactionStateMeta(item.status);
              const linkedTarget = resolveWalletLinkedTarget({
                chamaId,
                contributionId: item.contributionId,
                loanId: item.loanId,
                penaltyId: item.penaltyId,
                type: item.type,
              });

              return (
                <TouchableOpacity
                  key={item.transactionId}
                  activeOpacity={0.9}
                  onPress={() => openTransaction(item)}
                >
                  <Card style={styles.activityCard}>
                    <View style={styles.activityLead}>
                      <View
                        style={[
                          styles.activityIcon,
                          { backgroundColor: `${stateMeta.tint}14` },
                        ]}
                      >
                        <Icon
                          name={getWalletActivityIcon(item.type, item.direction) as any}
                          size={20}
                          color={stateMeta.tint}
                        />
                      </View>
                      <View style={styles.activityCopy}>
                        <Text style={styles.activityTitle}>{item.purposeLabel}</Text>
                        <Text style={styles.activityMeta}>
                          {getWalletActivityTypeSupportingText(item.type)} • {formatDateTime(item.date)}
                        </Text>
                        <Text style={styles.activityReference}>Ref {item.reference}</Text>
                      </View>
                    </View>
                    <View style={styles.activityAside}>
                      <Text
                        style={[
                          styles.activityAmount,
                          item.direction === 'inflow' ? styles.inflowAmount : styles.outflowAmount,
                        ]}
                      >
                        {item.direction === 'inflow' ? '+' : '-'}
                        {formatCurrency(item.amount, item.currency)}
                      </Text>
                      <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
                    </View>
                    <View style={styles.activityActions}>
                      {item.receiptAvailable && item.receiptReady ? (
                        <TouchableOpacity activeOpacity={0.8} onPress={() => openReceipt(item)}>
                          <Text style={styles.inlineAction}>Receipt</Text>
                        </TouchableOpacity>
                      ) : null}
                      {linkedTarget ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => (navigation as any).navigate(linkedTarget.screen, linkedTarget.params)}
                        >
                          <Text style={styles.inlineAction}>
                            {item.loanId ? 'Loan details' : item.penaltyId ? 'Fine details' : 'Contribution details'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
  },
  entryText: {
    flex: 1,
    color: colors.primary[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  promptCard: {
    backgroundColor: colors.light.card,
    gap: spacing[4],
  },
  promptHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.success}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCopy: {
    flex: 1,
    gap: spacing[1],
  },
  promptTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  promptText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  balanceCard: {
    backgroundColor: colors.success + '12',
    borderWidth: 1,
    borderColor: colors.success + '20',
    ...shadows.md,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  balanceLabel: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  balanceValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    letterSpacing: -0.8,
  },
  balanceCaption: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  balanceBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  balanceStat: {
    flex: 1,
    gap: spacing[1],
  },
  balanceStatLabel: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceStatValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  balanceStatValueSmall: {
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  balanceDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.success + '28',
    marginHorizontal: spacing[4],
  },
  balanceDescription: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  summaryCard: {
    width: '47.8%',
    minHeight: 130,
  },
  summaryLabel: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    marginTop: spacing[2],
  },
  summaryFootnote: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: spacing[2],
  },
  actionsCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    flex: 1,
  },
  fullAction: {
    alignSelf: 'stretch',
  },
  pendingCard: {
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.warning + '28',
    backgroundColor: colors.warning + '08',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  pendingLead: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
  },
  pendingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warning + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCopy: {
    flex: 1,
    gap: spacing[1],
  },
  pendingTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  pendingText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  pendingMetaRow: {
    gap: spacing[1],
  },
  pendingMetaLabel: {
    color: colors.neutral[800],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  pendingMetaValue: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  linkedCard: {
    gap: spacing[3],
  },
  linkedHeader: {
    gap: spacing[1],
  },
  linkedHeaderText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  linkedGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  linkedTile: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: spacing[2],
  },
  linkedTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTileTitle: {
    color: colors.neutral[700],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  linkedTileValue: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  linkedTileMeta: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  healthCard: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.light.card,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthCopy: {
    flex: 1,
    gap: spacing[1],
  },
  healthTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  healthText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[3],
  },
  activityHeaderText: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  activityLink: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
  emptyCard: {
    padding: 0,
  },
  activityList: {
    gap: spacing[3],
  },
  activityCard: {
    gap: spacing[3],
  },
  activityLead: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCopy: {
    flex: 1,
    gap: spacing[1],
  },
  activityTitle: {
    color: colors.neutral[900],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
  },
  activityMeta: {
    color: colors.neutral[600],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  activityReference: {
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  activityAside: {
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  activityAmount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  inflowAmount: {
    color: colors.success,
  },
  outflowAmount: {
    color: colors.neutral[900],
  },
  activityActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  inlineAction: {
    color: colors.primary[600],
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

export default PaymentsScreen;
