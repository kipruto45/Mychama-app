import type { MainStackParamList } from '@/navigation/types';
import type { Notification } from '@/types';

import type { MemberPaymentHistoryItem, MemberPaymentPurposeType } from '@/services/memberPaymentsService';

type PaymentNavigationTarget =
  | { screen: 'Payments'; params?: MainStackParamList['Payments'] }
  | { screen: 'PaymentStatus'; params: MainStackParamList['PaymentStatus'] }
  | { screen: 'PendingPaymentDetail'; params: MainStackParamList['PendingPaymentDetail'] }
  | { screen: 'Receipt'; params: MainStackParamList['Receipt'] }
  | { screen: 'ContributionDetails'; params: MainStackParamList['ContributionDetails'] }
  | { screen: 'LoanDetail'; params: MainStackParamList['LoanDetail'] }
  | { screen: 'Penalties'; params?: MainStackParamList['Penalties'] };

const pickString = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const normalizePurposeType = (value?: string | null): MemberPaymentPurposeType => {
  const lowered = String(value || '').toLowerCase();
  if (lowered === 'loan_repayment') return 'loan_repayment';
  if (['fine', 'fine_payment', 'penalty'].includes(lowered)) return 'fine_payment';
  if (['contribution', 'special_contribution'].includes(lowered)) return 'contribution';
  return 'one_time_charge';
};

const resolvePurposeLabel = (purposeType: MemberPaymentPurposeType, notification: Notification) => {
  switch (purposeType) {
    case 'loan_repayment':
      return 'Loan repayment';
    case 'fine_payment':
      return 'Fine payment';
    case 'one_time_charge':
      return notification.title || 'Payment';
    default:
      return 'Contribution';
  }
};

export const resolveMemberPaymentHistoryTarget = (
  item: MemberPaymentHistoryItem
): PaymentNavigationTarget => {
  if (['pending', 'initiated', 'processing'].includes(item.processingState)) {
    return {
      screen: 'PendingPaymentDetail',
      params: {
        intentId: item.intentId,
        chamaId: item.chamaId,
        amount: item.amount,
        currency: item.currency,
        purpose: item.purpose,
        paymentPurposeType: item.purposeType,
        paymentPurposeLabel: item.purposeLabel,
        contributionId: item.contributionId || undefined,
        loanId: item.loanId || undefined,
        installmentId: item.installmentId || undefined,
        penaltyId: item.penaltyId || undefined,
        targetLabel: item.targetLabel,
        paymentMethod: item.paymentMethod,
      },
    };
  }

  if (item.receiptAvailable) {
    return {
      screen: 'Receipt',
      params: {
        intentId: item.intentId,
        chamaId: item.chamaId,
        paymentPurposeType: item.purposeType,
        paymentPurposeLabel: item.purposeLabel,
        contributionTypeName: item.contributionTypeName || undefined,
        contributionId: item.contributionId || undefined,
        loanId: item.loanId || undefined,
        installmentId: item.installmentId || undefined,
        targetLabel: item.targetLabel,
      },
    };
  }

  return {
    screen: 'PaymentStatus',
    params: {
      intentId: item.intentId,
      chamaId: item.chamaId,
      status: item.status,
      amount: item.amount,
      currency: item.currency,
      purpose: item.purpose,
      paymentPurposeType: item.purposeType,
      paymentPurposeLabel: item.purposeLabel,
      contributionTypeName: item.contributionTypeName || undefined,
      paymentMethod: item.paymentMethod,
      failureReason: item.failureReason || undefined,
      contributionId: item.contributionId || undefined,
      loanId: item.loanId || undefined,
      installmentId: item.installmentId || undefined,
      penaltyId: item.penaltyId || undefined,
      targetLabel: item.targetLabel,
      reference: item.reference,
    },
  };
};

export const resolveMemberPaymentNotificationTarget = (
  notification: Notification
): PaymentNavigationTarget | null => {
  const payload = notification.data || {};
  const type = String(notification.type || '').toLowerCase();
  const chamaId = pickString(notification.chama_id, payload.chama_id, payload.chamaId);
  const paymentPurposeType = normalizePurposeType(
    pickString(payload.payment_purpose_type, payload.purpose, payload.type)
  );
  const paymentPurposeLabel = pickString(payload.paymentPurposeLabel, payload.payment_purpose_label) ||
    resolvePurposeLabel(paymentPurposeType, notification);
  const intentId = pickString(
    payload.intentId,
    payload.intent_id,
    payload.payment_intent_id,
    payload.paymentId,
    payload.payment_id
  );
  const contributionId = pickString(payload.contribution_id, payload.contributionId);
  const loanId = pickString(payload.loan_id, payload.loanId);
  const installmentId = pickString(payload.installment_id, payload.installmentId);
  const penaltyId = pickString(payload.penalty_id, payload.penaltyId);
  const targetLabel = pickString(payload.target_label, payload.targetLabel, payload.reference_label);

  if (type === 'payment_received' || type === 'receipt_ready' || type === 'contribution_payment_received') {
    if (!intentId) return null;
    return {
      screen: 'Receipt',
      params: {
        intentId,
        chamaId,
        paymentPurposeType,
        paymentPurposeLabel,
        contributionId,
        loanId,
        installmentId,
        targetLabel,
      },
    };
  }

  if (type === 'payment_pending' || type === 'pending_payment_updated' || type === 'contribution_payment_pending') {
    if (!intentId) return null;
      return {
        screen: 'PendingPaymentDetail',
        params: {
          intentId,
          chamaId,
          amount: pickString(payload.amount) || '0',
          currency: pickString(payload.currency) || 'KES',
          purpose: pickString(payload.purpose) || paymentPurposeType,
        paymentPurposeType,
        paymentPurposeLabel,
        contributionId,
        loanId,
        installmentId,
        penaltyId,
        targetLabel,
        paymentMethod: pickString(payload.payment_method, payload.paymentMethod),
      },
    };
  }

  if (type === 'payment_failed' || type === 'failed_payment_notice' || type === 'contribution_payment_failed') {
    if (!intentId) return null;
      return {
        screen: 'PaymentStatus',
        params: {
          intentId,
          chamaId,
          amount: pickString(payload.amount) || '0',
          currency: pickString(payload.currency) || 'KES',
          purpose: pickString(payload.purpose) || paymentPurposeType,
        paymentPurposeType,
        paymentPurposeLabel,
        contributionId,
        loanId,
        installmentId,
        penaltyId,
        targetLabel,
        paymentMethod: pickString(payload.payment_method, payload.paymentMethod),
        failureReason: pickString(payload.failure_reason, payload.failureReason),
      },
    };
  }

  if (
    ['contribution_due', 'contribution_reminder', 'contribution_overdue', 'loan_repayment_due', 'loan_repayment_reminder'].includes(
      type
    )
  ) {
    return {
      screen: 'Payments',
      params: {
        chamaId,
        entryPoint: 'notifications',
        preselectedPurpose: type.startsWith('loan') ? 'loan_repayment' : 'contribution',
        contributionId,
        loanId,
        installmentId,
        amount: pickString(payload.amount),
        dueDate: pickString(payload.due_date, payload.dueDate),
        targetLabel,
      },
    };
  }

  if (['fine_added', 'penalty_due', 'penalty_overdue'].includes(type)) {
    if (penaltyId) {
      return {
        screen: 'Payments',
        params: {
          chamaId,
          entryPoint: 'notifications',
          preselectedPurpose: 'fine_payment',
          penaltyId,
          amount: pickString(payload.amount, payload.outstanding_amount),
          dueDate: pickString(payload.due_date, payload.dueDate),
          targetLabel,
        },
      };
    }

    return {
      screen: 'Penalties',
      params: {
        chamaId,
        suggestedAmount: pickString(payload.amount, payload.outstanding_amount),
        reason: pickString(payload.reason),
      },
    };
  }

  if (loanId && (type.includes('loan') || paymentPurposeType === 'loan_repayment')) {
    return {
      screen: 'LoanDetail',
      params: { loanId, chamaId },
    };
  }

  if (contributionId) {
    return {
      screen: 'ContributionDetails',
      params: { contributionId, chamaId },
    };
  }

  return null;
};
