import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
import { formatCurrency, formatDate } from '@/utils/format';

import {
  getPaymentMethodDisplay,
  getPaymentMethodIcon,
  getPaymentPurposeDisplay,
  resolveLinkedPaymentTarget,
} from './memberPaymentsWorkflowShared';

type PaymentReviewNavigationProp = NativeStackNavigationProp<MainStackParamList, 'PaymentReview'>;
type PaymentReviewRouteProp = RouteProp<MainStackParamList, 'PaymentReview'>;

export const PaymentReviewScreen: React.FC = () => {
  const navigation = useNavigation<PaymentReviewNavigationProp>();
  const route = useRoute<PaymentReviewRouteProp>();
  const {
    patchDraft,
    setActivePayment,
    setLastVisitedRoute,
  } = useMemberPaymentsFlowStore();
  const {
    patchRepaymentDraft,
    repaymentDraft,
    setPendingRepaymentIntentId,
  } = useMemberLoanFlowStore();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentPurposeLabel = getPaymentPurposeDisplay(
    route.params.paymentPurposeType,
    route.params.paymentPurposeLabel ||
      route.params.targetLabel ||
      route.params.contributionTypeName ||
      route.params.purpose
  );
  const isLoanRepayment = route.params.paymentPurposeType === 'loan_repayment';
  const screenTitle = isLoanRepayment ? 'Review Repayment' : 'Review Payment';
  const heroTitle = isLoanRepayment
    ? 'Review your repayment before continuing.'
    : 'Review your payment before continuing.';
  const heroText = isLoanRepayment
    ? 'Confirm the repayment amount, method, and resulting balance before we send the repayment request.'
    : 'Confirm the purpose, target, amount, and payment method before we send the payment request.';
  const feeAmount = route.params.feeAmount || '0.00';
  const totalAmount = route.params.totalAmount || route.params.amount;
  const linkedTarget = resolveLinkedPaymentTarget({
    chamaId: route.params.chamaId,
    purposeType: route.params.paymentPurposeType,
    contributionId: route.params.contributionId,
    loanId: route.params.loanId,
    penaltyId: route.params.penaltyId,
  });

  useEffect(() => {
    setLastVisitedRoute('PaymentReview');
  }, [setLastVisitedRoute]);

  const methodMessage = useMemo(() => {
    switch (route.params.paymentMethod) {
      case 'paybill':
        return 'Paybill instructions are not available yet. Please choose another method.';
      case 'bank_transfer_placeholder':
        return 'Bank transfer is not available yet. Please choose another method.';
      default:
        return null;
    }
  }, [route.params.paymentMethod]);

  const handleBackToRepayment = () => {
    if (!route.params.loanId) {
      navigation.navigate('MemberLoans', { chamaId: route.params.chamaId });
      return;
    }

    navigation.navigate('LoanRepayment', {
      chamaId: route.params.chamaId,
      loanId: route.params.loanId,
      installmentId: route.params.installmentId,
      amount: route.params.amount,
      dueDate: route.params.dueDate,
      targetLabel: route.params.targetLabel,
      quickAmountOption: repaymentDraft?.quickAmountOption || undefined,
      entryPoint: 'loan_detail',
    });
  };

  const handleConfirm = async () => {
    if (!['mpesa', 'wallet_balance'].includes(route.params.paymentMethod as any)) {
      setError('Select a payment method to continue.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const intent = await memberPaymentsService.initiatePayment({
        chamaId: route.params.chamaId,
        amount: route.params.amount,
        currency: route.params.currency,
        paymentMethod: route.params.paymentMethod as any,
        purposeType: route.params.paymentPurposeType || 'contribution',
        phone: route.params.phone || '',
        contributionId: route.params.contributionId,
        contributionTypeId: route.params.contributionTypeId,
        contributionTypeName: route.params.contributionTypeName,
        loanId: route.params.loanId,
        installmentId: route.params.installmentId,
        penaltyId: route.params.penaltyId,
        targetLabel: route.params.targetLabel,
        description: route.params.targetLabel || paymentPurposeLabel,
      });

      if (isLoanRepayment) {
        patchRepaymentDraft({
          chamaId: route.params.chamaId,
          loanId: route.params.loanId || null,
          installmentId: route.params.installmentId || null,
          currency: route.params.currency,
          amount: route.params.amount,
          dueDate: route.params.dueDate || null,
          targetLabel: route.params.targetLabel || null,
          paymentMethod: route.params.paymentMethod,
          outstandingBalance: route.params.outstandingBalance || null,
          nextDueAmount: route.params.nextDueAmount || null,
          minimumDueAmount: route.params.minimumDueAmount || null,
          resultingBalanceEstimate: route.params.resultingBalanceEstimate || null,
          pendingReference: intent.reference || intent.reference_id || null,
        });
        setPendingRepaymentIntentId(intent.id);
      }

      patchDraft({
        chamaId: route.params.chamaId,
        paymentPurposeType: route.params.paymentPurposeType || 'contribution',
        paymentPurposeLabel,
        amount: route.params.amount,
        currency: route.params.currency,
        contributionId: route.params.contributionId || null,
        contributionTypeId: route.params.contributionTypeId || null,
        contributionTypeName: route.params.contributionTypeName || null,
        loanId: route.params.loanId || null,
        installmentId: route.params.installmentId || null,
        penaltyId: route.params.penaltyId || null,
        dueDate: route.params.dueDate || null,
        targetLabel: route.params.targetLabel || null,
        paymentMethod: route.params.paymentMethod,
        phone: route.params.phone || '',
        sourceRoute: route.params.sourceRoute || 'PaymentReview',
        feeAmount,
        totalAmount,
      });

      setActivePayment({
        intentId: intent.id,
        chamaId: route.params.chamaId,
        amount: route.params.amount,
        currency: route.params.currency,
        paymentPurposeType: route.params.paymentPurposeType || 'contribution',
        paymentPurposeLabel,
        paymentMethod: route.params.paymentMethod,
        status: intent.status,
        reference: intent.reference || intent.reference_id || null,
        contributionId: route.params.contributionId || null,
        loanId: route.params.loanId || null,
        installmentId: route.params.installmentId || null,
        penaltyId: route.params.penaltyId || null,
        targetLabel: route.params.targetLabel || null,
        createdAt: intent.created_at,
      });

      navigation.replace('PaymentStatus', {
        intentId: intent.id,
        chamaId: route.params.chamaId,
        status: intent.status,
        amount: route.params.amount,
        currency: route.params.currency,
        purpose: route.params.purpose || route.params.paymentPurposeType || 'contribution',
        paymentPurposeType: route.params.paymentPurposeType,
        paymentPurposeLabel,
        contributionTypeName: route.params.contributionTypeName,
        paymentMethod: route.params.paymentMethod,
        contributionId: route.params.contributionId,
        loanId: route.params.loanId,
        installmentId: route.params.installmentId,
        penaltyId: route.params.penaltyId,
        targetLabel: route.params.targetLabel,
        reference: intent.reference || intent.reference_id || intent.id,
      });
    } catch (serviceError) {
      const message =
        typeof serviceError === 'object' && serviceError && 'message' in serviceError
          ? String((serviceError as { message?: string }).message || '')
          : '';
      setError(message || (isLoanRepayment ? 'We couldn’t start your repayment right now.' : 'We couldn’t start your payment right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!route.params?.chamaId || !route.params?.amount) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernHeader title={screenTitle} showBack />
        <EmptyState
          title="Payment review unavailable"
          description={
            isLoanRepayment
              ? 'Go back and choose your repayment details again.'
              : 'Go back and choose your payment details again.'
          }
          icon="alert-circle-outline"
          style={styles.centerState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernHeader title={screenTitle} showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Review before you continue</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroText}>{heroText}</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>{isLoanRepayment ? 'Repayment purpose' : 'Payment purpose'}</Text>
            <Text style={styles.value}>{paymentPurposeLabel}</Text>
          </View>
          {route.params.targetLabel ? (
            <View style={styles.row}>
              <Text style={styles.label}>Target</Text>
              <Text style={styles.value}>{route.params.targetLabel}</Text>
            </View>
          ) : null}
          {route.params.contributionTypeName ? (
            <View style={styles.row}>
              <Text style={styles.label}>Contribution type</Text>
              <Text style={styles.value}>{route.params.contributionTypeName}</Text>
            </View>
          ) : null}
          {route.params.dueDate ? (
            <View style={styles.row}>
              <Text style={styles.label}>Due date</Text>
              <Text style={styles.value}>{formatDate(route.params.dueDate)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Payment method</Text>
            <View style={styles.valueWithIcon}>
              <Icon
                name={getPaymentMethodIcon(route.params.paymentMethod) as any}
                size={18}
                color={colors.primary[600]}
              />
              <Text style={styles.value}>{getPaymentMethodDisplay(route.params.paymentMethod)}</Text>
            </View>
          </View>
          {route.params.phone ? (
            <View style={styles.row}>
              <Text style={styles.label}>Phone number</Text>
              <Text style={styles.value}>{route.params.phone}</Text>
            </View>
          ) : null}
        </Card>

        <Card style={styles.totalsCard}>
          {route.params.outstandingBalance ? (
            <View style={styles.row}>
              <Text style={styles.label}>Outstanding before payment</Text>
              <Text style={styles.value}>
                {formatCurrency(route.params.outstandingBalance, route.params.currency)}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(route.params.amount, route.params.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fees</Text>
            <Text style={styles.value}>{formatCurrency(feeAmount, route.params.currency)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount, route.params.currency)}</Text>
          </View>
          {route.params.resultingBalanceEstimate ? (
            <View style={styles.row}>
              <Text style={styles.label}>Estimated balance after payment</Text>
              <Text style={styles.value}>
                {formatCurrency(route.params.resultingBalanceEstimate, route.params.currency)}
              </Text>
            </View>
          ) : null}
          <Text style={styles.reassuranceText}>
            {isLoanRepayment
              ? 'We only mark the repayment as complete after the provider confirms the transaction.'
              : 'We only mark the payment as complete after the provider confirms the transaction.'}
          </Text>
        </Card>

        {methodMessage ? (
          <Card style={styles.warningCard}>
            <Text style={styles.warningText}>{methodMessage}</Text>
          </Card>
        ) : null}

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={
              submitting
                ? isLoanRepayment
                  ? 'Starting repayment…'
                  : 'Starting payment…'
                : isLoanRepayment
                ? 'Confirm repayment'
                : 'Confirm and pay'
            }
            onPress={handleConfirm}
            loading={submitting}
            disabled={!!methodMessage}
          />
          <Button
            title={isLoanRepayment ? 'Edit repayment method' : 'Edit payment method'}
            variant="outline"
            onPress={() => navigation.navigate('PaymentMethod', {
              chamaId: route.params.chamaId,
              amount: route.params.amount,
              currency: route.params.currency,
              chamaName: route.params.chamaName,
              paymentPurposeType: route.params.paymentPurposeType,
              paymentPurposeLabel,
              purpose: route.params.purpose,
              contributionId: route.params.contributionId,
              contributionTypeId: route.params.contributionTypeId,
              contributionTypeName: route.params.contributionTypeName,
              dueDate: route.params.dueDate,
              mode: route.params.mode,
              penaltyId: route.params.penaltyId,
              loanId: route.params.loanId,
              installmentId: route.params.installmentId,
              targetLabel: route.params.targetLabel,
              sourceRoute: route.params.sourceRoute,
              feeAmount,
              totalAmount,
              prefilledPhone: route.params.phone,
              outstandingBalance: route.params.outstandingBalance,
              nextDueAmount: route.params.nextDueAmount,
              minimumDueAmount: route.params.minimumDueAmount,
              resultingBalanceEstimate: route.params.resultingBalanceEstimate,
            })}
          />
          {isLoanRepayment ? (
            <Button
              title="Edit repayment amount"
              variant="outline"
              onPress={handleBackToRepayment}
            />
          ) : null}
          <Button
            title={isLoanRepayment ? 'Back to Repayment' : 'Back to Wallet'}
            variant="ghost"
            onPress={() => {
              if (isLoanRepayment) {
                handleBackToRepayment();
                return;
              }
              navigateToWorkspaceTab(navigation as any, 'Payments', { chamaId: route.params.chamaId });
            }}
          />
          {linkedTarget ? (
            <Button
              title={`Open related ${linkedTarget.screen === 'LoanDetail' ? 'loan' : linkedTarget.screen === 'ContributionDetails' ? 'contribution' : 'penalty'}`}
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
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  heroCard: {
    backgroundColor: '#F8FFFB',
    borderWidth: 1,
    borderColor: '#D9F5E6',
    gap: spacing[2],
  },
  heroEyebrow: {
    color: colors.primary[700],
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: colors.neutral[900],
    fontSize: 26,
    lineHeight: 32,
    fontFamily: typography.fontFamily.bold,
  },
  heroText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 21,
  },
  summaryCard: {
    gap: spacing[3],
  },
  totalsCard: {
    gap: spacing[3],
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F7E7B0',
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
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    color: colors.neutral[900],
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  totalLabel: {
    color: colors.neutral[900],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semibold,
  },
  totalValue: {
    color: colors.neutral[900],
    fontSize: 26,
    fontFamily: typography.fontFamily.bold,
  },
  reassuranceText: {
    color: colors.neutral[600],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F8DFA0',
  },
  warningText: {
    color: '#9A6700',
    fontSize: typography.fontSize.sm,
  },
  errorCard: {
    backgroundColor: '#FFF5F4',
    borderWidth: 1,
    borderColor: '#FBD4CD',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    gap: spacing[3],
  },
});

export default PaymentReviewScreen;
