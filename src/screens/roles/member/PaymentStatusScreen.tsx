import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { memberLoanService } from '@/services/memberLoanService';
import { memberPaymentsService } from '@/services/memberPaymentsService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { useMemberPaymentsFlowStore } from '@/store/memberPaymentsFlowStore';
import { colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import {
  getPaymentMethodDisplay,
  getPaymentPurposeDisplay,
  getPaymentStateMeta,
  resolveLinkedPaymentTarget,
} from './memberPaymentsWorkflowShared';
import { getLoanRepaymentStatusMeta } from './memberLoanRepaymentWorkflowShared';

type PaymentStatusNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentStatus'>;
type PaymentStatusRouteProp = RouteProp<MainStackParamList, 'PaymentStatus'>;

const POLLABLE_STATUSES = new Set(['initiated', 'pending', 'processing']);

export const PaymentStatusScreen: React.FC = () => {
  const navigation = useNavigation<PaymentStatusNavigationProp>();
  const route = useRoute<PaymentStatusRouteProp>();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    activePayment,
    clearActivePayment,
    clearDraft,
    draft,
    patchDraft,
    setLastVisitedRoute,
    updateActivePayment,
  } = useMemberPaymentsFlowStore();
  const {
    clearRepaymentDraft,
    pendingRepaymentIntentId,
    setPendingRepaymentIntentId,
  } = useMemberLoanFlowStore();

  const [statusPayload, setStatusPayload] = useState<any>(null);
  const [loanSnapshot, setLoanSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intentId = route.params.intentId || activePayment?.intentId || null;

  useEffect(() => {
    setLastVisitedRoute('PaymentStatus');
  }, [setLastVisitedRoute]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const syncStatus = async (manual = false) => {
    if (!intentId) {
      setError('We couldn’t restore this payment right now.');
      setLoading(false);
      return;
    }

    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const payload = manual
        ? await memberPaymentsService.refreshPaymentStatus(intentId)
        : await memberPaymentsService.getPaymentStatus(intentId);
      setStatusPayload(payload);
      setError(null);

      const nextStatus = String(payload.intent?.status || '').toLowerCase();
      const reference = payload.intent?.reference || payload.receipt?.reference_number || null;
      updateActivePayment({ status: nextStatus, reference });

      if (POLLABLE_STATUSES.has(nextStatus)) {
        if (!pollRef.current) {
          pollRef.current = setInterval(() => {
            void syncStatus(true);
          }, 6000);
        }
      } else {
        stopPolling();
        clearActivePayment();
        if (nextStatus === 'success' || nextStatus === 'completed' || nextStatus === 'reconciled') {
          clearDraft();
        }
      }
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || 'This payment is still being confirmed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void syncStatus();
    return stopPolling;
  }, [intentId]);

  const currentIntent = statusPayload?.intent;
  const currentStatus = String(currentIntent?.status || route.params.status || activePayment?.status || '').toLowerCase();
  const processingState = memberPaymentsService.normalizeProcessingState(currentStatus);
  const paymentPurposeType =
    route.params.paymentPurposeType ||
    draft?.paymentPurposeType ||
    memberPaymentsService.normalizePurposeType(currentIntent?.purpose);
  const stateMeta =
    paymentPurposeType === 'loan_repayment'
      ? getLoanRepaymentStatusMeta(processingState)
      : getPaymentStateMeta(processingState);
  const paymentPurposeLabel = getPaymentPurposeDisplay(
    paymentPurposeType,
    route.params.paymentPurposeLabel || draft?.paymentPurposeLabel || route.params.targetLabel
  );
  const amount = currentIntent?.amount || route.params.amount || activePayment?.amount || draft?.amount || '0';
  const currency = currentIntent?.currency || route.params.currency || activePayment?.currency || draft?.currency || 'KES';
  const paymentMethod =
    currentIntent?.payment_method ||
    route.params.paymentMethod ||
    activePayment?.paymentMethod ||
    draft?.paymentMethod ||
    'mpesa';
  const resolvedChamaId =
    route.params.chamaId || activePayment?.chamaId || draft?.chamaId || currentIntent?.chama || undefined;
  const resolvedContributionId =
    route.params.contributionId ||
    draft?.contributionId ||
    currentIntent?.metadata?.contribution_id ||
    currentIntent?.contribution ||
    undefined;
  const resolvedContributionTypeName =
    route.params.contributionTypeName ||
    draft?.contributionTypeName ||
    currentIntent?.contribution_type ||
    currentIntent?.metadata?.contribution_type_name ||
    undefined;
  const resolvedLoanId =
    route.params.loanId || draft?.loanId || currentIntent?.metadata?.loan_id || undefined;
  const resolvedInstallmentId =
    route.params.installmentId ||
    draft?.installmentId ||
    currentIntent?.metadata?.installment_id ||
    undefined;
  const resolvedPenaltyId =
    route.params.penaltyId || draft?.penaltyId || currentIntent?.metadata?.penalty_id || undefined;
  const resolvedTargetLabel =
    route.params.targetLabel ||
    draft?.targetLabel ||
    currentIntent?.metadata?.target_label ||
    currentIntent?.metadata?.installment_label ||
    undefined;
  const reference = currentIntent?.reference || route.params.reference || activePayment?.reference || 'Pending reference';
  const linkedTarget = resolveLinkedPaymentTarget({
    chamaId: resolvedChamaId,
    purposeType: paymentPurposeType,
    contributionId: resolvedContributionId,
    loanId: resolvedLoanId,
    penaltyId: resolvedPenaltyId,
  });
  const supportsGenericRetry =
    paymentPurposeType !== 'wallet_deposit' && paymentPurposeType !== 'wallet_withdrawal';
  const isLoanRepayment = paymentPurposeType === 'loan_repayment';
  const screenTitle = isLoanRepayment ? 'Repayment Status' : 'Payment Status';
  const summaryTitle = isLoanRepayment ? 'Repayment summary' : 'Payment summary';
  const loadingCopy = isLoanRepayment ? 'Checking your repayment status…' : 'Checking your payment status…';
  const retryTitle = isLoanRepayment ? 'Retry Repayment' : 'Retry Payment';
  const backTitle = isLoanRepayment ? 'Back to Loan' : 'Back to Wallet';
  const historyTitle = isLoanRepayment ? 'View Repayment History' : 'View Wallet Activity';
  const pendingTitle = isLoanRepayment ? 'Pending Repayment' : 'Pending Details';
  const emptyDescription = isLoanRepayment
    ? 'We couldn’t restore this repayment. Please start it again from your active loan.'
    : 'We couldn’t restore this payment. Please start it again from Wallet.';
  const loanBackAction = () => {
    if (resolvedLoanId) {
      navigation.navigate('LoanDetail', { loanId: resolvedLoanId, chamaId: resolvedChamaId });
      return;
    }
    navigation.navigate('MemberLoans', { chamaId: resolvedChamaId });
  };

  useEffect(() => {
    if (!isLoanRepayment || !intentId) {
      return;
    }

    if (POLLABLE_STATUSES.has(currentStatus)) {
      if (pendingRepaymentIntentId !== intentId) {
        setPendingRepaymentIntentId(intentId);
      }
      return;
    }

    if (pendingRepaymentIntentId === intentId) {
      setPendingRepaymentIntentId(null);
    }
    if (processingState === 'success') {
      clearRepaymentDraft();
    }
  }, [
    clearRepaymentDraft,
    currentStatus,
    intentId,
    isLoanRepayment,
    pendingRepaymentIntentId,
    processingState,
    setPendingRepaymentIntentId,
  ]);

  useEffect(() => {
    let mounted = true;

    if (!isLoanRepayment || !resolvedChamaId || !resolvedLoanId) {
      setLoanSnapshot(null);
      return () => {
        mounted = false;
      };
    }

    memberLoanService
      .getActiveLoanDetail(resolvedChamaId, resolvedLoanId)
      .then((response) => {
        if (mounted) {
          setLoanSnapshot(response);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoanSnapshot(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isLoanRepayment, resolvedChamaId, resolvedLoanId, processingState]);

  const retryParams: MainStackParamList['PaymentMethod'] | null = resolvedChamaId && supportsGenericRetry
    ? {
        chamaId: resolvedChamaId,
        amount,
        currency,
        paymentPurposeType,
        paymentPurposeLabel,
        purpose: currentIntent?.purpose || route.params.purpose,
        contributionId: resolvedContributionId,
        contributionTypeId:
          draft?.contributionTypeId ||
          currentIntent?.metadata?.contribution_type_id ||
          route.params.contributionId,
        contributionTypeName: resolvedContributionTypeName,
        dueDate: draft?.dueDate || undefined,
        mode: paymentPurposeType === 'fine_payment' ? 'penalty' : 'contribution',
        penaltyId: resolvedPenaltyId,
        loanId: resolvedLoanId,
        installmentId: resolvedInstallmentId,
      targetLabel: resolvedTargetLabel,
      sourceRoute: 'PaymentStatus',
      prefilledPhone: draft?.phone || currentIntent?.phone || undefined,
      feeAmount: draft?.feeAmount || String(currentIntent?.metadata?.fee_amount || '0.00'),
      totalAmount: draft?.totalAmount || String(currentIntent?.metadata?.total_amount || amount),
    }
    : null;

  const handleRetry = () => {
    if (!retryParams) {
      setError('We couldn’t restore this payment right now.');
      return;
    }

    patchDraft({
      chamaId: retryParams.chamaId,
      paymentPurposeType: retryParams.paymentPurposeType || null,
      paymentPurposeLabel: retryParams.paymentPurposeLabel || null,
      amount: retryParams.amount,
      currency: retryParams.currency,
      contributionId: retryParams.contributionId || null,
      contributionTypeId: retryParams.contributionTypeId || null,
      contributionTypeName: retryParams.contributionTypeName || null,
      loanId: retryParams.loanId || null,
      installmentId: retryParams.installmentId || null,
      penaltyId: retryParams.penaltyId || null,
      dueDate: retryParams.dueDate || null,
      targetLabel: retryParams.targetLabel || null,
      paymentMethod: draft?.paymentMethod || null,
      phone: retryParams.prefilledPhone || '',
      sourceRoute: 'PaymentStatusRetry',
      feeAmount: retryParams.feeAmount || null,
      totalAmount: retryParams.totalAmount || null,
    });

    navigation.navigate('PaymentMethod', retryParams);
  };

  if (!intentId) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={screenTitle} showBack />
        <EmptyState
          title={isLoanRepayment ? 'Repayment not found' : 'Payment not found'}
          description={emptyDescription}
          icon="alert-circle-outline"
          style={styles.centerState}
          action={{
            label: backTitle,
            onPress: () =>
              isLoanRepayment ? loanBackAction() : navigateToWorkspaceTab(navigation as any, 'Payments'),
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={screenTitle} showBack />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centerText}>{loadingCopy}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title={screenTitle} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: `${stateMeta.tint}14` }]}>
            <Icon name={stateMeta.icon as any} size={34} color={stateMeta.tint} />
          </View>
          <Text style={styles.heroTitle}>{stateMeta.title}</Text>
          <Text style={styles.heroText}>{stateMeta.description}</Text>
          <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{summaryTitle}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Purpose</Text>
            <Text style={styles.summaryValue}>{paymentPurposeLabel}</Text>
          </View>
          {resolvedTargetLabel ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Target</Text>
              <Text style={styles.summaryValue}>{resolvedTargetLabel}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(amount, currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment method</Text>
            <Text style={styles.summaryValue}>{getPaymentMethodDisplay(paymentMethod)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Reference</Text>
            <Text style={styles.summaryValue}>{reference}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & time</Text>
            <Text style={styles.summaryValue}>
              {formatDateTime(
                currentIntent?.completed_at ||
                  currentIntent?.created_at ||
                  activePayment?.createdAt ||
                  new Date().toISOString()
              )}
            </Text>
          </View>
        </Card>

        {isLoanRepayment && loanSnapshot ? (
          <Card style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Updated loan balance</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding balance</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(
                  loanSnapshot.total_due || loanSnapshot.outstanding_principal || '0',
                  currency
                )}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Outstanding principal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(loanSnapshot.outstanding_principal || '0', currency)}
              </Text>
            </View>
            {loanSnapshot.due_date ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Next loan due date</Text>
                <Text style={styles.summaryValue}>{formatDateTime(loanSnapshot.due_date)}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {error ? (
          <Card style={styles.messageCard}>
            <Text style={styles.messageText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          {processingState === 'success' ? (
            <Button
              title="View Receipt"
              onPress={() =>
                navigation.navigate('Receipt', {
                  intentId,
                  chamaId: resolvedChamaId,
                  paymentPurposeType,
                  paymentPurposeLabel,
                  contributionTypeName: resolvedContributionTypeName,
                  contributionId: resolvedContributionId,
                  loanId: resolvedLoanId,
                  installmentId: resolvedInstallmentId,
                  targetLabel: resolvedTargetLabel,
                })
              }
            />
          ) : null}

          {POLLABLE_STATUSES.has(currentStatus) ? (
            <>
              <Button
                title={refreshing ? 'Refreshing…' : 'Refresh Status'}
                onPress={() => void syncStatus(true)}
                loading={refreshing}
              />
              <Button
                title={pendingTitle}
                variant="outline"
                onPress={() =>
                  navigation.navigate('PendingPaymentDetail', {
                    intentId,
                    chamaId: resolvedChamaId,
                    amount,
                    currency,
                    purpose: currentIntent?.purpose || route.params.purpose,
                    paymentPurposeType,
                    paymentPurposeLabel,
                    contributionId: resolvedContributionId,
                    loanId: resolvedLoanId,
                    installmentId: resolvedInstallmentId,
                    penaltyId: resolvedPenaltyId,
                    targetLabel: resolvedTargetLabel,
                    paymentMethod,
                  })
                }
              />
            </>
          ) : null}

          {['failed', 'cancelled', 'expired'].includes(processingState) ? (
            <Button title={retryTitle} onPress={handleRetry} />
          ) : null}

          <Button
            title={historyTitle}
            variant="outline"
            onPress={() => {
              if (isLoanRepayment && resolvedLoanId) {
                navigation.navigate('LoanRepaymentHistory', {
                  loanId: resolvedLoanId,
                  chamaId: resolvedChamaId,
                });
                return;
              }
              navigation.navigate('PaymentHistory', { chamaId: resolvedChamaId });
            }}
          />
          <Button
            title={backTitle}
            variant="outline"
            onPress={() => {
              if (isLoanRepayment) {
                loanBackAction();
                return;
              }
              navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: resolvedChamaId });
            }}
          />
          {linkedTarget ? (
            <Button
              title={`Go to ${linkedTarget.screen === 'LoanDetail' ? 'Loan Details' : linkedTarget.screen === 'ContributionDetails' ? 'Contribution Details' : 'Penalty Details'}`}
              variant="ghost"
              onPress={() => (navigation as any).navigate(linkedTarget.screen, linkedTarget.params)}
            />
          ) : null}
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
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  centerText: {
    marginTop: spacing[3],
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[6],
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  heroText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
  summaryCard: {
    gap: spacing[3],
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  messageCard: {
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F8DFA0',
  },
  messageText: {
    color: '#9A6700',
    fontSize: typography.fontSize.sm,
  },
  actions: {
    gap: spacing[3],
  },
});

export default PaymentStatusScreen;
