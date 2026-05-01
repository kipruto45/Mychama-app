import type { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme';
import type {
  MemberPaymentHistoryItem,
  MemberPaymentMethodType,
  MemberPaymentProcessingState,
  MemberPaymentPurposeType,
} from '@/services/memberPaymentsService';

export type PaymentHistoryFilterKey =
  NonNullable<NonNullable<MainStackParamList['PaymentHistory']>['filter']>;

export const PAYMENT_HISTORY_FILTERS: Array<{
  key: PaymentHistoryFilterKey;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'loan_repayments', label: 'Loan Repayments' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'successful', label: 'Successful' },
];

export const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return `254${digits}`;
};

export const getPaymentPurposeDisplay = (
  type?: MemberPaymentPurposeType | null,
  fallback?: string | null
) => {
  if (fallback) return fallback;
  switch (type) {
    case 'wallet_deposit':
      return 'Wallet deposit';
    case 'wallet_withdrawal':
      return 'Wallet withdrawal';
    case 'loan_repayment':
      return 'Loan repayment';
    case 'fine_payment':
      return 'Fine payment';
    case 'one_time_charge':
      return 'One-time charge';
    default:
      return 'Contribution';
  }
};

export const getPaymentPurposeSupportingText = (
  type?: MemberPaymentPurposeType | null
) => {
  switch (type) {
    case 'wallet_deposit':
      return 'Add money to your wallet securely.';
    case 'wallet_withdrawal':
      return 'Track the status of your withdrawal request.';
    case 'loan_repayment':
      return 'Stay on schedule with your next installment.';
    case 'fine_payment':
      return 'Clear outstanding member fines securely.';
    case 'one_time_charge':
      return 'Complete this one-time payment for your chama.';
    default:
      return 'Keep your contribution record healthy and up to date.';
  }
};

export const getPaymentMethodDisplay = (type?: string | MemberPaymentMethodType | null) => {
  switch (String(type || '').toLowerCase()) {
    case 'wallet_balance':
      return 'Wallet balance';
    case 'wallet':
      return 'Wallet';
    case 'bank':
      return 'Bank transfer';
    case 'bank_transfer_placeholder':
      return 'Bank transfer';
    case 'paybill':
      return 'Paybill';
    default:
      return 'M-Pesa';
  }
};

export const getPaymentMethodIcon = (type?: string | MemberPaymentMethodType | null) => {
  switch (String(type || '').toLowerCase()) {
    case 'wallet_balance':
      return 'wallet-outline';
    case 'wallet':
      return 'wallet-outline';
    case 'bank':
      return 'bank-outline';
    case 'bank_transfer_placeholder':
      return 'bank-outline';
    case 'paybill':
      return 'barcode-scan';
    default:
      return 'cellphone';
  }
};

export const getPaymentPurposeIcon = (type?: MemberPaymentPurposeType | null) => {
  switch (type) {
    case 'wallet_deposit':
      return 'wallet-plus-outline';
    case 'wallet_withdrawal':
      return 'wallet-arrow-up-outline';
    case 'loan_repayment':
      return 'cash-sync';
    case 'fine_payment':
      return 'alert-octagon-outline';
    case 'one_time_charge':
      return 'cash-fast';
    default:
      return 'calendar-month';
  }
};

export const getPaymentStateMeta = (state: MemberPaymentProcessingState) => {
  switch (state) {
    case 'success':
      return {
        title: 'Your payment was received successfully.',
        description: 'Your receipt is ready and your payment record has been updated.',
        icon: 'check-decagram',
        tint: colors.success,
        chipVariant: 'success' as const,
        chipLabel: 'Successful',
      };
    case 'pending':
    case 'initiated':
    case 'processing':
      return {
        title: 'Your payment is still being processed.',
        description: 'We are still confirming the transaction with the payment provider.',
        icon: 'progress-clock',
        tint: colors.warning,
        chipVariant: 'warning' as const,
        chipLabel: 'Pending',
      };
    case 'cancelled':
      return {
        title: 'This payment was cancelled.',
        description: 'You can restart the payment whenever you are ready.',
        icon: 'close-circle-outline',
        tint: colors.neutral[500],
        chipVariant: 'secondary' as const,
        chipLabel: 'Cancelled',
      };
    case 'expired':
      return {
        title: 'This payment request expired.',
        description: 'Start the payment again to receive a fresh prompt.',
        icon: 'timer-off-outline',
        tint: colors.neutral[500],
        chipVariant: 'secondary' as const,
        chipLabel: 'Expired',
      };
    default:
      return {
        title: 'We couldn’t complete your payment. Please try again.',
        description: 'Retry the payment or choose a different method if one becomes available.',
        icon: 'alert-circle',
        tint: colors.error,
        chipVariant: 'error' as const,
        chipLabel: 'Failed',
      };
  }
};

export const isPendingPayment = (payment: Pick<MemberPaymentHistoryItem, 'processingState'>) =>
  ['pending', 'initiated', 'processing'].includes(payment.processingState);

export const isFailedPayment = (payment: Pick<MemberPaymentHistoryItem, 'processingState'>) =>
  ['failed', 'cancelled', 'expired'].includes(payment.processingState);

export const isSuccessfulPayment = (payment: Pick<MemberPaymentHistoryItem, 'processingState'>) =>
  payment.processingState === 'success';

export const matchesPaymentHistoryFilter = (
  payment: MemberPaymentHistoryItem,
  filter: PaymentHistoryFilterKey
) => {
  switch (filter) {
    case 'contributions':
      return payment.purposeType === 'contribution' || payment.purposeType === 'fine_payment';
    case 'loan_repayments':
      return payment.purposeType === 'loan_repayment';
    case 'pending':
      return isPendingPayment(payment);
    case 'failed':
      return isFailedPayment(payment);
    case 'successful':
      return isSuccessfulPayment(payment);
    default:
      return true;
  }
};

export type MemberPaymentLinkedTarget =
  | { screen: 'ContributionDetails'; params: MainStackParamList['ContributionDetails'] }
  | { screen: 'LoanDetail'; params: MainStackParamList['LoanDetail'] }
  | { screen: 'Penalties'; params: MainStackParamList['Penalties'] };

export const resolveLinkedPaymentTarget = (input: {
  chamaId?: string | null;
  purposeType?: MemberPaymentPurposeType | null;
  contributionId?: string | null;
  loanId?: string | null;
  penaltyId?: string | null;
}) => {
  if (input.loanId) {
    return {
      screen: 'LoanDetail',
      params: {
        loanId: input.loanId,
        chamaId: input.chamaId || undefined,
      },
    } satisfies MemberPaymentLinkedTarget;
  }

  if (input.contributionId) {
    return {
      screen: 'ContributionDetails',
      params: {
        contributionId: input.contributionId,
        chamaId: input.chamaId || undefined,
      },
    } satisfies MemberPaymentLinkedTarget;
  }

  if (input.penaltyId || input.purposeType === 'fine_payment') {
    return {
      screen: 'Penalties',
      params: {
        chamaId: input.chamaId || undefined,
      },
    } satisfies MemberPaymentLinkedTarget;
  }

  return null;
};
