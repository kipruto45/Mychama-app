import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { memberPaymentsService } from '@/services/memberPaymentsService';
import { useMemberLoanFlowStore } from '@/store/memberLoanFlowStore';
import { useMemberPaymentsFlowStore } from '@/store/memberPaymentsFlowStore';
import { borderRadius, colors, spacing, typography } from '@/theme';
import { formatCurrency, formatDateTime } from '@/utils/format';

import {
  getPaymentMethodDisplay,
  getPaymentPurposeDisplay,
  getPaymentStateMeta,
  resolveLinkedPaymentTarget,
} from './memberPaymentsWorkflowShared';
import { getLoanRepaymentStatusMeta } from './memberLoanRepaymentWorkflowShared';

type PendingPaymentNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PendingPaymentDetail'>;
type PendingPaymentRouteProp = RouteProp<MainStackParamList, 'PendingPaymentDetail'>;

export const PendingPaymentDetailScreen: React.FC = () => {
  const navigation = useNavigation<PendingPaymentNavigationProp>();
  const route = useRoute<PendingPaymentRouteProp>();
  const pulse = useRef(new Animated.Value(0.35)).current;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intentId = route.params.intentId || activePayment?.intentId || null;

  useEffect(() => {
    setLastVisitedRoute('PendingPaymentDetail');
  }, [setLastVisitedRoute]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

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
      updateActivePayment({
        status: nextStatus,
        reference: payload.intent?.reference || payload.receipt?.reference_number || null,
      });

      if (!['initiated', 'pending', 'processing'].includes(nextStatus)) {
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
  }, [intentId]);

  const currentIntent = statusPayload?.intent;
  const currentStatus = String(currentIntent?.status || activePayment?.status || 'pending').toLowerCase();
  const processingState = memberPaymentsService.normalizeProcessingState(currentStatus || 'pending');
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
  const reference = currentIntent?.reference || activePayment?.reference || 'Pending reference';
  const resolvedChamaId =
    route.params.chamaId || activePayment?.chamaId || draft?.chamaId || currentIntent?.chama || undefined;
  const resolvedContributionId =
    route.params.contributionId ||
    draft?.contributionId ||
    currentIntent?.metadata?.contribution_id ||
    currentIntent?.contribution ||
    undefined;
  const resolvedLoanId =
    route.params.loanId || draft?.loanId || currentIntent?.metadata?.loan_id || undefined;
  const resolvedInstallmentId =
    route.params.installmentId || draft?.installmentId || currentIntent?.metadata?.installment_id || undefined;
  const resolvedPenaltyId =
    route.params.penaltyId || draft?.penaltyId || currentIntent?.metadata?.penalty_id || undefined;
  const resolvedTargetLabel =
    route.params.targetLabel ||
    draft?.targetLabel ||
    currentIntent?.metadata?.target_label ||
    currentIntent?.metadata?.installment_label ||
    undefined;
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
  const screenTitle = isLoanRepayment ? 'Pending Repayment' : 'Pending Payment';
  const summaryTitle = isLoanRepayment ? 'Pending repayment summary' : 'Pending payment summary';
  const loadingCopy = isLoanRepayment ? 'Checking your pending repayment…' : 'Checking your pending payment…';
  const retryTitle = isLoanRepayment ? 'Retry Repayment' : 'Retry Payment';
  const statusTitle = isLoanRepayment ? 'Open Repayment Status' : 'Open Payment Status';
  const historyTitle = isLoanRepayment ? 'View Repayment History' : 'View History';
  const backTitle = isLoanRepayment ? 'Back to Loan' : 'Back to Wallet';
  const heroTitle =
    processingState === 'pending' || processingState === 'initiated' || processingState === 'processing'
      ? isLoanRepayment
        ? 'Your repayment is still being processed.'
        : 'Your payment is still being processed.'
      : stateMeta.title;
  const heroText =
    processingState === 'pending' || processingState === 'initiated' || processingState === 'processing'
      ? isLoanRepayment
        ? 'We are waiting for the provider to confirm the repayment. You can refresh safely without restarting the flow.'
        : 'We are waiting for the provider to confirm the transaction. You can refresh safely without restarting the payment.'
      : stateMeta.description;
  const infoText = isLoanRepayment
    ? 'We’ll keep checking the provider status. If the repayment succeeds, your receipt will be ready here. If it fails, you can retry without losing the repayment context.'
    : 'We’ll keep checking the provider status. If the payment succeeds, your receipt will be ready here. If it fails, you can retry without losing the payment context.';
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

    if (['initiated', 'pending', 'processing'].includes(currentStatus)) {
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
          undefined,
        contributionTypeName:
          draft?.contributionTypeName ||
          currentIntent?.metadata?.contribution_type_name ||
          undefined,
        dueDate: draft?.dueDate || undefined,
        mode: paymentPurposeType === 'fine_payment' ? 'penalty' : 'contribution',
        penaltyId: resolvedPenaltyId,
        loanId: resolvedLoanId,
        installmentId: resolvedInstallmentId,
        targetLabel: resolvedTargetLabel,
        sourceRoute: 'PendingPaymentDetail',
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
      sourceRoute: 'PendingPaymentRetry',
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
          description={
            isLoanRepayment
              ? 'We couldn’t restore this pending repayment. Open your active loan to start again.'
              : 'We couldn’t restore this pending payment. Open Wallet to start again.'
          }
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
          <Animated.View style={[styles.pendingPulse, { opacity: pulse }]} />
          <View style={styles.heroIcon}>
            <Icon name={stateMeta.icon as any} size={34} color={stateMeta.tint} />
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroText}>{heroText}</Text>
          <Badge label={stateMeta.chipLabel} variant={stateMeta.chipVariant} size="sm" />
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{summaryTitle}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Purpose</Text>
            <Text style={styles.value}>{paymentPurposeLabel}</Text>
          </View>
          {resolvedTargetLabel ? (
            <View style={styles.row}>
              <Text style={styles.label}>Target</Text>
              <Text style={styles.value}>{resolvedTargetLabel}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(amount, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>{getPaymentMethodDisplay(paymentMethod)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>
              {formatDateTime(currentIntent?.created_at || activePayment?.createdAt || new Date().toISOString())}
            </Text>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next</Text>
          <Text style={styles.infoText}>{infoText}</Text>
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={refreshing ? 'Refreshing…' : 'Refresh Status'}
            onPress={() => void syncStatus(true)}
            loading={refreshing}
          />

          {processingState === 'success' ? (
            <Button
              title="View Receipt"
              onPress={() =>
                navigation.navigate('Receipt', {
                  intentId,
                  chamaId: resolvedChamaId,
                  paymentPurposeType,
                  paymentPurposeLabel,
                  contributionId: resolvedContributionId,
                  loanId: resolvedLoanId,
                  installmentId: resolvedInstallmentId,
                  targetLabel: resolvedTargetLabel,
                })
              }
            />
          ) : null}

          {['failed', 'cancelled', 'expired'].includes(processingState) ? (
            <Button title={retryTitle} onPress={handleRetry} />
          ) : null}

          <Button
            title={statusTitle}
            variant="outline"
            onPress={() =>
              navigation.replace('PaymentStatus', {
                intentId,
                chamaId: resolvedChamaId,
                status: currentStatus,
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
                reference,
              })
            }
          />
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
              title={`Open ${linkedTarget.screen === 'LoanDetail' ? 'Loan Details' : linkedTarget.screen === 'ContributionDetails' ? 'Contribution Details' : 'Penalty Details'}`}
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
    overflow: 'hidden',
  },
  pendingPulse: {
    position: 'absolute',
    top: 18,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFEEC2',
  },
  heroIcon: {
    marginTop: spacing[2],
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF7E8',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  },
  label: {
    flex: 1,
    color: colors.neutral[500],
    fontSize: typography.fontSize.sm,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  infoCard: {
    backgroundColor: '#F8FFFB',
    borderWidth: 1,
    borderColor: '#D9F5E6',
    gap: spacing[2],
  },
  infoTitle: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  infoText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F8DFA0',
  },
  errorText: {
    color: '#9A6700',
    fontSize: typography.fontSize.sm,
  },
  actions: {
    gap: spacing[3],
  },
});

export default PendingPaymentDetailScreen;
