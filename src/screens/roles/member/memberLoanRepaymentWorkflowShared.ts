import type { LoanInstallment } from '@/types';
import type { MemberPaymentHistoryItem } from '@/services/memberPaymentsService';
import type {
  MemberPaymentMethodType,
  MemberPaymentProcessingState,
} from '@/services/memberPaymentsService';
import type { MainStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

export type LoanRepaymentDueState = 'no_repayment_due' | 'upcoming' | 'due' | 'overdue';
export type LoanRepaymentInstallmentState = 'unpaid' | 'due_soon' | 'paid' | 'overdue';
export type LoanRepaymentPaymentState = MemberPaymentProcessingState;
export type LoanRepaymentEntryPoint = NonNullable<MainStackParamList['LoanRepayment']>['entryPoint'];

type RepaymentDraftLike = {
  chamaId?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  amount?: string;
  dueDate?: string | null;
  targetLabel?: string | null;
  quickAmountOption?: 'next_due' | 'full_outstanding' | 'custom' | null;
  paymentMethod?: MemberPaymentMethodType | null;
  sourceEntryPoint?: string | null;
};

export const normalizeRepaymentDueState = (status?: string | null): LoanRepaymentDueState => {
  const lowered = String(status || '').toLowerCase();
  if (lowered === 'overdue') {
    return 'overdue';
  }
  if (lowered === 'due') {
    return 'due';
  }
  if (['upcoming', 'partial', 'partially_paid'].includes(lowered)) {
    return 'upcoming';
  }
  return 'no_repayment_due';
};

export const normalizeInstallmentState = (
  installment?: Pick<LoanInstallment, 'status'> | null
): LoanRepaymentInstallmentState => {
  const lowered = String(installment?.status || '').toLowerCase();
  if (lowered === 'paid') {
    return 'paid';
  }
  if (lowered === 'overdue') {
    return 'overdue';
  }
  if (lowered === 'due') {
    return 'due_soon';
  }
  return 'unpaid';
};

export const getRepaymentDueStateMeta = (state: LoanRepaymentDueState) => {
  switch (state) {
    case 'overdue':
      return {
        label: 'Overdue',
        tone: 'error' as const,
        icon: 'alert-circle',
        tint: colors.error,
        title: 'You have an overdue repayment.',
        description: 'Review the overdue installment and complete your repayment as soon as you can.',
      };
    case 'due':
      return {
        label: 'Due',
        tone: 'warning' as const,
        icon: 'calendar-clock-outline',
        tint: colors.warning,
        title: 'A repayment is due now.',
        description: 'Choose how much you want to repay and continue securely.',
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        tone: 'info' as const,
        icon: 'calendar-month-outline',
        tint: colors.info,
        title: 'Your next repayment is coming up.',
        description: 'Review the schedule and get ready to repay before the due date.',
      };
    default:
      return {
        label: 'No due amount',
        tone: 'success' as const,
        icon: 'check-circle-outline',
        tint: colors.success,
        title: 'No repayment is due right now.',
        description: 'Your schedule is up to date. You can still review your loan details and history.',
      };
  }
};

export const getInstallmentStateMeta = (state: LoanRepaymentInstallmentState) => {
  switch (state) {
    case 'paid':
      return {
        label: 'Paid',
        tone: 'success' as const,
      };
    case 'overdue':
      return {
        label: 'Overdue',
        tone: 'error' as const,
      };
    case 'due_soon':
      return {
        label: 'Due now',
        tone: 'warning' as const,
      };
    default:
      return {
        label: 'Upcoming',
        tone: 'info' as const,
      };
  }
};

export const getLoanRepaymentEntryMeta = (
  entryPoint?: LoanRepaymentEntryPoint | string | null
) => {
  switch (entryPoint) {
    case 'wallet':
    case 'payments':
      return {
        label: 'Opened from Wallet',
        message: 'Review your loan balance, choose an amount, then continue securely.',
      };
    case 'notifications':
      return {
        label: 'Opened from Reminder',
        message: 'You came in from a repayment reminder. Confirm the installment details before paying.',
      };
    case 'alerts':
      return {
        label: 'Opened from Alert',
        message: 'An overdue or due-soon alert brought you here. Review the amount and continue calmly.',
      };
    case 'deep_link':
      return {
        label: 'Opened from Secure Link',
        message: 'Your repayment details were restored from a secure link. Review them before continuing.',
      };
    case 'repayment_schedule':
      return {
        label: 'Opened from Schedule',
        message: 'This repayment was prefilled from your schedule. Adjust the amount if needed.',
      };
    default:
      return null;
  }
};

export const getLoanRepaymentStatusMeta = (state: LoanRepaymentPaymentState) => {
  switch (state) {
    case 'success':
      return {
        title: 'Your repayment was received successfully.',
        description: 'Your repayment record and receipt are ready.',
        chipLabel: 'Successful',
        chipVariant: 'success' as const,
        icon: 'check-decagram',
        tint: colors.success,
      };
    case 'pending':
    case 'initiated':
    case 'processing':
      return {
        title: 'Your repayment is still being processed.',
        description: 'We are still confirming the repayment with the payment provider.',
        chipLabel: 'Pending',
        chipVariant: 'warning' as const,
        icon: 'progress-clock',
        tint: colors.warning,
      };
    case 'cancelled':
      return {
        title: 'This repayment was cancelled.',
        description: 'You can restart the repayment whenever you are ready.',
        chipLabel: 'Cancelled',
        chipVariant: 'secondary' as const,
        icon: 'close-circle-outline',
        tint: colors.neutral[500],
      };
    case 'expired':
      return {
        title: 'This repayment request expired.',
        description: 'Start the repayment again to receive a fresh payment prompt.',
        chipLabel: 'Expired',
        chipVariant: 'secondary' as const,
        icon: 'timer-off-outline',
        tint: colors.neutral[500],
      };
    default:
      return {
        title: 'We couldn’t complete your repayment. Please try again.',
        description: 'Retry the repayment or return to your active loan for the latest balance.',
        chipLabel: 'Failed',
        chipVariant: 'error' as const,
        icon: 'alert-circle',
        tint: colors.error,
      };
  }
};

export const buildRepaymentTargetLabel = (input: {
  dueDate?: string | null;
  installmentId?: string | null;
  fallback?: string | null;
}) => {
  if (input.fallback) {
    return input.fallback;
  }
  if (input.dueDate) {
    return `Installment due ${input.dueDate}`;
  }
  if (input.installmentId) {
    return 'Loan installment repayment';
  }
  return 'Active loan repayment';
};

export const sumInstallments = (installments: Array<Pick<LoanInstallment, 'expected_amount' | 'paid_amount'>>) =>
  installments
    .reduce((sum, item) => sum + Number(item.expected_amount || 0) - Number(item.paid_amount || 0), 0)
    .toFixed(2);

export const hasRestorableLoanRepaymentDraft = (
  draft: RepaymentDraftLike | null | undefined,
  chamaId?: string | null
) => {
  if (!draft?.loanId || !draft?.amount) {
    return false;
  }

  if (chamaId && draft.chamaId && draft.chamaId !== chamaId) {
    return false;
  }

  return true;
};

export const buildLoanRepaymentResumeParams = (input: {
  draft?: RepaymentDraftLike | null;
  fallbackLoanId?: string | null;
  fallbackChamaId?: string | null;
  fallbackEntryPoint?: LoanRepaymentEntryPoint;
}) => {
  const draft = input.draft;
  const loanId = draft?.loanId || input.fallbackLoanId;
  if (!loanId) {
    return null;
  }

  return {
    loanId,
    chamaId: draft?.chamaId || input.fallbackChamaId || undefined,
    installmentId: draft?.installmentId || undefined,
    amount: draft?.amount || undefined,
    dueDate: draft?.dueDate || undefined,
    targetLabel: draft?.targetLabel || undefined,
    quickAmountOption: draft?.quickAmountOption || undefined,
    entryPoint:
      (draft?.sourceEntryPoint as LoanRepaymentEntryPoint | null | undefined) ||
      input.fallbackEntryPoint ||
      'loans',
  } satisfies MainStackParamList['LoanRepayment'];
};

export const buildPendingLoanRepaymentParams = (input: {
  intentId?: string | null;
  chamaId?: string | null;
  loanId?: string | null;
  installmentId?: string | null;
  amount?: string | null;
  currency: string;
  targetLabel?: string | null;
  paymentMethod?: MemberPaymentMethodType | null;
}) => {
  if (!input.intentId || !input.loanId || !input.amount) {
    return null;
  }

  return {
    intentId: input.intentId,
    chamaId: input.chamaId || undefined,
    amount: input.amount,
    currency: input.currency,
    purpose: 'loan_repayment',
    paymentPurposeType: 'loan_repayment',
    paymentPurposeLabel: 'Loan repayment',
    loanId: input.loanId,
    installmentId: input.installmentId || undefined,
    targetLabel: input.targetLabel || 'Active loan repayment',
    paymentMethod: input.paymentMethod || 'mpesa',
  } satisfies MainStackParamList['PendingPaymentDetail'];
};

export const isLoanRepaymentPayment = (
  item: Pick<MemberPaymentHistoryItem, 'purposeType'>
) => item.purposeType === 'loan_repayment';

export const filterLoanRepaymentHistory = (
  rows: MemberPaymentHistoryItem[],
  loanId?: string | null
) =>
  rows.filter((item) => {
    if (item.purposeType !== 'loan_repayment') {
      return false;
    }
    if (!loanId) {
      return true;
    }
    return item.loanId === loanId;
  });
